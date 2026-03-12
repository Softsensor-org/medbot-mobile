import { Platform } from "react-native";
import type { ReminderPreferences, QuietHours } from "./types";
import { NOTIFICATION_CONTENT, WEEKLY_SUMMARY_DEEP_LINK } from "./types";
import { getExpoNotifications } from "./expoNotifications";

const ROUTINE_CHANNEL_ID = "routine-reminders";
const WEEKLY_CHANNEL_ID = "weekly-summary";

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const Notifications = await getExpoNotifications();
  if (!Notifications) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function setupChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  const Notifications = await getExpoNotifications();
  if (!Notifications) return;
  await Notifications.setNotificationChannelAsync(ROUTINE_CHANNEL_ID, {
    name: "Routine Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync(WEEKLY_CHANNEL_ID, {
    name: "Weekly Summary",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export function isInQuietHours(quietHours: QuietHours, now = new Date()): boolean {
  if (!quietHours.enabled) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = quietHours.startHour * 60 + quietHours.startMinute;
  const endMinutes = quietHours.endHour * 60 + quietHours.endMinute;

  if (startMinutes <= endMinutes) {
    // Same day range (e.g., 9:00 - 17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Overnight range (e.g., 22:00 - 7:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export async function scheduleWeeklySummary(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const Notifications = await getExpoNotifications();
  if (!Notifications) return null;
  // Cancel existing weekly summary notifications
  await cancelWeeklySummary();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: NOTIFICATION_CONTENT.weeklySummary.title,
      body: NOTIFICATION_CONTENT.weeklySummary.body,
      data: { deepLink: WEEKLY_SUMMARY_DEEP_LINK },
      ...(Platform.OS === "android" && { channelId: WEEKLY_CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 9,
      minute: 0,
    },
  });
  return id;
}

export async function scheduleRoutineReminder(
  hour: number,
  minute: number,
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const Notifications = await getExpoNotifications();
  if (!Notifications) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: NOTIFICATION_CONTENT.routineReminder.title,
      body: NOTIFICATION_CONTENT.routineReminder.body,
      ...(Platform.OS === "android" && { channelId: ROUTINE_CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return id;
}

export async function cancelWeeklySummary(): Promise<void> {
  if (Platform.OS === "web") return;
  const Notifications = await getExpoNotifications();
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.deepLink === WEEKLY_SUMMARY_DEEP_LINK) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  const Notifications = await getExpoNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function syncSchedule(prefs: ReminderPreferences): Promise<void> {
  if (!prefs.pushEnabled) {
    await cancelAllReminders();
    return;
  }

  if (prefs.weeklySummary) {
    await scheduleWeeklySummary();
  } else {
    await cancelWeeklySummary();
  }

  // Routine reminders: cancel and re-schedule
  // (Individual routine scheduling would be driven by the routines data,
  // but for now we set a default morning reminder if enabled)
  if (prefs.routineReminders) {
    await scheduleRoutineReminder(8, 0);
  }
}
