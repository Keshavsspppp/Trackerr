// Feature: job-application-tracker, Property 6: Update mutates only the target user's application
// Feature: job-application-tracker, Property 7: Delete removes the application and enforces ownership

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';

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
      findOneAndUpdate: vi.fn(),
      findOneAndDelete: vi.fn(),
    },
  };
});

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { getToken } from 'next-auth/jwt';
import { Application } from '@/src/models/Application';
import { PATCH, DELETE } from './route';
import { rateLimitMap } from '@/src/lib/rateLimit';

const mockGetToken = vi.mocked(getToken);
const mockFindOneAndUpdate = vi.mocked(Application.findOneAndUpdate);
const mockFindOneAndDelete = vi.mocked(Application.findOneAndDelete);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a NextRequest for PATCH /api/applications/[id] */
function makePatchRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Build a NextRequest for DELETE /api/applications/[id] */
function makeDeleteRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/applications/${id}`, {
    method: 'DELETE',
  });
}

/** Build a fake Application document */
function buildFakeApp(overrides: {
  id?: string;
  userId: string;
  company: string;
  role: string;
  status?: string;
  notes?: string;
  lastUpdated?: Date;
}) {
  const now = new Date();
  return {
    _id: overrides.id ?? `id-${Math.random()}`,
    userId: overrides.userId,
    company: overrides.company,
    role: overrides.role,
    status: overrides.status ?? 'Applied',
    notes: overrides.notes ?? '',
    lastUpdated: overrides.lastUpdated ?? now,
    createdAt: now,
    toJSON() {
      return this;
    },
  };
}

// Generate a valid MongoDB ObjectId string
function makeObjectId(): string {
  return new mongoose.Types.ObjectId().toHexString();
}

// ---------------------------------------------------------------------------
// Reset mocks before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  rateLimitMap.clear();
});

// ===========================================================================
// Property 6: Update mutates only the target user's application
// Validates: Requirements 4.1, 4.4
// ===========================================================================
describe('Property 6: Update mutates only the target user\'s application', () => {
  it('returns 200 for the owner and 404 for a different user, across generated inputs', async () => {
    // Feature: job-application-tracker, Property 6: Update mutates only the target user's application
    // Validates: Requirements 4.1, 4.4

    await fc.assert(
      fc.asyncProperty(
        // Two distinct user IDs
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        // Application data
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        // Update payload: pick a valid status
        fc.constantFrom('Applied', 'Interview', 'Offer', 'Rejected'),
        async (userA, userB, company, role, newStatus) => {
          fc.pre(userA !== userB);

          const appId = makeObjectId();

          // --- PATCH as user A (the owner) ---
          mockGetToken.mockResolvedValueOnce({ sub: userA } as never);

          const updatedDoc = buildFakeApp({
            id: appId,
            userId: userA,
            company,
            role,
            status: newStatus,
          });
          mockFindOneAndUpdate.mockResolvedValueOnce(updatedDoc as never);

          const patchReqA = makePatchRequest(appId, { status: newStatus });
          const resA = await PATCH(patchReqA, { params: Promise.resolve({ id: appId }) });
          const bodyA = await resA.json();

          expect(resA.status).toBe(200);
          expect(bodyA.status).toBe(newStatus);

          // Confirm findOneAndUpdate was scoped to userA's id
          expect(mockFindOneAndUpdate).toHaveBeenLastCalledWith(
            expect.objectContaining({ _id: appId, userId: userA }),
            expect.anything(),
            expect.anything()
          );

          // --- PATCH as user B (non-owner) — should return 404 ---
          mockGetToken.mockResolvedValueOnce({ sub: userB } as never);
          // Simulates ownership check failure: no document matches _id + userB
          mockFindOneAndUpdate.mockResolvedValueOnce(null as never);

          const patchReqB = makePatchRequest(appId, { status: newStatus });
          const resB = await PATCH(patchReqB, { params: Promise.resolve({ id: appId }) });

          expect(resB.status).toBe(404);

          // Confirm findOneAndUpdate was scoped to userB's id
          expect(mockFindOneAndUpdate).toHaveBeenLastCalledWith(
            expect.objectContaining({ _id: appId, userId: userB }),
            expect.anything(),
            expect.anything()
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===========================================================================
// Unit tests for update edge cases (Task 8.2)
// Validates: Requirements 4.2, 4.3, 4.5
// ===========================================================================
describe('PATCH /api/applications/[id] — unit tests for edge cases', () => {
  beforeEach(() => {
    mockGetToken.mockResolvedValue({ sub: 'user-test' } as never);
  });

  it('returns 404 when the application does not exist (non-existent ObjectId)', async () => {
    // Requirement 4.3: non-existent id → 404
    mockFindOneAndUpdate.mockResolvedValueOnce(null as never);

    const nonExistentId = makeObjectId();
    const req = makePatchRequest(nonExistentId, { status: 'Interview' });
    const res = await PATCH(req, { params: Promise.resolve({ id: nonExistentId }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Application not found');
  });

  it('returns 400 when an invalid status value is provided', async () => {
    // Requirement 4.5: invalid status → 400
    const appId = makeObjectId();
    const req = makePatchRequest(appId, { status: 'NotAStatus' });
    const res = await PATCH(req, { params: Promise.resolve({ id: appId }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid status value');
    // findOneAndUpdate should NOT be called for invalid input
    expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('refreshes lastUpdated after a successful update', async () => {
    // Requirement 4.2: lastUpdated is set on every update
    const beforeUpdate = new Date(Date.now() - 1000); // 1 second ago
    const appId = makeObjectId();

    const updatedDoc = buildFakeApp({
      id: appId,
      userId: 'user-test',
      company: 'Acme',
      role: 'Engineer',
      status: 'Interview',
      lastUpdated: new Date(), // freshly updated
    });
    mockFindOneAndUpdate.mockResolvedValueOnce(updatedDoc as never);

    const req = makePatchRequest(appId, { status: 'Interview' });
    const res = await PATCH(req, { params: Promise.resolve({ id: appId }) });
    const body = await res.json();

    expect(res.status).toBe(200);

    // Verify that findOneAndUpdate was called with a $set containing a recent lastUpdated
    const callArgs = mockFindOneAndUpdate.mock.calls[0];
    const updateArg = callArgs[1] as { $set: { lastUpdated: Date } };
    const setLastUpdated = updateArg.$set.lastUpdated;

    expect(setLastUpdated).toBeInstanceOf(Date);
    expect(setLastUpdated.getTime()).toBeGreaterThan(beforeUpdate.getTime());

    // The returned document reflects the updated timestamp
    const returnedLastUpdated = new Date(body.lastUpdated).getTime();
    expect(returnedLastUpdated).toBeGreaterThan(beforeUpdate.getTime());
  });
});

// ===========================================================================
// Property 7: Delete removes the application and enforces ownership
// Validates: Requirements 5.1, 5.3
// ===========================================================================
describe('Property 7: Delete removes the application and enforces ownership', () => {
  it('returns 200 for the owner and 404 for a different user, across generated inputs', async () => {
    // Feature: job-application-tracker, Property 7: Delete removes the application and enforces ownership
    // Validates: Requirements 5.1, 5.3

    await fc.assert(
      fc.asyncProperty(
        // Two distinct user IDs
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        async (userA, userB, company, role) => {
          fc.pre(userA !== userB);

          const appId = makeObjectId();
          const fakeDoc = buildFakeApp({ id: appId, userId: userA, company, role });

          // --- DELETE as user A (owner) → should succeed ---
          mockGetToken.mockResolvedValueOnce({ sub: userA } as never);
          mockFindOneAndDelete.mockResolvedValueOnce(fakeDoc as never);

          const deleteReqA = makeDeleteRequest(appId);
          const resA = await DELETE(deleteReqA, { params: Promise.resolve({ id: appId }) });
          const bodyA = await resA.json();

          expect(resA.status).toBe(200);
          expect(bodyA.message).toBe('Deleted');

          // Ownership was enforced: query included userA's userId
          expect(mockFindOneAndDelete).toHaveBeenLastCalledWith(
            expect.objectContaining({ _id: appId, userId: userA })
          );

          // --- DELETE as user B (non-owner) → should return 404 ---
          // Record still exists (no document matched userB)
          mockGetToken.mockResolvedValueOnce({ sub: userB } as never);
          mockFindOneAndDelete.mockResolvedValueOnce(null as never);

          const deleteReqB = makeDeleteRequest(appId);
          const resB = await DELETE(deleteReqB, { params: Promise.resolve({ id: appId }) });

          expect(resB.status).toBe(404);

          // Ownership was enforced: query included userB's userId
          expect(mockFindOneAndDelete).toHaveBeenLastCalledWith(
            expect.objectContaining({ _id: appId, userId: userB })
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===========================================================================
// Unit test for delete not-found case (Task 9.2)
// Validates: Requirements 5.2
// ===========================================================================
describe('DELETE /api/applications/[id] — not-found case', () => {
  it('returns 404 when deleting with a valid-format but non-existent ObjectId', async () => {
    // Requirement 5.2: non-existent id → 404
    mockGetToken.mockResolvedValue({ sub: 'user-test' } as never);
    mockFindOneAndDelete.mockResolvedValueOnce(null as never);

    const nonExistentId = makeObjectId();
    const req = makeDeleteRequest(nonExistentId);
    const res = await DELETE(req, { params: Promise.resolve({ id: nonExistentId }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Application not found');
  });
});
