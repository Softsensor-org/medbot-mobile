import * as ExpoHaptics from "expo-haptics";
import { getEngagementSettings } from "./engagementSettings";

export type EngagementHapticEvent =
  | "routine_complete"
  | "milestone_achieved"
  | "warning_acknowledged";

export async function triggerEngagementHaptic(event: EngagementHapticEvent): Promise<boolean> {
  const settings = getEngagementSettings();
  if (!settings.hapticsEnabled) return false;

  try {
    if (event === "routine_complete") {
      await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
      return true;
    }
    if (event === "milestone_achieved") {
      await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      return true;
    }
    await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
    return true;
  } catch {
    return false;
  }
}
