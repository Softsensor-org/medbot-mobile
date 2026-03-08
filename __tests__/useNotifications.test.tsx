import { renderHook, act } from '@testing-library/react-native';
import { useNotifications, validateDeepLink } from '../src/hooks/useNotifications';
import { notificationService } from '../src/api/NotificationService';

// Mocks
jest.mock('../src/api/NotificationService', () => ({
  notificationService: {
    getSettings: jest.fn(),
    saveSettings: jest.fn(),
    registerForPushNotificationsAsync: jest.fn(),
  },
}));

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  setNotificationHandler: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('validateDeepLink', () => {
  it('allows exact matches from the allowlist', () => {
    expect(validateDeepLink('/weekly-reveal')).toBe('/weekly-reveal');
    expect(validateDeepLink('/(auth)/(tabs)/routines')).toBe('/(auth)/(tabs)/routines');
  });

  it('allows dynamic chat session routes with valid IDs', () => {
    expect(validateDeepLink('/chat/session-123')).toBe('/chat/session-123');
    expect(validateDeepLink('/(auth)/chat/session-123')).toBe('/(auth)/chat/session-123');
  });

  it('blocks malformed chat session routes', () => {
    expect(validateDeepLink('/chat/../malicious')).toBe('/(auth)/(tabs)');
    expect(validateDeepLink('/(auth)/chat/../../malicious')).toBe('/(auth)/(tabs)');
  });

  it('blocks untrusted random routes', () => {
    expect(validateDeepLink('https://evil.com')).toBe('/(auth)/(tabs)');
    expect(validateDeepLink('/some/untrusted/route')).toBe('/(auth)/(tabs)');
  });

  it('provides safe fallback for missing URLs', () => {
    expect(validateDeepLink(undefined)).toBe('/(auth)/(tabs)');
    expect(validateDeepLink(null)).toBe('/(auth)/(tabs)');
  });
});

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (notificationService.getSettings as jest.Mock).mockReturnValue({ enabled: false });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('loads initial settings', () => {
    const { result, unmount } = renderHook(() => useNotifications(), { wrapper });
    expect(result.current.settings.enabled).toBe(false);
    unmount();
  });

  it('requests permissions and enables notifications', async () => {
    (notificationService.registerForPushNotificationsAsync as jest.Mock).mockResolvedValue('fake-token');
    
    const { result, unmount } = renderHook(() => useNotifications(), { wrapper });
    
    await act(async () => {
      await result.current.requestPermissions();
    });
    
    expect(notificationService.registerForPushNotificationsAsync).toHaveBeenCalled();
    expect(notificationService.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    unmount();
  });
});
