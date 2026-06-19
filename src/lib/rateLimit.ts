import mongoose, { Schema, model, models } from 'mongoose';

// Fallback in-memory map for unit tests and local/fallback purposes
export const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

const RateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true },
    resetAt: { type: Date, required: true },
  }
);

// TTL Index: expire document when resetAt is reached (expireAfterSeconds: 0)
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit =
  models.RateLimit || model('RateLimit', RateLimitSchema);

/**
 * MongoDB-backed rate limiter with fallback to in-memory map.
 * Ensures reliability in serverless environments like Vercel and keeps tests passing.
 */
export async function checkRateLimit(
  userId: string,
  limit: number,
  keyPrefix: string = ""
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const key = keyPrefix ? `${userId}:${keyPrefix}` : userId;
  const now = Date.now();

  // If in test environment or MongoDB is not connected, fallback to in-memory map
  if (process.env.NODE_ENV === 'test' || mongoose.connection.readyState !== 1) {
    const userLimit = rateLimitMap.get(key);

    if (!userLimit || now > userLimit.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return { allowed: true };
    }

    if (userLimit.count >= limit) {
      const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }

    userLimit.count++;
    return { allowed: true };
  }

  try {
    const doc = await RateLimit.findOne({ key });
    if (!doc || now > doc.resetAt.getTime()) {
      // Create or reset the window
      const resetAt = new Date(now + RATE_LIMIT_WINDOW_MS);
      await RateLimit.findOneAndUpdate(
        { key },
        { $set: { count: 1, resetAt } },
        { upsert: true, new: true }
      );
      return { allowed: true };
    }

    if (doc.count >= limit) {
      const retryAfter = Math.ceil((doc.resetAt.getTime() - now) / 1000);
      return { allowed: false, retryAfter };
    }

    await RateLimit.findOneAndUpdate({ key }, { $inc: { count: 1 } });
    return { allowed: true };
  } catch (err) {
    console.error('[RateLimit DB Error, falling back to memory]', err);
    // Graceful fallback to memory limiter on DB query failure
    const userLimit = rateLimitMap.get(key);

    if (!userLimit || now > userLimit.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return { allowed: true };
    }

    if (userLimit.count >= limit) {
      const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }

    userLimit.count++;
    return { allowed: true };
  }
}
