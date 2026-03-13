import React from "react";
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { borderRadius, colors, shadows, spacing } from "../../theme";

type SoftCardTone = "default" | "muted" | "highlight" | "success" | "warning";

interface SoftCardProps extends ViewProps {
  children: React.ReactNode;
  tone?: SoftCardTone;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

const toneStyles: Record<SoftCardTone, ViewStyle> = {
  default: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderLight,
  },
  muted: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.borderLight,
  },
  highlight: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.borderMuted,
  },
  success: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  warning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
};

export function SoftCard({
  children,
  tone = "default",
  padded = true,
  style,
  ...rest
}: SoftCardProps) {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        toneStyles[tone],
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.md,
  },
  padded: {
    padding: spacing.lg,
  },
});
