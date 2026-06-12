// Feature: job-application-tracker, Property 11: Protected routes reject unauthenticated requests
// Validates: Requirements 1.3, 1.4, 9.1

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Mocks — must be declared before any dynamic import of the module under test
// ---------------------------------------------------------------------------

// Mock next-auth/jwt so we can control whether getToken returns a token or null
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

// Mock next/server — provide minimal NextResponse and NextRequest implementations
// that behave correctly for the redirect / next() calls the middleware makes.
vi.mock('next/server', () => {
  // A minimal NextResponse that records the type of response created
  class MockNextResponse {
    readonly type: 'redirect' | 'next';
    readonly location: string | undefined;

    constructor(type: 'redirect' | 'next', location?: string) {
      this.type = type;
      this.location = location;
    }

    static redirect(url: URL | string) {
      return new MockNextResponse('redirect', url.toString());
    }

    static next() {
      return new MockNextResponse('next');
    }
  }

  // A minimal NextRequest that satisfies the getToken() call shape
  class MockNextRequest {
    readonly url: string;
    readonly nextUrl: URL;
    readonly headers: Headers;
    readonly cookies: { get: (name: string) => undefined };

    constructor(url: string) {
      this.url = url;
      this.nextUrl = new URL(url);
      this.headers = new Headers();
      this.cookies = { get: () => undefined };
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock NextRequest for the given path (e.g. "/dashboard/jobs") */
function makeMockRequest(path: string) {
  const { NextRequest } = require('next/server');
  return new NextRequest(`http://localhost${path}`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('middleware — Property 11: Protected routes reject unauthenticated requests', () => {
  let getToken: ReturnType<typeof vi.fn>;
  let middleware: (req: unknown) => Promise<unknown>;

  beforeEach(async () => {
    vi.resetModules();

    // Re-apply mocks after module reset
    vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }));
    vi.mock('next/server', () => {
      class MockNextResponse {
        readonly type: 'redirect' | 'next';
        readonly location: string | undefined;
        constructor(type: 'redirect' | 'next', location?: string) {
          this.type = type;
          this.location = location;
        }
        static redirect(url: URL | string) {
          return new MockNextResponse('redirect', url.toString());
        }
        static next() {
          return new MockNextResponse('next');
        }
      }
      class MockNextRequest {
        readonly url: string;
        readonly nextUrl: URL;
        readonly headers: Headers;
        readonly cookies: { get: (name: string) => undefined };
        constructor(url: string) {
          this.url = url;
          this.nextUrl = new URL(url);
          this.headers = new Headers();
          this.cookies = { get: () => undefined };
        }
      }
      return { NextResponse: MockNextResponse, NextRequest: MockNextRequest };
    });

    const jwtModule = await import('next-auth/jwt');
    getToken = vi.mocked(jwtModule.getToken);

    const middlewareModule = await import('./proxy');
    middleware = middlewareModule.middleware;
  });

  // -------------------------------------------------------------------------
  // Property: any sub-path under /dashboard/ WITHOUT a token → redirect to /
  // -------------------------------------------------------------------------
  it('redirects unauthenticated requests for any /dashboard/* sub-path', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary sub-paths (URL-safe: letters/digits/hyphens)
        fc.stringMatching(/^[a-zA-Z0-9\-/]{0,40}$/),
        async (subPath) => {
          getToken.mockResolvedValue(null); // no token — unauthenticated

          const path = `/dashboard/${subPath}`;
          const req = makeMockRequest(path);
          const response = (await middleware(req)) as {
            type: string;
            location: string;
          };

          expect(response.type).toBe('redirect');
          expect(response.location).toMatch(/^http:\/\/localhost\/$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Property: any sub-path under /api/applications/ WITHOUT a token → redirect
  // -------------------------------------------------------------------------
  it('redirects unauthenticated requests for any /api/applications/* sub-path', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-zA-Z0-9\-/]{0,40}$/),
        async (subPath) => {
          getToken.mockResolvedValue(null); // no token — unauthenticated

          const path = `/api/applications/${subPath}`;
          const req = makeMockRequest(path);
          const response = (await middleware(req)) as {
            type: string;
            location: string;
          };

          expect(response.type).toBe('redirect');
          expect(response.location).toMatch(/^http:\/\/localhost\/$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Property: any protected path WITH a valid token → passes through (next())
  // -------------------------------------------------------------------------
  it('passes through authenticated requests for any /dashboard/* sub-path', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-zA-Z0-9\-/]{0,40}$/),
        async (subPath) => {
          // Return a non-null token object — representing a valid session
          getToken.mockResolvedValue({ sub: 'user-123', email: 'user@example.com' });

          const path = `/dashboard/${subPath}`;
          const req = makeMockRequest(path);
          const response = (await middleware(req)) as { type: string };

          expect(response.type).toBe('next');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('passes through authenticated requests for any /api/applications/* sub-path', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-zA-Z0-9\-/]{0,40}$/),
        async (subPath) => {
          getToken.mockResolvedValue({ sub: 'user-123', email: 'user@example.com' });

          const path = `/api/applications/${subPath}`;
          const req = makeMockRequest(path);
          const response = (await middleware(req)) as { type: string };

          expect(response.type).toBe('next');
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // Edge case: exact protected root paths (no trailing sub-path)
  // -------------------------------------------------------------------------
  it('redirects unauthenticated request to exactly /dashboard', async () => {
    getToken.mockResolvedValue(null);
    const req = makeMockRequest('/dashboard');
    const response = (await middleware(req)) as { type: string; location: string };
    expect(response.type).toBe('redirect');
    expect(response.location).toMatch(/^http:\/\/localhost\/$/);
  });

  it('redirects unauthenticated request to exactly /api/applications', async () => {
    getToken.mockResolvedValue(null);
    const req = makeMockRequest('/api/applications');
    const response = (await middleware(req)) as { type: string; location: string };
    expect(response.type).toBe('redirect');
    expect(response.location).toMatch(/^http:\/\/localhost\/$/);
  });
});
