export interface CSVImportResult {
  successCount: number;
  skippedCount: number;
  errors: Array<{ row: number; reason: string }>;
}

/**
 * Imports applications from a CSV file.
 * 
 * Expected CSV columns: company, role, status, appliedDate, jobUrl, notes
 * Required fields: company, role
 * 
 * Performs bulk import in a single request to prevent rate-limit 429 errors.
 * 
 * @param file The CSV file to import
 * @param userId The ID of the authenticated user
 * @returns Summary of import results
 */
export async function importApplicationsFromCSV(
  file: File,
  userId: string
): Promise<CSVImportResult> {
  const result: CSVImportResult = {
    successCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    // Read file as text
    const text = await file.text();
    // Split on \r\n or \n to support Windows line endings correctly
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      result.errors.push({ row: 0, reason: 'Empty file' });
      return result;
    }

    // Parse header row
    const headers = parseCSVLine(lines[0]);
    const columnMap = mapColumns(headers);

    const batchData: Array<Record<string, unknown>> = [];
    const rowMapping: number[] = [];

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const values = parseCSVLine(lines[i]);

      // Validate row has same number of columns as header
      if (values.length !== headers.length) {
        result.errors.push({
          row: rowNumber,
          reason: 'Column count mismatch',
        });
        result.skippedCount++;
        continue;
      }

      // Extract values using column map
      const company = values[columnMap.company]?.trim();
      const role = values[columnMap.role]?.trim();
      const status = values[columnMap.status]?.trim();
      const appliedDate = values[columnMap.appliedDate]?.trim();
      const jobUrl = values[columnMap.jobUrl]?.trim();
      const notes = values[columnMap.notes]?.trim();

      // Validate required fields
      if (!company) {
        result.errors.push({
          row: rowNumber,
          reason: 'Missing required field: company',
        });
        result.skippedCount++;
        continue;
      }

      if (!role) {
        result.errors.push({
          row: rowNumber,
          reason: 'Missing required field: role',
        });
        result.skippedCount++;
        continue;
      }

      // Validate status enum if provided
      const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
      if (status && !validStatuses.includes(status)) {
        result.errors.push({
          row: rowNumber,
          reason: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
        });
        result.skippedCount++;
        continue;
      }

      // Validate appliedDate if provided
      if (appliedDate) {
        const date = new Date(appliedDate);
        if (isNaN(date.getTime())) {
          result.errors.push({
            row: rowNumber,
            reason: `Invalid date format: ${appliedDate}`,
          });
          result.skippedCount++;
          continue;
        }
      }

      // Build request body for this row
      const body: Record<string, unknown> = {
        company,
        role,
        source: 'csv_import',
      };

      if (status) body.status = status;
      if (appliedDate) body.appliedDate = appliedDate;
      if (jobUrl) body.jobUrl = jobUrl;
      if (notes) body.notes = notes;

      batchData.push(body);
      rowMapping.push(rowNumber);
    }

    if (batchData.length > 0) {
      try {
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchData),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const generalError = (errorData as { error?: string }).error || 'API request failed';
          
          for (const rowNum of rowMapping) {
            result.errors.push({
              row: rowNum,
              reason: generalError,
            });
            result.skippedCount++;
          }
        } else {
          const resData = await res.json();
          result.successCount += resData.insertedCount || 0;

          if (resData.errors && Array.isArray(resData.errors)) {
            for (const err of resData.errors) {
              const rowNum = rowMapping[err.index];
              result.errors.push({
                row: rowNum,
                reason: err.error,
              });
              result.skippedCount++;
            }
          }
        }
      } catch (err) {
        for (const rowNum of rowMapping) {
          result.errors.push({
            row: rowNum,
            reason: 'Network error',
          });
          result.skippedCount++;
        }
      }
    }

    return result;
  } catch (err) {
    result.errors.push({
      row: 0,
      reason: err instanceof Error ? err.message : 'Failed to parse CSV file',
    });
    return result;
  }
}

/**
 * Parses a single CSV line, handling quoted fields with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Maps CSV columns to expected field names
 */
function mapColumns(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {
    company: -1,
    role: -1,
    status: -1,
    appliedDate: -1,
    jobUrl: -1,
    notes: -1,
  };

  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().trim();
    if (normalized === 'company') map.company = index;
    else if (normalized === 'role') map.role = index;
    else if (normalized === 'status') map.status = index;
    else if (normalized === 'applieddate') map.appliedDate = index;
    else if (normalized === 'joburl') map.jobUrl = index;
    else if (normalized === 'notes') map.notes = index;
  });

  return map;
}
