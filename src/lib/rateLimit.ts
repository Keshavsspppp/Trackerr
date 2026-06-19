/**
 * Simple in-memory rate limiter map shared between API routes and unit tests.
 * Declared here instead of inside Next.js routes to avoid Next.js Route validation errors.
 */
export const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
