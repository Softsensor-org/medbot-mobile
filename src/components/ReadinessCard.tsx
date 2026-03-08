/**
 * IMP-158: User-facing event readiness card.
 *
 * Displays readiness score, status, intervention highlights,
 * and the recommended next action.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography, spacing } from "../theme";
import { borderRadius } from "../theme/spacing";
import type { ReadinessSummary } from "../api/readinessApi";

const STATUS_CONFIG = {
  ready: {
    label: "Ready",
    color: colors.success,
    bgColor: "#E8F5E9",
  },
  needs_attention: {
    label: "Needs Attention",
    color: colors.warning,
    bgColor: "#FFF3E0",
  },
  not_ready: {
    label: "Not Ready",
    color: colors.error,
    bgColor: "#FFEBEE",
  },
} as const;

interface ReadinessCardProps {
  readiness: ReadinessSummary;
}

function StatusBadge({ status }: { status: ReadinessSummary["status"] }) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 70 ? colors.success : pct >= 40 ? colors.warning : colors.error;
  return (
    <View style={styles.scoreContainer}>
      <Text style={[styles.scoreValue, { color }]}>{pct}%</Text>
      <Text style={styles.scoreLabel}>Readiness</Text>
    </View>
  );
}

export function ReadinessCard({ readiness }: ReadinessCardProps) {
  return (
    <View style={styles.card} accessibilityLabel="Event readiness summary">
      <View style={styles.header}>
        <Text style={styles.title}>Visit Readiness</Text>
        <StatusBadge status={readiness.status} />
      </View>

      <View style={styles.body}>
        <ScoreRing score={readiness.readiness_score} />

        <View style={styles.stats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Evidence</Text>
            <Text style={styles.statValue}>
              {Math.round(readiness.evidence_completeness * 100)}%
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Adherence</Text>
            <Text style={styles.statValue}>
              {Math.round(readiness.adherence_rate * 100)}%
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Photos</Text>
            <Text style={styles.statValue}>{readiness.photo_count}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Sessions</Text>
            <Text style={styles.statValue}>{readiness.session_count}</Text>
          </View>
        </View>
      </View>

      {readiness.risk_flags.escalation_active && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            Clinical attention needed — follow up with your provider.
          </Text>
        </View>
      )}

      <View style={styles.nextAction}>
        <Text style={styles.nextActionLabel}>Next Step</Text>
        <Text style={styles.nextActionText}>{readiness.next_action}</Text>
      </View>

      {readiness.intervention_highlights.length > 0 && (
        <View style={styles.highlights}>
          <Text style={styles.highlightsTitle}>Recent Activity</Text>
          {readiness.intervention_highlights.slice(0, 3).map((h, i) => (
            <View key={i} style={styles.highlightRow}>
              <View
                style={[
                  styles.highlightDot,
                  {
                    backgroundColor:
                      h.event_type === "safety"
                        ? colors.error
                        : h.event_type === "action"
                          ? colors.warning
                          : colors.primary,
                  },
                ]}
              />
              <Text style={styles.highlightText} numberOfLines={1}>
                {h.description}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: "600",
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  scoreContainer: {
    alignItems: "center",
    marginRight: spacing.lg,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stats: {
    flex: 1,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  alertBanner: {
    backgroundColor: "#FFEBEE",
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  alertText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: "500",
  },
  nextAction: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  nextActionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nextActionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  highlights: {
    marginTop: spacing.sm,
  },
  highlightsTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
  },
  highlightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  highlightText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
  },
});
