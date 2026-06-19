// Feature: job-application-tracker, Property 8: Stats totals are internally consistent

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

vi.mock('@/src/models/Application', () => {
  return {
    Application: {
      find: vi.fn(),
    },
  };
});

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { getToken } from 'next-auth/jwt';
import { Application } from '@/src/models/Application';
import { GET } from './route';

const mockGetToken = vi.mocked(getToken);
const mockFind = vi.mocked(Application.find);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a NextRequest for GET /api/applications/stats */
function makeStatsRequest(): NextRequest {
  return new NextRequest('http://localhost/api/applications/stats', {
    method: 'GET',
  });
}

/**
 * Convert a flat array of status strings into the aggregation result format
 * that MongoDB would return (one entry per status with a count).
 */
function statusArrayToAggregation(
  statuses: Array<'Applied' | 'Interview' | 'Offer' | 'Rejected'>
): Array<{ status: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const s of statuses) {
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

// ---------------------------------------------------------------------------
// Reset mocks before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// Property 8: Stats totals are internally consistent
// Validates: Requirements 6.1, 6.2, 6.3, 6.4
// ===========================================================================
describe('Property 8: Stats totals are internally consistent', () => {
  it('returns consistent total, byStatus, and interviewRate for any status distribution', async () => {
    // Feature: job-application-tracker, Property 8: Stats totals are internally consistent
    // Validates: Requirements 6.1, 6.2, 6.3, 6.4

    const userId = 'user-stats-test';
    mockGetToken.mockResolvedValue({ sub: userId } as never);

    await fc.assert(
      fc.asyncProperty(
        // Generate an array of status values representing N applications
        fc.array(
          fc.constantFrom(
            'Applied' as const,
            'Interview' as const,
            'Offer' as const,
            'Rejected' as const
          )
        ),
        async (statuses) => {
          const N = statuses.length;

          // Compute expected counts from the generated array
          const expectedByStatus = {
            Applied: statuses.filter((s) => s === 'Applied').length,
            Interview: statuses.filter((s) => s === 'Interview').length,
            Offer: statuses.filter((s) => s === 'Offer').length,
            Rejected: statuses.filter((s) => s === 'Rejected').length,
          };

          // Mock the find query chain: Application.find().lean()
          const mockApps = statuses.map((status, index) => ({
            _id: `app-${index}`,
            userId,
            status,
            appliedDate: new Date().toISOString(),
          }));
          mockFind.mockReturnValueOnce({
            lean: vi.fn().mockResolvedValue(mockApps),
          } as any);

          const req = makeStatsRequest();
          const res = await GET(req);
          const body = await res.json();

          expect(res.status).toBe(200);

          // Requirement 6.1: total equals N
          expect(body.total).toBe(N);

          // Requirement 6.2: per-status breakdown is correct
          expect(body.byStatus.Applied).toBe(expectedByStatus.Applied);
          expect(body.byStatus.Interview).toBe(expectedByStatus.Interview);
          expect(body.byStatus.Offer).toBe(expectedByStatus.Offer);
          expect(body.byStatus.Rejected).toBe(expectedByStatus.Rejected);

          // Requirement 6.2: sum of byStatus equals total
          const sumOfByStatus =
            body.byStatus.Applied +
            body.byStatus.Interview +
            body.byStatus.Offer +
            body.byStatus.Rejected;
          expect(sumOfByStatus).toBe(N);

          // Requirement 6.3 & 6.4: interviewRate is correct
          const expectedRate =
            N === 0
              ? 0
              : (expectedByStatus.Interview + expectedByStatus.Offer) / N;
          expect(body.interviewRate).toBeCloseTo(expectedRate, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===========================================================================
// Sub-task 11.2: Unit test for zero-application edge case
// Validates: Requirement 6.4
// ===========================================================================
describe('GET /api/applications/stats — zero applications edge case', () => {
  it('returns total=0 and interviewRate=0 when the user has no applications', async () => {
    // Requirement 6.4: division by zero guard — return 0 when total is 0
    const userId = 'user-with-no-apps';
    mockGetToken.mockResolvedValue({ sub: userId } as never);

    // Empty find result
    mockFind.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue([]),
    } as any);

    const req = makeStatsRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.total).toBe(0);
    expect(body.interviewRate).toBe(0);
    expect(body.byStatus).toEqual({
      Applied: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    });
  });
});

// ===========================================================================
// Auth guard unit test
// ===========================================================================
describe('GET /api/applications/stats — auth guard', () => {
  it('returns 401 when there is no valid JWT token', async () => {
    mockGetToken.mockResolvedValue(null as never);

    const req = makeStatsRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(mockFind).not.toHaveBeenCalled();
  });
});
