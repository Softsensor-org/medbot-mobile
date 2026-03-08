import { renderHook, act } from '@testing-library/react-native';
import { useNotifications } from '../src/hooks/useNotifications';
import { notificationService } from '../src/api/NotificationService';
import * as Notifications from 'expo-notifications';

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

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (notificationService.getSettings as jest.Mock).mockReturnValue({ enabled: false });
  });

  it('loads initial settings', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    expect(result.current.settings.enabled).toBe(false);
  });

  it('requests permissions and enables notifications', async () => {
    (notificationService.registerForPushNotificationsAsync as jest.Mock).mockResolvedValue('fake-token');
    
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    await act(async () => {
      await result.current.requestPermissions();
    });
    
    expect(notificationService.registerForPushNotificationsAsync).toHaveBeenCalled();
    expect(notificationService.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });
});
