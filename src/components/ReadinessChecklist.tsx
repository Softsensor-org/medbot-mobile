import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius, shadows } from "../theme";
import { usePrepChecklist } from "../hooks/useReadiness";

export const ReadinessChecklist: React.FC = () => {
  const { data, isLoading } = usePrepChecklist();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!data) return null;

  const statusColorMap: Record<string, string> = {
    ready: colors.success,
    needs_attention: colors.warning ?? "#F59E0B",
    not_ready: colors.error,
  };

  const statusColor = statusColorMap[data.readiness_status] ?? colors.primary;
  const statusLabel =
    data.readiness_status === "ready"
      ? "Ready"
      : data.readiness_status === "needs_attention"
        ? "Needs attention"
        : "Not ready";

  return (
    <View style={[styles.container, { borderLeftColor: statusColor }]}>
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: statusColor + "1A" }]}>
          <MaterialIcons name="assignment-turned-in" size={18} color={statusColor} />
        </View>
        <Text style={styles.title}>Pre-treatment readiness</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "1A" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel} · {data.completion_percent}%
          </Text>
        </View>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${data.completion_percent}%`,
              backgroundColor: statusColor,
            },
          ]}
        />
      </View>

      {data.items.map((item) => (
        <View key={item.key} style={styles.itemRow}>
          <MaterialIcons
            name={item.completed ? "check-circle-outline" : "radio-button-unchecked"}
            size={20}
            color={item.completed ? colors.success : colors.textDisabled}
            style={styles.itemIcon}
          />
          <View style={styles.itemContent}>
            <Text
              style={[
                styles.itemLabel,
                item.completed && styles.itemLabelDone,
              ]}
            >
              {item.label}
            </Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
            {item.progress != null && !item.completed && (
              <View style={styles.itemProgressBg}>
                <View
                  style={[
                    styles.itemProgressFill,
                    { width: `${item.progress * 100}%` },
                  ]}
                />
              </View>
            )}
          </View>
        </View>
      ))}

      <Text style={styles.guidance}>{data.prep_guidance}</Text>
      <Text style={styles.nextAction}>{data.next_action}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...typography.label,
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  itemIcon: {
    marginTop: 2,
    marginRight: spacing.sm,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  itemLabelDone: {
    textDecorationLine: "line-through",
    color: colors.textSecondary,
  },
  itemDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemProgressBg: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  itemProgressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  guidance: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  nextAction: {
    ...typography.body,
    fontWeight: "600",
    color: colors.primary,
  },
});
