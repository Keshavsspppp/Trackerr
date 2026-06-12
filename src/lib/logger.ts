/**
 * Safe error logging that sanitizes stack traces in production.
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Logs an error to the console, sanitizing sensitive information in production.
 * 
 * @param context - A label describing where the error occurred (e.g., '[POST /api/applications]')
 * @param error - The error to log
 * 
 * @example
 * ```ts
 * try {
 *   await dangerousOperation();
 * } catch (err) {
 *   logError('[MyOperation]', err);
 *   return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 * }
 * ```
 */
export function logError(context: string, error: unknown): void {
  if (isProduction) {
    // In production, log only the message (no stack trace)
    if (error instanceof Error) {
      console.error(`${context} ${error.name}: ${error.message}`);
    } else {
      console.error(`${context}`, String(error));
    }
  } else {
    // In development, log the full error with stack trace
    console.error(context, error);
  }
}
