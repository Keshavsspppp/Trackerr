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
    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      result.errors.push({ row: 0, reason: 'Empty file' });
      return result;
    }

    // Parse header row
    const headers = rows[0];
    const columnMap = mapColumns(headers);

    // Early validation check: fail fast if required header columns are missing
    if (columnMap.company === -1 || columnMap.role === -1) {
      const missingFields = [];
      if (columnMap.company === -1) missingFields.push('company');
      if (columnMap.role === -1) missingFields.push('role');
      result.errors.push({
        row: 1,
        reason: `Missing required CSV column header(s): ${missingFields.join(', ')}`,
      });
      return result;
    }

    const batchData: Array<Record<string, unknown>> = [];
    const rowMapping: number[] = [];

    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const rowNumber = i + 1;
      const values = rows[i];

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
      const status = columnMap.status !== -1 ? values[columnMap.status]?.trim() : undefined;
      const appliedDate = columnMap.appliedDate !== -1 ? values[columnMap.appliedDate]?.trim() : undefined;
      const jobUrl = columnMap.jobUrl !== -1 ? values[columnMap.jobUrl]?.trim() : undefined;
      const notes = columnMap.notes !== -1 ? values[columnMap.notes]?.trim() : undefined;

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
 * Parses the entire CSV file content character-by-character.
 * Correctly handles commas, newlines, and escaped quotes inside double quotes.
 */
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      row.push(current);
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      // End of row
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip the '\n'
      }
      row.push(current);
      // Only push non-empty rows
      if (row.length > 1 || row[0] !== '') {
        result.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  // Add the final field and row if any leftovers
  if (row.length > 0 || current !== '') {
    row.push(current);
    if (row.length > 1 || row[0] !== '') {
      result.push(row);
    }
  }

  return result;
}

/**
 * Maps CSV columns to expected field names, supporting common aliases
 */
export function mapColumns(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {
    company: -1,
    role: -1,
    status: -1,
    appliedDate: -1,
    jobUrl: -1,
    notes: -1,
  };

  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[\s\-_]/g, ''));

  const companyAliases = ['company', 'employer', 'organization', 'organisation', 'companyname'];
  const roleAliases = ['role', 'position', 'jobtitle', 'title', 'job'];
  const statusAliases = ['status', 'stage', 'state', 'applicationstatus'];
  const appliedDateAliases = ['applieddate', 'dateapplied', 'date'];
  const jobUrlAliases = ['joburl', 'url', 'link', 'joblink', 'posting', 'postingurl'];
  const notesAliases = ['notes', 'note', 'comments', 'comment', 'description', 'details'];

  // 1. First pass: exact matches after normalization
  normalizedHeaders.forEach((normalized, index) => {
    if (normalized === 'company') map.company = index;
    else if (normalized === 'role') map.role = index;
    else if (normalized === 'status') map.status = index;
    else if (normalized === 'applieddate') map.appliedDate = index;
    else if (normalized === 'joburl') map.jobUrl = index;
    else if (normalized === 'notes') map.notes = index;
  });

  // 2. Second pass: fallback alias matches
  normalizedHeaders.forEach((normalized, index) => {
    if (map.company === -1 && companyAliases.includes(normalized)) map.company = index;
    if (map.role === -1 && roleAliases.includes(normalized)) map.role = index;
    if (map.status === -1 && statusAliases.includes(normalized)) map.status = index;
    if (map.appliedDate === -1 && appliedDateAliases.includes(normalized)) map.appliedDate = index;
    if (map.jobUrl === -1 && jobUrlAliases.includes(normalized)) map.jobUrl = index;
    if (map.notes === -1 && notesAliases.includes(normalized)) map.notes = index;
  });

  return map;
}
