// Feature: job-application-tracker, Property 1: Application creation persists correctly
// Feature: job-application-tracker, Property 2: Invalid inputs are rejected with HTTP 400
// Feature: job-application-tracker, Property 3: Application list is user-scoped
// Feature: job-application-tracker, Property 4: Status filter returns only matching applications
// Feature: job-application-tracker, Property 5: Application list is sorted by createdAt descending

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/src/lib/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

// Application mock — we control create/find per-test
vi.mock('@/src/models/Application', () => {
  return {
    Application: {
      create: vi.fn(),
      find: vi.fn(),
    },
  };
});

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { getToken } from 'next-auth/jwt';
import { Application } from '@/src/models/Application';
import { POST, GET } from './route';
import { rateLimitMap } from '@/src/lib/rateLimit';

const mockGetToken = vi.mocked(getToken);
const mockCreate = vi.mocked(Application.create);
const mockFind = vi.mocked(Application.find);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a NextRequest for POST /api/applications with the given JSON body */
function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Build a NextRequest for GET /api/applications with optional ?status= param */
function makeGetRequest(params?: { status?: string }): NextRequest {
  const url = new URL('http://localhost/api/applications');
  if (params?.status !== undefined) {
    url.searchParams.set('status', params.status);
  }
  return new NextRequest(url.toString(), { method: 'GET' });
}

/** Build a fake Application document matching what Mongoose would return */
function buildFakeApp(overrides: {
  userId: string;
  company: string;
  role: string;
  status?: string;
  createdAt?: Date;
}) {
  const now = overrides.createdAt ?? new Date();
  return {
    _id: `id-${Math.random()}`,
    userId: overrides.userId,
    company: overrides.company,
    role: overrides.role,
    status: overrides.status ?? 'Applied',
    lastUpdated: now,
    createdAt: now,
    toJSON() {
      return this;
    },
  };
}

// ---------------------------------------------------------------------------
// Reset mocks AND rate limiter before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  // Clear rate limiter state between tests
  rateLimitMap.clear();
});

