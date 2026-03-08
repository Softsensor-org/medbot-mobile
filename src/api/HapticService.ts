import * as Haptics from 'expo-haptics';
import { AccessibilityInfo, Platform } from 'react-native';

class HapticService {
  private isReduceMotionEnabled = false;

  constructor() {
    this.checkAccessibility();
    // Listen for changes
    if (Platform.OS !== 'web') {
        AccessibilityInfo.addEventListener('reduceMotionChanged', (isEnabled) => {
            this.isReduceMotionEnabled = isEnabled;
        });
    }
  }

  private async checkAccessibility() {
    if (Platform.OS !== 'web') {
        this.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
    }
  }

  impact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
    if (this.isReduceMotionEnabled) return;
    Haptics.impactAsync(style);
  }

  notification(type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) {
    if (this.isReduceMotionEnabled) return;
    Haptics.notificationAsync(type);
  }

  selection() {
    if (this.isReduceMotionEnabled) return;
    Haptics.selectionAsync();
  }

  // Semantic triggers
  triggerSuccess() {
    this.notification(Haptics.NotificationFeedbackType.Success);
  }

  triggerWarning() {
    this.impact(Haptics.ImpactFeedbackStyle.Medium);
  }

  triggerError() {
    this.notification(Haptics.NotificationFeedbackType.Error);
  }

  triggerSelection() {
    this.impact(Haptics.ImpactFeedbackStyle.Light);
  }
}

export const hapticService = new HapticService();
