import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, NotificationSettings } from '../api/NotificationService';
import { hapticService } from '../api/HapticService';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

const ALLOWED_ROUTES = [
  '/weekly-reveal',
  '/(auth)/(tabs)',
  '/(auth)/(tabs)/routines',
  '/(auth)/(tabs)/progress',
  '/(auth)/intake',
  '/(auth)/intake/camera',
  '/(auth)/intake/symptom-log',
  '/(auth)/settings',
  '/(auth)/notifications',
];

export function validateDeepLink(url: string | undefined | null): import('expo-router').Href {
  const fallback = '/(auth)/(tabs)' as import('expo-router').Href;
  if (!url) return fallback;
  
  // Exact match
  if (ALLOWED_ROUTES.includes(url)) {
    return url as import('expo-router').Href;
  }
  
  // Pattern match for chat sessions
  if (url.startsWith('/(auth)/chat/') && url.length > 13) {
    const sessionId = url.split('/')[3];
    if (/^[a-zA-Z0-9-]+$/.test(sessionId)) {
      return url as import('expo-router').Href;
    }
  } else if (url.startsWith('/chat/') && url.length > 6) {
    const sessionId = url.split('/')[2];
    if (/^[a-zA-Z0-9-]+$/.test(sessionId)) {
      return url as import('expo-router').Href;
    }
  }

  console.warn(`[Notifications] Blocked untrusted deeplink: ${url}`);
  return fallback;
}

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Handle deep links when app is backgrounded/closed
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      // In scheduler.ts, deepLink is passed under data.deepLink, but the old code checked data.url
      // We will check both to be safe
      const data = response.notification.request.content.data;
      const url = data?.deepLink || data?.url;
      const safeUrl = validateDeepLink(url as string | undefined);
      router.push(safeUrl);
    });

    return () => subscription.remove();
  }, [router]);

  const { data: settings = { enabled: false }, isLoading } = useQuery<NotificationSettings>({
    queryKey: ['notification_settings'],
    queryFn: () => notificationService.getSettings(),
  });

  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      notificationService.saveSettings({ ...settings, ...newSettings } as NotificationSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_settings'] });
    },
  });

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    setIsUpdating(true);
    try {
      await mutation.mutateAsync(newSettings);
      hapticService.triggerSuccess();
    } finally {
      setIsUpdating(false);
    }
  };

  const requestPermissions = async () => {
    setIsUpdating(true);
    try {
      const token = await notificationService.registerForPushNotificationsAsync();
      if (token) {
        await updateSettings({ enabled: true });
        return true;
      }
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    settings,
    updateSettings,
    requestPermissions,
    isLoading,
    isUpdating,
  };
};
