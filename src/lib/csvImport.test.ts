import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseCSV, mapColumns, importApplicationsFromCSV } from './csvImport';

describe('CSV Parsing (parseCSV)', () => {
  it('correctly parses standard comma-separated lines', () => {
    const csv = 'company,role,status\nGoogle,Software Intern,Applied\nMeta,Production Intern,Interview';
    const result = parseCSV(csv);
    expect(result).toEqual([
      ['company', 'role', 'status'],
      ['Google', 'Software Intern', 'Applied'],
      ['Meta', 'Production Intern', 'Interview'],
    ]);
  });

  it('correctly handles commas inside quotes', () => {
    const csv = 'company,role,notes\n"Google, Inc.","Software, Engineering Intern",Applied\n';
    const result = parseCSV(csv);
    expect(result).toEqual([
      ['company', 'role', 'notes'],
      ['Google, Inc.', 'Software, Engineering Intern', 'Applied'],
    ]);
  });

  it('correctly handles escaped double quotes inside quotes', () => {
    const csv = 'company,role\n"Google ""Search""","Engineer Intern"';
    const result = parseCSV(csv);
    expect(result).toEqual([
      ['company', 'role'],
      ['Google "Search"', 'Engineer Intern'],
    ]);
  });

  it('correctly handles newlines inside quotes', () => {
    const csv = 'company,notes\nGoogle,"Line 1\nLine 2\r\nLine 3"';
    const result = parseCSV(csv);
    expect(result).toEqual([
      ['company', 'notes'],
      ['Google', 'Line 1\nLine 2\r\nLine 3'],
    ]);
  });

  it('filters out empty rows', () => {
    const csv = 'company,role\nGoogle,Intern\n\n\nMeta,Intern\n';
    const result = parseCSV(csv);
    expect(result).toEqual([
      ['company', 'role'],
      ['Google', 'Intern'],
      ['Meta', 'Intern'],
    ]);
  });
});

describe('CSV Header Mapping (mapColumns)', () => {
  it('identifies exact lowercase matches', () => {
    const headers = ['company', 'role', 'status', 'applieddate', 'joburl', 'notes'];
    const map = mapColumns(headers);
    expect(map).toEqual({
      company: 0,
      role: 1,
      status: 2,
      appliedDate: 3,
      jobUrl: 4,
      notes: 5,
    });
  });

  it('identifies normalized alias headers with spaces/underscores/casing', () => {
    const headers = ['Company Name', 'Job_Title', 'Stage', 'Date Applied', 'Job Link', 'Comments'];
    const map = mapColumns(headers);
    expect(map).toEqual({
      company: 0,
      role: 1,
      status: 2,
      appliedDate: 3,
      jobUrl: 4,
      notes: 5,
    });
  });

  it('returns -1 for completely missing headers', () => {
    const headers = ['company', 'role'];
    const map = mapColumns(headers);
    expect(map).toEqual({
      company: 0,
      role: 1,
      status: -1,
      appliedDate: -1,
      jobUrl: -1,
      notes: -1,
    });
  });
});

describe('CSV Application Import (importApplicationsFromCSV)', () => {
  const userId = 'user-import-test';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('returns early with error if company or role headers are missing', async () => {
    const csvContent = 'company,status\nGoogle,Applied';
    const mockFile = {
      text: () => Promise.resolve(csvContent),
    } as unknown as File;

    const result = await importApplicationsFromCSV(mockFile, userId);
    expect(result.successCount).toBe(0);
    expect(result.skippedCount).toBe(0);
    expect(result.errors).toEqual([
      { row: 1, reason: 'Missing required CSV column header(s): role' },
    ]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns early with error for completely empty file', async () => {
    const csvContent = '';
    const mockFile = {
      text: () => Promise.resolve(csvContent),
    } as unknown as File;

    const result = await importApplicationsFromCSV(mockFile, userId);
    expect(result.successCount).toBe(0);
    expect(result.errors).toEqual([
      { row: 0, reason: 'Empty file' },
    ]);
  });

  it('successfully batches and posts valid applications to the API', async () => {
    const csvContent = 'company,role,status,appliedDate,jobUrl,notes\nGoogle,SWE Intern,Applied,2026-06-20,https://google.com,great job';
    const mockFile = {
      text: () => Promise.resolve(csvContent),
    } as unknown as File;

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ insertedCount: 1 }),
    };
    vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

    const result = await importApplicationsFromCSV(mockFile, userId);
    expect(result.successCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    expect(result.errors).toEqual([]);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/applications',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          {
            company: 'Google',
            role: 'SWE Intern',
            source: 'csv_import',
            status: 'Applied',
            appliedDate: '2026-06-20',
            jobUrl: 'https://google.com',
            notes: 'great job',
          },
        ]),
      })
    );
  });

  it('skips rows with validation errors before making API requests', async () => {
    const csvContent = [
      'company,role,status,appliedDate',
      ',SWE Intern,Applied,2026-06-20',              // missing company
      'Google,,Applied,2026-06-20',                   // missing role
      'Meta,SWE Intern,InvalidStatus,2026-06-20',     // invalid status
      'Apple,SWE Intern,Applied,invalid-date',        // invalid date
    ].join('\n');

    const mockFile = {
      text: () => Promise.resolve(csvContent),
    } as unknown as File;

    const result = await importApplicationsFromCSV(mockFile, userId);
    expect(result.successCount).toBe(0);
    expect(result.skippedCount).toBe(4);
    expect(result.errors).toEqual([
      { row: 2, reason: 'Missing required field: company' },
      { row: 3, reason: 'Missing required field: role' },
      { row: 4, reason: 'Invalid status: InvalidStatus. Must be one of: Applied, Interview, Offer, Rejected' },
      { row: 5, reason: 'Invalid date format: invalid-date' },
    ]);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
