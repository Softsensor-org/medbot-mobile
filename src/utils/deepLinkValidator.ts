/**
 * IMP-167: Deep-link route allowlist validation.
 *
 * All notification and CTA navigation must pass through validateDeepLink()
 * before calling router.push(). Untrusted/malformed URLs are rejected and
 * the caller receives a safe fallback route.
 */
import type { Href } from 'expo-router';

const ALLOWED_ROUTES: readonly string[] = [
  '/weekly-reveal',
  '/(auth)/(tabs)',
  '/(auth)/(tabs)/routines',
  '/(auth)/(tabs)/progress',
  '/(auth)/timeline',
  '/(auth)/intake',
  '/(auth)/intake/camera',
  '/(auth)/intake/symptom-log',
  '/(auth)/settings',
  '/(auth)/notifications',
  '/(auth)/consent',
  '/(auth)/onboarding/skin-brief',
  '/(auth)/onboarding/preferences',
  '/(auth)/interventions',
];

const SAFE_FALLBACK: Href = '/(auth)/(tabs)' as Href;
const SCHEME_PREFIX = 'medbot://';
const SESSION_ID_RE = /^[a-zA-Z0-9_-]+$/;

function normalizeRoutePath(path: string): string {
  if (path.length <= 1) {
    return path;
  }
  return path.replace(/\/+$/, '');
}

/**
 * Validate a deep-link URL against the route allowlist.
 *
 * Returns a safe Href suitable for `router.push()`.
 * Rejects external URLs, path traversal, and unrecognised routes.
 */
export function validateDeepLink(url: string | undefined | null): Href {
  if (!url) return SAFE_FALLBACK;

  // Strip custom scheme prefix if present
  let path = url;
  if (path.startsWith(SCHEME_PREFIX)) {
    path = path.slice(SCHEME_PREFIX.length);
  }

  path = normalizeRoutePath(path);

  // Block external URLs and protocol-relative paths
  if (path.includes('://') || path.startsWith('//')) {
    console.warn('[DeepLink] Blocked external URL:', url);
    return SAFE_FALLBACK;
  }

  // Block path traversal
  if (path.includes('..')) {
    console.warn('[DeepLink] Blocked path traversal:', url);
    return SAFE_FALLBACK;
  }

  // Exact match against allowlist
  if (ALLOWED_ROUTES.includes(path)) {
    return path as Href;
  }

  // Pattern match: chat session routes
  const chatPrefixes = ['/(auth)/chat/', '/chat/'];
  for (const prefix of chatPrefixes) {
    if (path.startsWith(prefix) && path.length > prefix.length) {
      const sessionId = path.slice(prefix.length).split('/')[0];
      if (SESSION_ID_RE.test(sessionId)) {
        return path as Href;
      }
    }
  }

  console.warn('[DeepLink] Blocked untrusted route:', url);
  return SAFE_FALLBACK;
}
