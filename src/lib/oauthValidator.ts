/**
 * Validates a redirect URI against a whitelist of allowed patterns.
 * 
 * Patterns support:
 * - Exact matches: https://example.com/callback
 * - Wildcard matches: https://*.example.com/*
 * 
 * @param redirectUri The redirect URI to validate
 * @returns true if the URI matches an allowed pattern, false otherwise
 */
export function validateRedirectURI(redirectUri: string): boolean {
  const allowedPatterns = process.env.ALLOWED_REDIRECT_URIS?.split(',') || [];
  
  return allowedPatterns.some(pattern => {
    const trimmedPattern = pattern.trim();
    
    // Exact match
    if (trimmedPattern === redirectUri) {
      return true;
    }
    
    // Wildcard match
    if (trimmedPattern.includes('*')) {
      // Convert wildcard pattern to regex
      // Escape special regex characters except *
      const regexPattern = trimmedPattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
        .replace(/\*/g, '.*'); // Convert * to .*
      
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(redirectUri);
    }
    
    return false;
  });
}
