import React from "react";
import { StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, spacing, typography } from "../../theme";
import { PrimaryButton } from "./PrimaryButton";
import { SoftCard } from "./SoftCard";

interface EmptyStateCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EmptyStateCard({
  title,
  description,
  icon,
  actionLabel,
  onActionPress,
  style,
  testID,
}: EmptyStateCardProps) {
  return (
    <SoftCard style={[styles.card, style]} testID={testID} tone="muted">
      {icon}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onActionPress ? (
        <PrimaryButton label={actionLabel} onPress={onActionPress} />
      ) : null}
    </SoftCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: "center",
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
