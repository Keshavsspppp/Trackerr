/**
 * Simple in-memory rate limiter map shared between API routes and unit tests.
 * Declared here instead of inside Next.js routes to avoid Next.js Route validation errors.
 */
export const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export function checkRateLimit(
  userId: string,
  limit: number,
  keyPrefix: string = ""
): { allowed: boolean; retryAfter?: number } {
  const key = keyPrefix ? `${userId}:${keyPrefix}` : userId;
  const now = Date.now();
  const userLimit = rateLimitMap.get(key);

  if (!userLimit || now > userLimit.resetAt) {
    // First request or window expired — reset
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (userLimit.count >= limit) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  userLimit.count++;
  return { allowed: true };
}
