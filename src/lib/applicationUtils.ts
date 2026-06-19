/**
 * Utility functions for application staleness tracking
 */

const STALE_THRESHOLD_DAYS = 7;

/**
 * Determines if an application is considered stale (no update for 7+ days)
 * 
 * @param lastUpdated The lastUpdated date of the application
 * @returns true if the application hasn't been updated in 7+ days
 */
export function isApplicationStale(lastUpdated: string | Date): boolean {
  const lastUpdateTime = new Date(lastUpdated).getTime();
  const now = Date.now();
  const daysSinceUpdate = (now - lastUpdateTime) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate >= STALE_THRESHOLD_DAYS;
}

/**
 * Calculates the number of days since an application was last updated
 * 
 * @param lastUpdated The lastUpdated date of the application
 * @returns The number of days since last update (floored to integer)
 */
export function getDaysSinceUpdate(lastUpdated: string | Date): number {
  const lastUpdateTime = new Date(lastUpdated).getTime();
  const now = Date.now();
  return Math.floor((now - lastUpdateTime) / (1000 * 60 * 60 * 24));
}

/**
 * Safely format date into a timezone-agnostic string (MM/DD/YYYY) for initial rendering.
 * Uses string splitting to avoid Date object timezone adjustments.
 * 
 * @param dateStr ISO date string (e.g. from mongoose document)
 * @returns Formatted date string or empty string
 */
export function formatStaticDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const datePart = dateStr.split("T")[0];
  const parts = datePart.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1], 10).toString();
    const day = parseInt(parts[2], 10).toString();
    return `${month}/${day}/${year}`;
  }
  return datePart;
}

/**
 * Returns true iff the application is "stale" and eligible for a reminder:
 *   - status === "Applied"
 *   - lastUpdated is older than thresholdDays before `now`
 *   - lastReminderSent is null/undefined OR older than thresholdDays before `now`
 * 
 * @param app - Application document with status, lastUpdated, and optional lastReminderSent
 * @param now - Current date/time for comparison
 * @param thresholdDays - Number of days after which an application is considered stale (default: 7)
 * @returns true if the application meets all staleness criteria
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
