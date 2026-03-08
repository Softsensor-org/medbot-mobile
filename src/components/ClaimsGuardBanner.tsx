/**
 * IMP-157: Fail-closed fallback banner for suppressed aspirational claims.
 *
 * Displayed in place of aspirational content when the claims guard
 * determines the content is not safe to show (low confidence,
 * active escalation, or red flags).
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography, spacing } from "../theme";
import { borderRadius } from "../theme/spacing";
import type { SuppressionReason } from "../hooks/useClaimsGuard";

const ICONS: Record<SuppressionReason, string> = {
  low_confidence: "i",
  escalation_active: "!",
  red_flags_present: "!",
};

const TITLES: Record<SuppressionReason, string> = {
  low_confidence: "More data needed",
  escalation_active: "Clinical review in progress",
  red_flags_present: "Professional review recommended",
};

const BORDER_COLORS: Record<SuppressionReason, string> = {
  low_confidence: colors.info,
  escalation_active: colors.warning,
  red_flags_present: colors.error,
};

interface ClaimsGuardBannerProps {
  reason: SuppressionReason;
  message: string;
}

export function ClaimsGuardBanner({ reason, message }: ClaimsGuardBannerProps) {
  const borderColor = BORDER_COLORS[reason];

  return (
    <View
      style={[styles.container, { borderLeftColor: borderColor }]}
      accessibilityRole="alert"
    >
      <View style={styles.header}>
        <View
          style={[styles.iconCircle, { backgroundColor: borderColor }]}
        >
          <Text style={styles.iconText}>{ICONS[reason]}</Text>
        </View>
        <Text style={styles.title}>{TITLES[reason]}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  iconText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    ...typography.label,
    color: colors.textPrimary,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
