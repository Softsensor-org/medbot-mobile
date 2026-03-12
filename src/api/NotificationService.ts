import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from './PersistenceService';
import { getExpoNotifications } from '../notifications/expoNotifications';

export interface NotificationSettings {
  enabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
  routineReminders: boolean;
  weeklySummary: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  routineReminders: true,
  weeklySummary: true,
};

class NotificationService {
  private handlerConfigured = false;

  private async ensureNotificationHandler() {
    if (this.handlerConfigured) {
      return;
    }

    const Notifications = await getExpoNotifications();
    if (!Notifications) {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    this.handlerConfigured = true;
  }

  async registerForPushNotificationsAsync() {
    if (Platform.OS === 'web') {
      return null;
    }

    await this.ensureNotificationHandler();
    const Notifications = await getExpoNotifications();
    if (!Notifications) {
      return null;
    }

    if (!Device.isDevice) {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      return null;
    }

    try {
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      return token;
    } catch (e) {
      console.error("Failed to get push token", e);
      return null;
    }
  }

  async scheduleRoutineReminder(routineName: string, date: Date) {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.routineReminders) return;
    const Notifications = await getExpoNotifications();
    if (!Notifications) return;

    // Check quiet hours
    if (settings.quietHoursEnabled && this.isInQuietHours(date, settings)) {
        // In a real app, we might shift the reminder or skip it
        return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Routine Reminder",
        body: `It's time for your ${routineName}!`,
        data: { url: "/(auth)/(tabs)/routines" },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  }

  async cancelAllReminders() {
    const Notifications = await getExpoNotifications();
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  getSettings(): NotificationSettings {
    const saved = storage.getString("notification-settings");
    if (!saved) return DEFAULT_NOTIFICATION_SETTINGS;
    try {
      return JSON.parse(saved);
    } catch {
      console.warn("[NotificationService] corrupt notification-settings in storage, resetting to defaults");
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  saveSettings(settings: NotificationSettings) {
    storage.set("notification-settings", JSON.stringify(settings));
  }

  private isInQuietHours(date: Date, settings: NotificationSettings): boolean {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const currentTime = hours * 60 + minutes;

    const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
    const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
    
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    if (startTime > endTime) {
      // Overnight quiet hours (e.g. 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }
}

export const notificationService = new NotificationService();
