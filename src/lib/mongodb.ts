import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable in .env.local'
  );
}

/**
 * Cached connection to avoid creating a new Mongoose connection on every
 * serverless function invocation (warm reuse pattern).
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the global type to hold our cache
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Establishes and caches a MongoDB connection via Mongoose.
 * Reuses existing connections in serverless environments for efficiency.
 * 
 * @returns Promise that resolves to the Mongoose instance
 * @throws Error if MONGODB_URI is not defined
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Fail fast if Atlas is unreachable (5s)
      socketTimeoutMS: 45000, // Close inactive sockets after 45s
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
