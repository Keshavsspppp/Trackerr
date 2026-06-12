// Feature: job-application-tracker — Cron reminder route
// GET /api/cron/reminders
//
// Protected by Authorization: Bearer <CRON_SECRET> header.
// Queries stale applications and sends reminder emails via Resend.
// Returns { processed, sent, errors } with HTTP 200.

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { connectDB } from '@/src/lib/mongodb';
import { Application } from '@/src/models/Application';
import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Pure helper — exported for direct unit/property testing
// ---------------------------------------------------------------------------

/**
 * Returns true iff the application is "stale" and eligible for a reminder:
 *   - status === "Applied"
 *   - lastUpdated is older than thresholdDays before `now`
 *   - lastReminderSent is null/undefined OR older than thresholdDays before `now`
 */
export function isStaleApplication(
  app: {
    status: string;
    lastUpdated: Date;
    lastReminderSent?: Date | null;
  },
  now: Date,
  thresholdDays: number = 7
): boolean {
  if (app.status !== 'Applied') return false;

  // Guard against invalid dates — NaN comparisons always return false,
  // which would cause incorrect stale detection.
  if (isNaN(app.lastUpdated.getTime())) return false;

  const cutoff = new Date(now.getTime() - thresholdDays * 24 * 60 * 60 * 1000);

  if (app.lastUpdated >= cutoff) return false;

  if (app.lastReminderSent == null) return true;

  // Guard lastReminderSent against invalid dates — treat NaN as "never sent"
  // would be misleading, so conservatively return false.
  if (isNaN(app.lastReminderSent.getTime())) return false;

  return app.lastReminderSent < cutoff;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // Auth guard: validate CRON_SECRET
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const now = new Date();
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Query stale applications
    const staleApps = await Application.find({
      status: 'Applied',
      lastUpdated: { $lt: cutoff },
      $or: [
        { lastReminderSent: null },
        { lastReminderSent: { $exists: false } },
        { lastReminderSent: { $lt: cutoff } },
      ],
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    let sent = 0;
    let errors = 0;

    for (const app of staleApps) {
      try {
        // Look up user email from the users collection
        const db = mongoose.connection.db;
        let userEmail: string | null = null;

        if (db) {
          const usersCollection = db.collection('users');

          // Build query: try ObjectId cast first (NextAuth stores users with ObjectId _id),
          // but fall back to plain string if userId isn't a valid 24-char hex string.
          let userQuery: object;
          try {
            userQuery = { _id: new mongoose.Types.ObjectId(app.userId) };
          } catch {
            userQuery = { _id: app.userId };
          }

          const user = await usersCollection.findOne(userQuery);
          userEmail = user?.email ?? null;
        }

        if (!userEmail) {
          console.warn(
            `[cron/reminders] No email found for userId=${app.userId}, skipping app=${app._id}`
          );
          errors++;
          continue;
        }

        await resend.emails.send({
          from: 'noreply@jobtracker.app',
          to: userEmail,
          subject: 'Follow up on your application',
          html: `<p>Don't forget to follow up on your application for <strong>${app.role}</strong> at <strong>${app.company}</strong>.</p>`,
        });

        // Update lastReminderSent only on success
        await Application.findByIdAndUpdate(app._id, {
          $set: { lastReminderSent: new Date() },
        });

        sent++;
      } catch (err) {
        console.error(`[cron/reminders] Error processing app=${app._id}:`, err);
        errors++;
      }
    }

    return NextResponse.json(
      { processed: staleApps.length, sent, errors },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/cron/reminders]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
