import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, typography, spacing, borderRadius } from "../theme";
import type { ChatCard } from "../types/ai";
import type { SessionSummaryData } from "../types/wellness";
import { sessionsApi } from "../api/sessionsApi";

interface ChatCardInlineProps {
  card: ChatCard;
  onCardUpdate?: (updated: ChatCard) => void;
  escalationActive?: boolean;
}

export const ChatCardInline: React.FC<ChatCardInlineProps> = ({ card, onCardUpdate, escalationActive }) => {
  const [isFlagging, setIsFlagging] = useState(false);
  const router = useRouter();

  const handleFlag = async () => {
    setIsFlagging(true);
    try {
      const updated = await sessionsApi.flagCard(card.card_id);
      onCardUpdate?.(updated);
    } catch (err) {
      console.error("Failed to flag card:", err);
    } finally {
      setIsFlagging(false);
    }
  };

  const showRoutineHandoff =
    card.card_type === "routine" &&
    card.status === "confirmed" &&
    !escalationActive;

  if (card.card_type === "summary") {
    return <SummaryCardView card={card} isFlagging={isFlagging} onFlag={handleFlag} />;
  }

  // Fallback for other card types (symptom, product, routine, intervention)
  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderLeftColor: colors.textSecondary }]}>
        <MaterialIcons name="info" size={20} color={colors.textSecondary} />
        <Text style={styles.title}>{card.card_type}</Text>
      </View>
      <Text style={styles.bodyText}>{JSON.stringify(card.data)}</Text>
      {showRoutineHandoff && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.routineHandoffButton}
            testID="routine-handoff-button"
            onPress={() =>
              router.push({
                pathname: "/(auth)/(tabs)/routines",
                params: { from_chat: "true" },
              })
            }
          >
            <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
            <Text style={styles.routineHandoffText}>Go to Routine</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

interface SummaryCardViewProps {
  card: ChatCard;
  isFlagging: boolean;
  onFlag: () => void;
}

const SummaryCardView: React.FC<SummaryCardViewProps> = ({ card, isFlagging, onFlag }) => {
  const body = card.data as unknown as SessionSummaryData;
  const isFlagged = card.status === "flagged";

  return (
    <View style={[styles.container, styles.summaryContainer]}>
      <View style={[styles.header, { borderLeftColor: colors.info }]}>
        <MaterialIcons name="article" size={20} color={colors.info} />
        <Text style={styles.title}>Session Summary</Text>
        {isFlagged && (
          <View style={styles.flaggedBadge}>
            <Text style={styles.flaggedBadgeText}>Flagged</Text>
          </View>
        )}
      </View>

      {/* Topics discussed as chips */}
      {body.topics_discussed && body.topics_discussed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Topics Discussed</Text>
          <View style={styles.chipRow}>
            {body.topics_discussed.map((topic, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{topic}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Data captured as list */}
      {body.data_captured && body.data_captured.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data Captured</Text>
          {body.data_captured.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <MaterialIcons name="check-circle" size={14} color={colors.success} />
              <Text style={styles.listItemText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommended next step */}
      {body.recommended_next_step && (
        <View style={styles.nextStepContainer}>
          <MaterialIcons name="arrow-forward" size={16} color={colors.info} />
          <Text style={styles.nextStepText}>{body.recommended_next_step}</Text>
        </View>
      )}

      {/* Turn count metadata */}
      {body.turn_count != null && (
        <Text style={styles.metaText}>
          {body.turn_count} turn{body.turn_count !== 1 ? "s" : ""} in this session
        </Text>
      )}

      {/* Actions */}
      {!isFlagged && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.flagButton}
            onPress={onFlag}
            disabled={isFlagging}
          >
            {isFlagging ? (
              <ActivityIndicator size="small" color={colors.warning} />
            ) : (
              <>
                <MaterialIcons name="flag" size={16} color={colors.warning} />
                <Text style={styles.flagButtonText}>Flag for Correction</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summaryContainer: {
    borderColor: colors.infoLight,
    backgroundColor: colors.infoLight + "40",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  bodyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.info + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  chipText: {
    ...typography.caption,
    color: colors.info,
    fontSize: 11,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  listItemText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  nextStepContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.infoLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  nextStepText: {
    ...typography.body,
    color: colors.info,
    fontWeight: "600",
    marginLeft: spacing.xs,
    flex: 1,
  },
  metaText: {
    ...typography.caption,
    color: colors.textDisabled,
    marginBottom: spacing.sm,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  flagButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  flagButtonText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: spacing.xs,
    fontWeight: "600",
  },
  flaggedBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  flaggedBadgeText: {
    ...typography.caption,
    color: colors.warning,
    fontSize: 10,
    fontWeight: "700",
  },
  routineHandoffButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  routineHandoffText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: "600",
  },
});
