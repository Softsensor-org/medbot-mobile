import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, typography, spacing } from "../../src/theme";
import { borderRadius } from "../../src/theme/spacing";
import type { ReminderPreferences } from "../../src/notifications";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  requestPermission,
  setupChannels,
  syncSchedule,
} from "../../src/notifications";

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${String(minute).padStart(2, "0")} ${ampm}`;
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, disabled && styles.textDisabled]}>
          {label}
        </Text>
        {description ? (
          <Text
            style={[styles.rowDescription, disabled && styles.textDisabled]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.surface}
      />
    </View>
  );
}

function TimePicker({
  label,
  hour,
  minute,
  onChangeHour,
  disabled,
}: {
  label: string;
  hour: number;
  minute: number;
  onChangeHour: (h: number) => void;
  disabled?: boolean;
}) {
  const cycleHour = useCallback(
    (direction: 1 | -1) => {
      if (disabled) return;
      onChangeHour((hour + direction + 24) % 24);
    },
    [hour, onChangeHour, disabled],
  );

  return (
    <View style={[styles.timePickerRow, disabled && styles.rowDisabled]}>
      <Text style={[styles.timeLabel, disabled && styles.textDisabled]}>
        {label}
      </Text>
      <View style={styles.timeControl}>
        <TouchableOpacity
          onPress={() => cycleHour(-1)}
          disabled={disabled}
          style={styles.timeButton}
          accessibilityLabel={`Decrease ${label} hour`}
        >
          <Text style={styles.timeButtonText}>-</Text>
        </TouchableOpacity>
        <Text
          style={[styles.timeValue, disabled && styles.textDisabled]}
          accessibilityLabel={`${label} time`}
        >
          {formatTime(hour, minute)}
        </Text>
        <TouchableOpacity
          onPress={() => cycleHour(1)}
          disabled={disabled}
          style={styles.timeButton}
          accessibilityLabel={`Increase ${label} hour`}
        >
          <Text style={styles.timeButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<ReminderPreferences>({
    ...DEFAULT_PREFERENCES,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPreferences().then((p) => {
      setPrefs(p);
      setLoaded(true);
    });
  }, []);

  const updatePrefs = useCallback(
    async (patch: Partial<ReminderPreferences>) => {
      const next = { ...prefs, ...patch };
      setPrefs(next);
      await savePreferences(next);
      await syncSchedule(next);
    },
    [prefs],
  );

  const handlePushToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to receive reminders.",
          );
          return;
        }
        await setupChannels();
      }
      await updatePrefs({ pushEnabled: enabled });
    },
    [updatePrefs],
  );

  const handleQuietHoursToggle = useCallback(
    (enabled: boolean) => {
      updatePrefs({
        quietHours: { ...prefs.quietHours, enabled },
      });
    },
    [prefs.quietHours, updatePrefs],
  );

  const handleQuietStart = useCallback(
    (h: number) => {
      updatePrefs({
        quietHours: { ...prefs.quietHours, startHour: h },
      });
    },
    [prefs.quietHours, updatePrefs],
  );

  const handleQuietEnd = useCallback(
    (h: number) => {
      updatePrefs({
        quietHours: { ...prefs.quietHours, endHour: h },
      });
    },
    [prefs.quietHours, updatePrefs],
  );

  if (!loaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Settings</Text>

      <SectionHeader title="Notifications" />
      <View style={styles.card}>
        <SettingRow
          label="Push Notifications"
          description="Receive reminders for routines and weekly summaries"
          value={prefs.pushEnabled}
          onValueChange={handlePushToggle}
        />

        <View style={styles.divider} />

        <SettingRow
          label="Routine Reminders"
          description="Daily reminders for your skincare routines"
          value={prefs.routineReminders}
          onValueChange={(v) => updatePrefs({ routineReminders: v })}
          disabled={!prefs.pushEnabled}
        />

        <View style={styles.divider} />

        <SettingRow
          label="Weekly Summary"
          description="Get a weekly overview of your skin health progress"
          value={prefs.weeklySummary}
          onValueChange={(v) => updatePrefs({ weeklySummary: v })}
          disabled={!prefs.pushEnabled}
        />
      </View>

      <SectionHeader title="Quiet Hours" />
      <View style={styles.card}>
        <SettingRow
          label="Enable Quiet Hours"
          description="Suppress notifications during set hours"
          value={prefs.quietHours.enabled}
          onValueChange={handleQuietHoursToggle}
          disabled={!prefs.pushEnabled}
        />

        <View style={styles.divider} />

        <TimePicker
          label="Start"
          hour={prefs.quietHours.startHour}
          minute={prefs.quietHours.startMinute}
          onChangeHour={handleQuietStart}
          disabled={!prefs.pushEnabled || !prefs.quietHours.enabled}
        />

        <TimePicker
          label="End"
          hour={prefs.quietHours.endHour}
          minute={prefs.quietHours.endMinute}
          onChangeHour={handleQuietEnd}
          disabled={!prefs.pushEnabled || !prefs.quietHours.enabled}
        />
      </View>

      {Platform.OS === "web" && (
        <Text style={styles.webNote}>
          Push notifications are only available on iOS and Android.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowText: {
    flex: 1,
    marginRight: spacing.md,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  rowDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textDisabled: {
    color: colors.textDisabled,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },
  timePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timeLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  timeControl: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  timeButtonText: {
    ...typography.h3,
    color: colors.primary,
  },
  timeValue: {
    ...typography.body,
    color: colors.textPrimary,
    minWidth: 80,
    textAlign: "center",
  },
  webNote: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
