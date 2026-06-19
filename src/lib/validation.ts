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
  }).trim().min(1, 'company and role are required'),
  role: z.string({
    required_error: 'company and role are required',
  }).trim().min(1, 'company and role are required'),
  status: z.string().refine(isValidStatus, {
    message: 'Invalid status value. Must be one of: Applied, Interview, Offer, Rejected',
  }).optional(),
  appliedDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'appliedDate must be a valid date string',
  }).optional(),
  jobUrl: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().refine((val) => ['manual', 'extension', 'csv_import'].includes(val), {
    message: 'source must be one of: manual, extension, csv_import',
  }).optional(),
  capturedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'capturedAt must be a valid date string',
  }).optional(),
  originalUrl: z.string().optional(),
});

export const updateApplicationSchema = z.object({
  status: z.string().refine(isValidStatus, {
    message: 'Invalid status value. Must be one of: Applied, Interview, Offer, Rejected',
  }).optional(),
  appliedDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'appliedDate must be a valid date string',
  }).optional(),
  jobUrl: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().refine((val) => ['manual', 'extension', 'csv_import'].includes(val), {
    message: 'source must be one of: manual, extension, csv_import',
  }).optional(),
  capturedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'capturedAt must be a valid date string',
  }).optional(),
  originalUrl: z.string().optional(),
});
