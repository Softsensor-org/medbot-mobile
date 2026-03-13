import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { borderRadius, colors, spacing, typography } from "../../theme";

type MetricChipTone = "default" | "primary" | "success" | "warning" | "info";

interface MetricChipProps {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  tone?: MetricChipTone;
  style?: StyleProp<ViewStyle>;
}

const toneMap: Record<MetricChipTone, ViewStyle> = {
  default: { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight },
  primary: { backgroundColor: colors.surfaceStrong, borderColor: colors.borderMuted },
  success: { backgroundColor: colors.successLight, borderColor: colors.success },
  warning: { backgroundColor: colors.warningLight, borderColor: colors.warning },
  info: { backgroundColor: colors.infoLight, borderColor: colors.info },
};

export function MetricChip({
  label,
  value,
  icon,
  tone = "default",
  style,
}: MetricChipProps) {
  return (
    <View style={[styles.chip, toneMap[tone], style]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {value ? <Text style={styles.value}>{value}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 48,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    gap: 2,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
});
