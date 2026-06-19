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
