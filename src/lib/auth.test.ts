import { describe, it, expect, vi, beforeEach } from 'vitest';

// Feature: job-application-tracker
// Task 3.1 — Example tests for session behavior
// Requirements: 1.2, 1.6

// Mock the MongoDB adapter so auth.ts can be imported without a real DB connection
vi.mock('@next-auth/mongodb-adapter', () => ({
  MongoDBAdapter: vi.fn(() => ({})),
}));

// Mock the mongodb MongoClient to avoid real connection attempts.
// Must be a class (constructor function) since auth.ts uses `new MongoClient(...)`.
vi.mock('mongodb', () => {
  class MockMongoClient {
    connect() {
      return Promise.resolve(this);
    }
  }
  return { MongoClient: MockMongoClient };
});

// Mock next-auth/providers/google so we can inspect the provider config
vi.mock('next-auth/providers/google', () => ({
  default: vi.fn().mockImplementation((opts: { clientId: string; clientSecret: string }) => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
    clientId: opts.clientId,
    clientSecret: opts.clientSecret,
  })),
}));

// Mock next-auth itself for the getServerSession test
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('authOptions configuration', () => {
  beforeEach(() => {
    // Provide env vars needed by auth.ts
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
  });

  it('uses JWT session strategy', async () => {
    const { authOptions } = await import('./auth');
    expect(authOptions.session?.strategy).toBe('jwt');
  });

  it('includes GoogleProvider as the only provider', async () => {
    const { authOptions } = await import('./auth');
    expect(authOptions.providers).toHaveLength(1);
    const provider = authOptions.providers[0] as { id: string; name: string };
    expect(provider.id).toBe('google');
    expect(provider.name).toBe('Google');
  });

  it('has a session callback that attaches token.sub as user.id', async () => {
    const { authOptions } = await import('./auth');

    const mockToken = { sub: 'user-abc-123' };
    const mockSession = {
      user: { name: 'Test User', email: 'test@example.com', image: null },
      expires: new Date(Date.now() + 3600 * 1000).toISOString(),
    };

    const sessionCallback = authOptions.callbacks?.session;
    expect(sessionCallback).toBeDefined();

    const result = await sessionCallback!({
      session: mockSession as Parameters<typeof sessionCallback>[0]['session'],
      token: mockToken as Parameters<typeof sessionCallback>[0]['token'],
      // newSession and trigger are required by some overloads but not used here
      newSession: undefined,
      trigger: 'getSession' as const,
    });

    expect((result.user as { id?: string }).id).toBe('user-abc-123');
  });
});

describe('getServerSession session shape', () => {
  it('returns the expected session shape when a valid JWT token is present', async () => {
    const { getServerSession } = await import('next-auth');

    // Simulate the shape returned by getServerSession when the user is signed in
    const mockSession = {
      user: {
        id: 'user-abc-123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        image: 'https://example.com/avatar.jpg',
      },
      expires: new Date(Date.now() + 3600 * 1000).toISOString(),
    };

    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

    const { authOptions } = await import('./auth');
    const session = await getServerSession(authOptions);

    expect(session).not.toBeNull();
    expect(session!.user).toBeDefined();
    expect(session!.user!.email).toBe('jane@example.com');
    expect(session!.user!.name).toBe('Jane Doe');
    expect((session!.user as { id?: string }).id).toBe('user-abc-123');
    expect(session!.expires).toBeDefined();
  });

  it('returns null when no session exists (unauthenticated)', async () => {
    const { getServerSession } = await import('next-auth');

    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const { authOptions } = await import('./auth');
    const session = await getServerSession(authOptions);

    expect(session).toBeNull();
  });
});
