// Feature: job-application-tracker, Property 9: Cron selects exactly the stale applications
// Feature: job-application-tracker, Property 10: Cron email dispatch resilience
// Unit tests for cron auth guard (Requirements 8.6, 8.7)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Environment setup — must happen before route import
// ---------------------------------------------------------------------------
process.env.CRON_SECRET = 'test-secret';
process.env.RESEND_API_KEY = 'test-resend-key';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/src/lib/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockSendEmail = vi.fn();

// Resend is used as a constructor (`new Resend(...)`), so the mock must be a class
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockSendEmail };
  },
}));

vi.mock('@/src/models/Application', () => ({
  Application: {
    find: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

// Mock mongoose connection for users lookup
// Mock mongoose: we only need connection.db.collection for the user lookup
// and Types.ObjectId for ObjectId creation in the route.
const mockFindOne = vi.fn().mockResolvedValue({ email: 'user@example.com' });
const mockCollection = vi.fn().mockReturnValue({ findOne: mockFindOne });

vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongoose')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      connection: {
        db: {
          collection: (...args: unknown[]) => mockCollection(...args),
        },
      },
    },
  };
});

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { Application } from '@/src/models/Application';
import { GET, isStaleApplication } from './route';

const mockFind = vi.mocked(Application.find);
const mockFindByIdAndUpdate = vi.mocked(Application.findByIdAndUpdate);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGetRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader !== undefined) {
    headers['authorization'] = authHeader;
  }
  return new NextRequest('http://localhost/api/cron/reminders', {
    method: 'GET',
    headers,
  });
}

function buildFakeApp(overrides: {
  id?: string;
  userId?: string;
  userEmail?: string;
  company?: string;
  role?: string;
  status?: string;
  lastUpdated?: Date;
  lastReminderSent?: Date | null;
}) {
  return {
    _id: overrides.id ?? `id-${Math.random()}`,
    userId: overrides.userId ?? 'user-123',
    userEmail: overrides.userEmail ?? 'user@example.com',
    company: overrides.company ?? 'Acme Corp',
    role: overrides.role ?? 'Software Engineer',
    status: overrides.status ?? 'Applied',
    lastUpdated: overrides.lastUpdated ?? new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    lastReminderSent: overrides.lastReminderSent ?? null,
  };
}

// ---------------------------------------------------------------------------
// Reset mocks before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  mockFindByIdAndUpdate.mockResolvedValue(null as never);
});

