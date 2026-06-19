import type { IApplication } from '@/src/components/ApplicationList';

/**
 * Exports applications to CSV format and triggers browser download.
 * 
 * CSV columns: company, role, status, appliedDate, jobUrl, notes, lastUpdated
 * Filename pattern: trackerr-export-YYYY-MM-DD.csv
 */
export function exportApplicationsToCSV(applications: IApplication[]): void {
  // Define CSV header
  const headers = ['company', 'role', 'status', 'appliedDate', 'jobUrl', 'notes', 'lastUpdated'];
  
  // Convert applications to CSV rows
  const rows = applications.map(app => [
    escapeCSVField(app.company),
    escapeCSVField(app.role),
    escapeCSVField(app.status),
    escapeCSVField(app.appliedDate ? new Date(app.appliedDate).toISOString() : ''),
    escapeCSVField(app.jobUrl || ''),
    escapeCSVField(app.notes || ''),
    escapeCSVField(new Date(app.lastUpdated).toISOString()),
  ]);
  
  // Combine header and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
  
  // Create Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Generate filename with current date
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `trackerr-export-${today}.csv`;
  
  // Create download link and trigger click
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapes a CSV field value according to RFC 4180.
 * - Wraps fields containing commas, quotes, or newlines in double quotes
 * - Escapes double quotes by doubling them
 */
function escapeCSVField(value: string): string {
  if (!value) return '';
  
  // Check if field needs quoting
  const needsQuoting = /[",\n\r]/.test(value);
  
  if (needsQuoting) {
    // Escape double quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return value;
}
