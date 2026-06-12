import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import type { NextAuthOptions } from 'next-auth';

// Fail fast if NEXTAUTH_SECRET is not defined
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not defined');
}

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
    async signIn({ user }) {
      // Optional: restrict to specific email domains
      // Uncomment and customize for production use
      // const allowedDomains = ['example.com', 'company.com'];
      // const email = user.email?.toLowerCase() ?? '';
      // const domain = email.split('@')[1];
      // if (!allowedDomains.includes(domain)) {
      //   return false; // Reject sign-in
      // }
      return true;
    },
    async session({ session, token }) {
      // Attach the user's sub (Google ID) and email to the session so API routes
      // can scope queries to the correct userId and store email for reminders.
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
};
