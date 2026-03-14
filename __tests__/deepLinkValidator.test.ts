import { validateDeepLink } from '../src/utils/deepLinkValidator';

describe('validateDeepLink', () => {
  describe('allowed routes', () => {
    it.each([
      '/(auth)/(tabs)',
      '/(auth)/(tabs)/care',
      '/(auth)/(tabs)/routines',
      '/(auth)/(tabs)/progress',
      '/(auth)/(tabs)/profile',
      '/(auth)/timeline',
      '/(auth)/intake',
      '/(auth)/intake/camera',
      '/(auth)/intake/symptom-log',
      '/(auth)/intake/pre-visit',
      '/(auth)/intake/review',
      '/(auth)/settings',
      '/(auth)/notifications',
      '/(auth)/consent',
      '/(auth)/label-scan',
      '/(auth)/onboarding/skin-brief',
      '/(auth)/onboarding/preferences',
      '/(auth)/interventions',
      '/(auth)/onboarding/goal-journey',
      '/weekly-reveal',
    ])('allows exact route: %s', (route) => {
      expect(validateDeepLink(route)).toBe(route);
    });
  });

  describe('trailing-slash normalization', () => {
    it('normalizes trailing slash on allowed route', () => {
      expect(validateDeepLink('/(auth)/intake/')).toBe('/(auth)/intake');
    });

    it('normalizes trailing slash on label-scan', () => {
      expect(validateDeepLink('/(auth)/label-scan/')).toBe('/(auth)/label-scan');
    });

    it('normalizes trailing slash on timeline', () => {
      expect(validateDeepLink('/(auth)/timeline/')).toBe('/(auth)/timeline');
    });
  });

  describe('chat session routes', () => {
    it('allows valid chat session with auth prefix', () => {
      expect(validateDeepLink('/(auth)/chat/abc-123')).toBe('/(auth)/chat/abc-123');
    });

    it('allows valid chat session without auth prefix', () => {
      expect(validateDeepLink('/chat/session_456')).toBe('/chat/session_456');
    });

    it('rejects chat session with path traversal', () => {
      expect(validateDeepLink('/(auth)/chat/../admin')).toBe('/(auth)/(tabs)');
    });

    it('rejects chat session with invalid characters', () => {
      expect(validateDeepLink('/(auth)/chat/evil<script>')).toBe('/(auth)/(tabs)');
    });
  });

  describe('scheme stripping', () => {
    it('strips medbot:// scheme and validates path', () => {
      expect(validateDeepLink('medbot:///(auth)/(tabs)/progress')).toBe('/(auth)/(tabs)/progress');
    });

    it('normalizes a trailing slash after scheme stripping', () => {
      expect(validateDeepLink('medbot:///(auth)/(tabs)/')).toBe('/(auth)/(tabs)');
    });

    it('rejects external URL after scheme strip', () => {
      expect(validateDeepLink('medbot://https://evil.com')).toBe('/(auth)/(tabs)');
    });
  });

  describe('blocked routes', () => {
    it('normalizes trailing slashes on direct router paths', () => {
      expect(validateDeepLink('/(auth)/(tabs)/')).toBe('/(auth)/(tabs)');
      expect(validateDeepLink('/(auth)/(tabs)/progress/')).toBe('/(auth)/(tabs)/progress');
    });

    it('blocks null/undefined', () => {
      expect(validateDeepLink(null)).toBe('/(auth)/(tabs)');
      expect(validateDeepLink(undefined)).toBe('/(auth)/(tabs)');
    });

    it('blocks empty string', () => {
      expect(validateDeepLink('')).toBe('/(auth)/(tabs)');
    });

    it('blocks external https URL', () => {
      expect(validateDeepLink('https://evil.com/steal')).toBe('/(auth)/(tabs)');
    });

    it('blocks protocol-relative URL', () => {
      expect(validateDeepLink('//evil.com/path')).toBe('/(auth)/(tabs)');
    });

    it('blocks path traversal', () => {
      expect(validateDeepLink('/../../../etc/passwd')).toBe('/(auth)/(tabs)');
    });

    it('blocks unrecognised route', () => {
      expect(validateDeepLink('/admin/danger')).toBe('/(auth)/(tabs)');
    });

    it('blocks javascript: scheme', () => {
      expect(validateDeepLink('javascript:alert(1)')).toBe('/(auth)/(tabs)');
    });
  });
});
