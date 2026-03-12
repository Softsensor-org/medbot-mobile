import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, NotificationSettings } from '../api/NotificationService';
import { hapticService } from '../api/HapticService';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { validateDeepLink } from '../utils/deepLinkValidator';
import { getExpoNotifications } from '../notifications/expoNotifications';

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let isMounted = true;
    let removeSubscription: (() => void) | undefined;

    // Handle deep links when app is backgrounded/closed
    void getExpoNotifications().then(Notifications => {
      if (!isMounted || !Notifications) {
        return;
      }

      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        // In scheduler.ts, deepLink is passed under data.deepLink, but the old code checked data.url
        // We will check both to be safe
        const data = response.notification.request.content.data;
        const url = data?.deepLink || data?.url;
        const safeUrl = validateDeepLink(url as string | undefined);
        router.push(safeUrl);
      });

      removeSubscription = () => subscription.remove();
    });

    return () => {
      isMounted = false;
      removeSubscription?.();
    };
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
