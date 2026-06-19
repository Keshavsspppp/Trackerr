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
  status: z.string().refine(isValidStatus, {
    message: 'Invalid status value. Must be one of: Applied, Interview, Offer, Rejected',
  }).optional(),
  appliedDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'appliedDate must be a valid date string',
  }).optional(),
  jobUrl: z.string().max(1000, 'Posting URL is too long (max 1000 characters)').optional(),
  notes: z.string().max(5000, 'Notes are too long (max 5000 characters)').optional(),
  source: z.string().refine((val) => ['manual', 'extension', 'csv_import'].includes(val), {
    message: 'source must be one of: manual, extension, csv_import',
  }).optional(),
  capturedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'capturedAt must be a valid date string',
  }).optional(),
  originalUrl: z.string().optional(),
});

export const updateApplicationSchema = z.object({
  company: z.string().trim().min(1, 'company and role are required').max(100, 'Company name is too long (max 100 characters)').optional(),
  role: z.string().trim().min(1, 'company and role are required').max(100, 'Role name is too long (max 100 characters)').optional(),
  status: z.string().refine(isValidStatus, {
    message: 'Invalid status value. Must be one of: Applied, Interview, Offer, Rejected',
  }).optional(),
  appliedDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'appliedDate must be a valid date string',
  }).optional(),
  jobUrl: z.string().max(1000, 'Posting URL is too long (max 1000 characters)').optional(),
  notes: z.string().max(5000, 'Notes are too long (max 5000 characters)').optional(),
  source: z.string().refine((val) => ['manual', 'extension', 'csv_import'].includes(val), {
    message: 'source must be one of: manual, extension, csv_import',
  }).optional(),
  capturedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'capturedAt must be a valid date string',
  }).optional(),
  originalUrl: z.string().optional(),
  snoozedUntil: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'snoozedUntil must be a valid date string',
  }).optional().nullable(),
});