// ===========================================================================
// Property 1: Application creation persists correctly
// Validates: Requirements 2.1, 2.6
// ===========================================================================
describe('Property 1: Application creation persists correctly', () => {
  it('returns 201 and the created document with matching fields for any valid input', async () => {
    // Feature: job-application-tracker, Property 1: Application creation persists correctly

    await fc.assert(
      fc.asyncProperty(
        // company/role: non-empty and not whitespace-only (matches route validation)
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.constantFrom('Applied', 'Interview', 'Offer', 'Rejected'),
        async (company, role, status) => {
          // Use unique userId per iteration to avoid rate limit across runs
          const userId = `user-${Math.random().toString(36).substring(7)}`;
          mockGetToken.mockResolvedValue({ sub: userId, email: 'user@example.com' } as never);

          const trimmedCompany = company.trim();
          const trimmedRole = role.trim();
          const fakeDoc = buildFakeApp({ userId, company: trimmedCompany, role: trimmedRole, status });
          mockCreate.mockResolvedValueOnce(fakeDoc as never);

          const req = makePostRequest({ company, role, status });
          const res = await POST(req);
          const body = await res.json();

          expect(res.status).toBe(201);
          expect(body.userId).toBe(userId);
          expect(body.company).toBe(trimmedCompany);
          expect(body.role).toBe(trimmedRole);
          expect(body.status).toBe(status);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===========================================================================
// Property 2: Invalid inputs are rejected with HTTP 400
// Validates: Requirements 2.4, 2.5
// ===========================================================================
describe('Property 2: Invalid inputs are rejected with HTTP 400', () => {
  beforeEach(() => {
    // Use unique userId per iteration inside the properties
  });

  it('returns 400 when company is empty or whitespace-only', async () => {
    // Feature: job-application-tracker, Property 2: Invalid inputs are rejected with HTTP 400
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant(''), fc.string().filter((s) => !s.trim())),
        fc.string({ minLength: 1 }), // valid role
        async (emptyCompany, role) => {
          // Use unique userId per iteration to avoid rate limit
          const userId = `user-${Math.random().toString(36).substring(7)}`;
          mockGetToken.mockResolvedValue({ sub: userId, email: 'user@example.com' } as never);

          const req = makePostRequest({ company: emptyCompany, role });
          const res = await POST(req);

          expect(res.status).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 400 when role is empty or whitespace-only', async () => {
    // Feature: job-application-tracker, Property 2: Invalid inputs are rejected with HTTP 400
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // valid company
        fc.oneof(fc.constant(''), fc.string().filter((s) => !s.trim())),
        async (company, emptyRole) => {
          // Use unique userId per iteration to avoid rate limit
          const userId = `user-${Math.random().toString(36).substring(7)}`;
          mockGetToken.mockResolvedValue({ sub: userId, email: 'user@example.com' } as never);

          const req = makePostRequest({ company, role: emptyRole });
          const res = await POST(req);

          expect(res.status).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 400 when status is an invalid enum value', async () => {
    // Feature: job-application-tracker, Property 2: Invalid inputs are rejected with HTTP 400
    const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // valid company
        fc.string({ minLength: 1 }), // valid role
        fc.string().filter((s) => !validStatuses.includes(s) && s.length > 0),
        async (company, role, badStatus) => {
          // Use unique userId per iteration to avoid rate limit
          const userId = `user-${Math.random().toString(36).substring(7)}`;
          mockGetToken.mockResolvedValue({ sub: userId, email: 'user@example.com' } as never);

          const req = makePostRequest({ company, role, status: badStatus });
          const res = await POST(req);

          expect(res.status).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===========================================================================
// Property 3: Application list is user-scoped
// Validates: Requirements 3.1, 9.2, 9.3
// ===========================================================================
describe('Property 3: Application list is user-scoped', () => {
  it('returns only applications belonging to the authenticated user', async () => {
    // Feature: job-application-tracker, Property 3: Application list is user-scoped
    await fc.assert(
      fc.asyncProperty(
        // Two distinct user IDs
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        // Number of apps per user (0–5)
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 0, max: 5 }),
        async (userA, userB, countA, countB) => {
          // Ensure users are distinct
          fc.pre(userA !== userB);

          // Authenticate as userA
          mockGetToken.mockResolvedValue({ sub: userA } as never);

          // Build apps for each user
          const appsForA = Array.from({ length: countA }, (_, i) =>
            buildFakeApp({ userId: userA, company: `CompA${i}`, role: `RoleA${i}` })
          );

          // Mock find() to return only userA's apps (as a real scoped query would)
          const findResult = {
            sort: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            skip: vi.fn().mockResolvedValue(appsForA),
          };
          mockFind.mockReturnValueOnce(findResult as never);

          const req = makeGetRequest();
          const res = await GET(req);
          const body = await res.json();

          expect(res.status).toBe(200);
          expect(Array.isArray(body)).toBe(true);

          // Every returned item must belong to userA
          for (const app of body) {
            expect(app.userId).toBe(userA);
          }

          // Verify find() was called with the correct userId scope
          expect(mockFind).toHaveBeenCalledWith(
            expect.objectContaining({ userId: userA })
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===========================================================================
// Property 4: Status filter returns only matching applications
// Validates: Requirements 3.2, 7.1
// ===========================================================================
describe('Property 4: Status filter returns only matching applications', () => {
  it('returns only applications whose status matches the filter for any valid status', async () => {
    // Feature: job-application-tracker, Property 4: Status filter returns only matching applications
    const userId = 'user-filter-test';
    mockGetToken.mockResolvedValue({ sub: userId } as never);

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('Applied', 'Interview', 'Offer', 'Rejected') as fc.Arbitrary<
          'Applied' | 'Interview' | 'Offer' | 'Rejected'
        >,
        fc.integer({ min: 0, max: 5 }),
        async (filterStatus, count) => {
          // Build apps all matching the filter status
          const matchingApps = Array.from({ length: count }, (_, i) =>
            buildFakeApp({
              userId,
              company: `Comp${i}`,
              role: `Role${i}`,
              status: filterStatus,
            })
          );

          const findResult = {
            sort: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            skip: vi.fn().mockResolvedValue(matchingApps),
          };
          mockFind.mockReturnValueOnce(findResult as never);

          const req = makeGetRequest({ status: filterStatus });
          const res = await GET(req);
          const body = await res.json();

          expect(res.status).toBe(200);
          expect(Array.isArray(body)).toBe(true);

          // All returned items must match the requested status
          for (const app of body) {
            expect(app.status).toBe(filterStatus);
          }

          // Verify find() was called with the status filter
          expect(mockFind).toHaveBeenCalledWith(
            expect.objectContaining({ userId, status: filterStatus })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 400 when the status filter is an invalid value', async () => {
    const userId = 'user-bad-filter';
    mockGetToken.mockResolvedValue({ sub: userId } as never);

    const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];

    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => !validStatuses.includes(s) && s.length > 0),
        async (badStatus) => {
          const req = makeGetRequest({ status: badStatus });
          const res = await GET(req);

          expect(res.status).toBe(400);
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ===========================================================================
// Property 5: Application list is sorted by createdAt descending
// Validates: Requirements 3.5
// ===========================================================================
describe('Property 5: Application list is sorted by createdAt descending', () => {
  it('returns applications in descending createdAt order for any set of dates', async () => {
    // Feature: job-application-tracker, Property 5: Application list is sorted by createdAt descending
    const userId = 'user-sort-test';
    mockGetToken.mockResolvedValue({ sub: userId } as never);

    await fc.assert(
      fc.asyncProperty(
        // Generate 0–8 distinct dates
        fc.array(fc.date(), { minLength: 0, maxLength: 8 }),
        async (dates) => {
          // Sort descending — this is what the DB should return
          const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());

          const apps = sortedDates.map((createdAt, i) =>
            buildFakeApp({ userId, company: `Comp${i}`, role: `Role${i}`, createdAt })
          );

          const findResult = {
            sort: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            skip: vi.fn().mockResolvedValue(apps),
          };
          mockFind.mockReturnValueOnce(findResult as never);

          const req = makeGetRequest();
          const res = await GET(req);
          const body = await res.json();

          expect(res.status).toBe(200);
          expect(Array.isArray(body)).toBe(true);

          // Verify descending order: each item's createdAt >= the next one's
          for (let i = 0; i < body.length - 1; i++) {
            const curr = new Date(body[i].createdAt).getTime();
            const next = new Date(body[i + 1].createdAt).getTime();
            expect(curr).toBeGreaterThanOrEqual(next);
          }

          // Verify sort was called with { createdAt: -1 }
          expect(findResult.sort).toHaveBeenCalledWith({ createdAt: -1 });
        }
      ),
      { numRuns: 100 }
    );
  });
});
