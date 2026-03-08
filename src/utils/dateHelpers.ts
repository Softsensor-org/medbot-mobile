import { parseISO, isValid, format } from 'date-fns';

/**
 * Safely parse an ISO date string, returning null if invalid or missing.
 */
export function safeParseISO(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Safely format an ISO date string, returning a fallback string if invalid.
 */
export function safeFormat(
  dateString: string | null | undefined, 
  formatStr: string, 
  fallback = 'Unknown date'
): string {
  const parsed = safeParseISO(dateString);
  if (!parsed) return fallback;
  try {
    return format(parsed, formatStr);
  } catch {
    return fallback;
  }
}
