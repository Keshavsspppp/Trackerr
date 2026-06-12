import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import type { NextAuthOptions } from 'next-auth';

// Lazily create the MongoClient for the NextAuth adapter.
// We can't use the Mongoose cached connection here because the adapter
// expects a raw MongoClient promise, not a Mongoose connection.
const clientPromise: Promise<MongoClient> = (async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }
  const client = new MongoClient(uri);
  return client.connect();
})();

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      // Attach the user's sub (Google ID) to the session so API routes
      // can scope queries to the correct userId.
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};