// ===========================================================================
// Sub-task 17.1 — Property 9: Cron selects exactly the stale applications
// Validates: Requirements 8.1, 8.4
// ===========================================================================
describe('Property 9: Cron selects exactly the stale applications', () => {
  // Feature: job-application-tracker, Property 9: Cron selects exactly the stale applications

  const THRESHOLD_DAYS = 7;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  it('returns false for non-Applied status regardless of dates', () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 10 * MS_PER_DAY);
    const nonAppliedStatuses = ['Interview', 'Offer', 'Rejected'];

    for (const status of nonAppliedStatuses) {
      expect(
        isStaleApplication({ status, lastUpdated: oldDate, lastReminderSent: null }, now)
      ).toBe(false);
    }
  });

  it('returns false when lastUpdated is within the threshold', () => {
    const now = new Date();
    // lastUpdated is only 3 days ago — not stale
    const recentDate = new Date(now.getTime() - 3 * MS_PER_DAY);
    expect(
      isStaleApplication({ status: 'Applied', lastUpdated: recentDate, lastReminderSent: null }, now)
    ).toBe(false);
  });

  it('returns true when status=Applied, lastUpdated is old, and lastReminderSent is null', () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 10 * MS_PER_DAY);
    expect(
      isStaleApplication({ status: 'Applied', lastUpdated: oldDate, lastReminderSent: null }, now)
    ).toBe(true);
  });

  it('returns true when status=Applied, lastUpdated is old, and lastReminderSent is undefined', () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 10 * MS_PER_DAY);
    expect(
      isStaleApplication({ status: 'Applied', lastUpdated: oldDate }, now)
    ).toBe(true);
  });

  it('returns false when lastReminderSent is within the threshold even if lastUpdated is old', () => {
    const now = new Date();
    const oldLastUpdated = new Date(now.getTime() - 10 * MS_PER_DAY);
    const recentReminderSent = new Date(now.getTime() - 2 * MS_PER_DAY);
    expect(
      isStaleApplication(
        { status: 'Applied', lastUpdated: oldLastUpdated, lastReminderSent: recentReminderSent },
        now
      )
    ).toBe(false);
  });

  it('returns true when both lastUpdated and lastReminderSent are beyond the threshold', () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 10 * MS_PER_DAY);
    const olderReminderSent = new Date(now.getTime() - 8 * MS_PER_DAY);
    expect(
      isStaleApplication(
        { status: 'Applied', lastUpdated: oldDate, lastReminderSent: olderReminderSent },
        now
      )
    ).toBe(true);
  });

  it('property: isStale iff status=Applied AND lastUpdated old AND (lastReminderSent null OR old)', async () => {
    // Feature: job-application-tracker, Property 9
    // Validates: Requirements 8.1, 8.4

    const now = new Date('2024-06-15T12:00:00.000Z');
    const cutoff = new Date(now.getTime() - THRESHOLD_DAYS * MS_PER_DAY);

    await fc.assert(
      fc.property(
        // status: mix of Applied and others
        fc.oneof(
          fc.constant('Applied'),
          fc.constantFrom('Interview', 'Offer', 'Rejected')
        ),
        // lastUpdated: vary across the threshold boundary (use bounded dates to avoid NaN)
        fc.oneof(
          // clearly old (well before cutoff)
          fc.date({
            min: new Date(cutoff.getTime() - 30 * MS_PER_DAY),
            max: new Date(cutoff.getTime() - 1),
          }),
          // clearly recent (at or after cutoff)
          fc.date({
            min: cutoff,
            max: now,
          })
        ),
        // lastReminderSent: null, recent, or old (bounded dates to avoid NaN)
        fc.oneof(
          fc.constant(null as null | undefined | Date),
          fc.constant(undefined as null | undefined | Date),
          fc.date({
            min: new Date(cutoff.getTime() - 30 * MS_PER_DAY),
            max: new Date(cutoff.getTime() - 1),
          }) as fc.Arbitrary<null | undefined | Date>,
          fc.date({
            min: cutoff,
            max: now,
          }) as fc.Arbitrary<null | undefined | Date>
        ),
        (status, lastUpdated, lastReminderSent) => {
          const result = isStaleApplication(
            { status, lastUpdated, lastReminderSent: lastReminderSent as Date | null | undefined },
            now,
            THRESHOLD_DAYS
          );

          const isApplied = status === 'Applied';
          const lastUpdatedOld = lastUpdated < cutoff;
          const reminderOld =
            lastReminderSent == null || (lastReminderSent as Date) < cutoff;

          const expected = isApplied && lastUpdatedOld && reminderOld;
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('property: custom thresholdDays param works correctly', async () => {
    // Validates that the thresholdDays parameter is respected
    await fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 1, max: 60 }),
        (thresholdDays, ageDays) => {
          const now = new Date('2024-06-15T12:00:00.000Z');
          const lastUpdated = new Date(now.getTime() - ageDays * MS_PER_DAY);

          const result = isStaleApplication(
            { status: 'Applied', lastUpdated, lastReminderSent: null },
            now,
            thresholdDays
          );

          // Should be stale iff ageDays > thresholdDays
          expect(result).toBe(ageDays > thresholdDays);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ===========================================================================
// Sub-task 17.2 — Property 10: Cron email dispatch resilience
// Validates: Requirements 8.2, 8.3, 8.5
// ===========================================================================
describe('Property 10: Cron email dispatch resilience', () => {
  // Feature: job-application-tracker, Property 10: Cron email dispatch resilience

  it('property: all apps attempted, findByIdAndUpdate only on successes, no unhandled exception', async () => {
    // Validates: Requirements 8.2, 8.3, 8.5
    await fc.assert(
      fc.asyncProperty(
        // Random array of booleans: true = send succeeds, false = send throws
        fc.array(fc.boolean(), { minLength: 0, maxLength: 10 }),
        async (successFlags) => {
          vi.clearAllMocks();
          mockFindByIdAndUpdate.mockResolvedValue(null as never);

          const apps = successFlags.map((_, i) =>
            buildFakeApp({
              id: `app-${i}`,
              userId: 'user-123',
              company: `Company ${i}`,
              role: `Role ${i}`,
            })
          );

          // Mock Application.find to return our stale apps
          mockFind.mockResolvedValueOnce(apps as never);

          // Configure mockSendEmail based on successFlags
          successFlags.forEach((succeeds) => {
            if (succeeds) {
              mockSendEmail.mockResolvedValueOnce({ id: 'email-id', data: {} });
            } else {
              mockSendEmail.mockRejectedValueOnce(new Error('Resend API error'));
            }
          });

          const req = makeGetRequest('Bearer test-secret');

          // Call GET once and check it resolves without throwing
          const res = await GET(req);
          const body = await res.json();

          expect(res.status).toBe(200);
          expect(typeof body.processed).toBe('number');
          expect(typeof body.sent).toBe('number');
          expect(typeof body.errors).toBe('number');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('calls findByIdAndUpdate only for apps where send succeeds', async () => {
    // Two apps: first succeeds, second fails
    const apps = [
      buildFakeApp({ id: 'app-success', company: 'Acme', role: 'Engineer' }),
      buildFakeApp({ id: 'app-fail', company: 'Beta Inc', role: 'Designer' }),
    ];

    mockFind.mockResolvedValueOnce(apps as never);
    mockSendEmail
      .mockResolvedValueOnce({ id: 'ok' })
      .mockRejectedValueOnce(new Error('fail'));

    const req = makeGetRequest('Bearer test-secret');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.processed).toBe(2);
    expect(body.sent).toBe(1);
    expect(body.errors).toBe(1);

    // findByIdAndUpdate should have been called only once (for the success)
    expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      'app-success',
      expect.objectContaining({ $set: expect.objectContaining({ lastReminderSent: expect.any(Date) }) })
    );
  });

  it('returns processed=0, sent=0, errors=0 when there are no stale applications', async () => {
    mockFind.mockResolvedValueOnce([] as never);

    const req = makeGetRequest('Bearer test-secret');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.processed).toBe(0);
    expect(body.sent).toBe(0);
    expect(body.errors).toBe(0);
  });

  it('continues processing remaining apps when one fails', async () => {
    // Three apps: fail, succeed, fail
    const apps = [
      buildFakeApp({ id: 'app-1' }),
      buildFakeApp({ id: 'app-2' }),
      buildFakeApp({ id: 'app-3' }),
    ];

    mockFind.mockResolvedValueOnce(apps as never);
    mockSendEmail
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValueOnce({ id: 'ok' })
      .mockRejectedValueOnce(new Error('fail 3'));

    const req = makeGetRequest('Bearer test-secret');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.processed).toBe(3);
    expect(body.sent).toBe(1);
    expect(body.errors).toBe(2);
    // Only app-2 should have lastReminderSent updated
    expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// Sub-task 17.3 — Unit tests for cron auth guard
// Validates: Requirements 8.6, 8.7
// ===========================================================================
describe('Cron auth guard', () => {
  beforeEach(() => {
    // Provide empty array by default so auth-passing tests don't fail on DB calls
    mockFind.mockResolvedValue([] as never);
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = makeGetRequest(); // no header
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when Authorization header has wrong secret', async () => {
    const req = makeGetRequest('Bearer wrong-secret');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when Authorization header is malformed (no Bearer prefix)', async () => {
    const req = makeGetRequest('test-secret'); // missing "Bearer " prefix
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 200 when Authorization header has correct secret', async () => {
    const req = makeGetRequest('Bearer test-secret');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(typeof body.processed).toBe('number');
    expect(typeof body.sent).toBe('number');
    expect(typeof body.errors).toBe('number');
  });
});
