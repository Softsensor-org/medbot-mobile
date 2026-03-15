import { validateDeepLink } from '../src/utils/deepLinkValidator';
import { APP_ROUTES } from '../src/testSupport/deepLinkRoutes';

describe('validateDeepLink', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('allowed routes', () => {
    it.each(APP_ROUTES)('allows exact route: %s', (route) => {
      expect(validateDeepLink(route)).toBe(route);
    });
  });

  describe('trailing-slash normalization', () => {
    it('normalizes trailing slash variants for all allowed routes', () => {
      for (const route of APP_ROUTES) {
        expect(validateDeepLink(`${route}/`)).toBe(route);
      }
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
