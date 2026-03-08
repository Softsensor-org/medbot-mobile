import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useNotifications } from '../../src/hooks/useNotifications';
import { NativeDateTimePicker } from '../../src/components/common/NativeDateTimePicker';
import { parse, format } from 'date-fns';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, requestPermissions, isLoading } = useNotifications();

  const handleToggleEnabled = async (value: boolean) => {
    if (value) {
      await requestPermissions();
    } else {
      updateSettings({ ...settings, enabled: false });
    }
  };

  const handleToggleQuietHours = (value: boolean) => {
    updateSettings({ ...settings, quietHoursEnabled: value });
  };

  const updateTime = (key: 'quietHoursStart' | 'quietHoursEnd', date: Date) => {
    updateSettings({ ...settings, [key]: format(date, 'HH:mm') });
  };

  const parseTime = (timeStr: string) => {
    return parse(timeStr, 'HH:mm', new Date());
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Push Notifications</Text>
            <Text style={styles.description}>Receive reminders and updates.</Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={handleToggleEnabled}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.enabled ? colors.primary : colors.surface}
          />
        </View>
      </View>

      {settings.enabled && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Routine Reminders</Text>
              <Switch
                value={settings.routineReminders}
                onValueChange={(v) => updateSettings({ ...settings, routineReminders: v })}
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Weekly Progress Reveal</Text>
              <Switch
                value={settings.weeklySummary}
                onValueChange={(v) => updateSettings({ ...settings, weeklySummary: v })}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Quiet Hours</Text>
                <Text style={styles.description}>Silence notifications during these times.</Text>
              </View>
              <Switch
                value={settings.quietHoursEnabled}
                onValueChange={handleToggleQuietHours}
              />
            </View>

            {settings.quietHoursEnabled && (
              <View style={styles.timeContainer}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Start</Text>
                  <NativeDateTimePicker
                    mode="time"
                    value={parseTime(settings.quietHoursStart)}
                    onChange={(d) => updateTime('quietHoursStart', d)}
                  />
                </View>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>End</Text>
                  <NativeDateTimePicker
                    mode="time"
                    value={parseTime(settings.quietHoursEnd)}
                    onChange={(d) => updateTime('quietHoursEnd', d)}
                  />
                </View>
              </View>
            )}
          </View>
        </>
      )}

      <View style={styles.infoBox}>
        <MaterialIcons name="info-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.infoText}>
          Notifications help you stay consistent with your skin care routine and track changes effectively.
        </Text>
      </View>
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  labelContainer: {
    flex: 1,
    paddingRight: spacing.md,
  },
  label: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 18,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
});
