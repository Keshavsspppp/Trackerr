import { z } from 'zod';

export const VALID_STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'] as const;
export type ValidStatus = (typeof VALID_STATUSES)[number];

export function isValidStatus(value: unknown): value is ValidStatus {
  return (
    typeof value === 'string' &&
    (VALID_STATUSES as readonly string[]).includes(value)
  );
}

export const createApplicationSchema = z.object({
  company: z.string({
    required_error: 'company and role are required',
  }).trim().min(1, 'company and role are required').max(100, 'Company name is too long (max 100 characters)'),
  role: z.string({
    required_error: 'company and role are required',
  }).trim().min(1, 'company and role are required').max(100, 'Role name is too long (max 100 characters)'),
  status: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().refine(isValidStatus, {
      message: 'Invalid status value. Must be one of: Applied, Interview, Offer, Rejected',
    }).optional()
  ),
  appliedDate: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'appliedDate must be a valid date string',
    }).optional()
  ),
  jobUrl: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(1000, 'Posting URL is too long (max 1000 characters)').optional()
  ),
  notes: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(5000, 'Notes are too long (max 5000 characters)').optional()
  ),
  source: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().refine((val) => ['manual', 'extension', 'csv_import'].includes(val), {
      message: 'source must be one of: manual, extension, csv_import',
    }).optional()
  ),
  capturedAt: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'capturedAt must be a valid date string',
    }).optional()
  ),
  originalUrl: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
});

export const updateApplicationSchema = z.object({
  company: z.string().trim().min(1, 'company and role are required').max(100, 'Company name is too long (max 100 characters)').optional(),
  role: z.string().trim().min(1, 'company and role are required').max(100, 'Role name is too long (max 100 characters)').optional(),
  status: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().refine(isValidStatus, {
      message: 'Invalid status value. Must be one of: Applied, Interview, Offer, Rejected',
    }).optional()
  ),
  appliedDate: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'appliedDate must be a valid date string',
    }).optional()
  ),
  jobUrl: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(1000, 'Posting URL is too long (max 1000 characters)').optional()
  ),
  notes: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(5000, 'Notes are too long (max 5000 characters)').optional()
  ),
  source: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().refine((val) => ['manual', 'extension', 'csv_import'].includes(val), {
      message: 'source must be one of: manual, extension, csv_import',
    }).optional()
  ),
  capturedAt: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'capturedAt must be a valid date string',
    }).optional()
  ),
  originalUrl: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  snoozedUntil: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'snoozedUntil must be a valid date string',
    }).optional().nullable()
  ),
});
