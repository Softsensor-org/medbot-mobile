import { Platform } from "react-native";
import type * as ExpoNotifications from "expo-notifications";

type ExpoNotificationsModule = typeof ExpoNotifications;

let notificationsModule: ExpoNotificationsModule | null = null;

export async function getExpoNotifications(): Promise<ExpoNotificationsModule | null> {
  if (Platform.OS === "web") {
    return null;
  }

  notificationsModule ??= require("expo-notifications") as ExpoNotificationsModule;
  return notificationsModule;
}
