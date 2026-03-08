import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, NotificationSettings } from '../api/NotificationService';

export function useNotifications() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: settings = notificationService.getSettings(), isLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => notificationService.getSettings(),
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      notificationService.saveSettings(newSettings);
      return newSettings;
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(['notification-settings'], newSettings);
    }
  });

  useEffect(() => {
    // Handle deep links when app is backgrounded/closed
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data?.url;
      if (url) {
        router.push(url as any);
      }
    });

    return () => subscription.remove();
  }, [router]);

  const requestPermissions = async () => {
    const token = await notificationService.registerForPushNotificationsAsync();
    if (token) {
        updateSettings.mutate({ ...settings, enabled: true });
    }
    return token;
  };

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    requestPermissions,
  };
}
