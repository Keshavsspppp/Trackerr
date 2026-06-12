/**
 * Shared validation utilities for job application data.
 */

export const VALID_STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'] as const;
export type ValidStatus = (typeof VALID_STATUSES)[number];

/**
 * Type guard to check if a value is a valid application status.
 * 
 * @param value - The value to check
 * @returns true if the value is one of the valid status strings
 * 
 * @example
 * ```ts
 * if (isValidStatus(req.body.status)) {
 *   // TypeScript knows status is ValidStatus here
 * }
 * ```
 */
export function isValidStatus(value: unknown): value is ValidStatus {
  return (
    typeof value === 'string' &&
    (VALID_STATUSES as readonly string[]).includes(value)
  );
}
