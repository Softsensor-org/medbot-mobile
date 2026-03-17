import React, { useRef, useState } from "react";
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
  const flagInFlightRef = useRef(false);
  const router = useRouter();

  const handleFlag = async () => {
    if (flagInFlightRef.current) {
      return;
    }
    flagInFlightRef.current = true;
    setIsFlagging(true);
    try {
      const updated = await sessionsApi.flagCard(card.card_id);
      onCardUpdate?.(updated);
    } catch (err) {
      console.error("Failed to flag card:", err);
    } finally {
      flagInFlightRef.current = false;
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

  if (card.card_type === "symptom") {
    return <SymptomCardView card={card} isFlagging={isFlagging} onFlag={handleFlag} />;
  }

  if (card.card_type === "product") {
    return <ProductCardView card={card} isFlagging={isFlagging} onFlag={handleFlag} />;
  }

  if (card.card_type === "routine") {
    return (
      <RoutineCardView
        card={card}
        isFlagging={isFlagging}
        onFlag={handleFlag}
        showHandoff={showRoutineHandoff}
        onHandoff={() =>
          router.push({
            pathname: "/(auth)/(tabs)/routines",
            params: { from_chat: "true" },
          })
        }
      />
    );
  }

  if (card.card_type === "intervention") {
    return <InterventionCardView card={card} isFlagging={isFlagging} onFlag={handleFlag} />;
  }

  if (card.card_type === "escalation") {
    return <EscalationCardView card={card} />;
  }

  // Unknown card type — structured fallback instead of raw JSON
  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderLeftColor: colors.textSecondary }]}>
        <MaterialIcons name="info" size={20} color={colors.textSecondary} />
        <Text style={styles.title}>{titleize(card.card_type)}</Text>
      </View>
      <DataFieldList data={card.data} />
    </View>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function titleize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/** Render a Record<string, unknown> as human-readable key-value rows. */
const DataFieldList: React.FC<{ data: Record<string, unknown> }> = ({ data }) => (
  <View>
    {Object.entries(data).map(([key, value]) => {
      if (value == null || value === "") return null;
      const display = Array.isArray(value) ? value.join(", ") : String(value);
      return (
        <View key={key} style={styles.listItem}>
          <Text style={styles.sectionLabel}>{titleize(key)}</Text>
          <Text style={styles.listItemText}>{display}</Text>
        </View>
      );
    })}
  </View>
);

const CardFlagAction: React.FC<{ isFlagging: boolean; onFlag: () => void; isFlagged: boolean }> = ({
  isFlagging, onFlag, isFlagged,
}) => {
  if (isFlagged) return null;
  return (
    <View style={styles.actionsRow}>
      <TouchableOpacity style={styles.flagButton} onPress={onFlag} disabled={isFlagging}>
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
  );
};

// ---------------------------------------------------------------------------
// Symptom Card
// ---------------------------------------------------------------------------

const CARD_COLORS: Record<string, string> = {
  symptom: colors.error ?? "#e53935",
  product: colors.success ?? "#43a047",
  routine: colors.primary ?? "#1976d2",
  intervention: colors.warning ?? "#fb8c00",
  escalation: "#d32f2f",
};

const SymptomCardView: React.FC<{ card: ChatCard; isFlagging: boolean; onFlag: () => void }> = ({
  card, isFlagging, onFlag,
}) => {
  const d = card.data as { name?: string; body_location?: string; severity?: string; duration?: string; onset?: string };
  const accent = CARD_COLORS.symptom;
  return (
    <View style={[styles.container, { borderColor: accent + "40" }]}>
      <View style={[styles.header, { borderLeftColor: accent }]}>
        <MaterialIcons name="healing" size={20} color={accent} />
        <Text style={styles.title}>Symptom</Text>
        {card.status === "flagged" && <View style={styles.flaggedBadge}><Text style={styles.flaggedBadgeText}>Flagged</Text></View>}
      </View>
      {d.name && <Text style={styles.cardHeadline}>{d.name}</Text>}
      {d.body_location && (
        <View style={styles.listItem}>
          <MaterialIcons name="place" size={14} color={colors.textSecondary} />
          <Text style={styles.listItemText}>{d.body_location}</Text>
        </View>
      )}
      {d.severity && (
        <View style={styles.listItem}>
          <MaterialIcons name="thermostat" size={14} color={colors.textSecondary} />
          <Text style={styles.listItemText}>Severity: {d.severity}</Text>
        </View>
      )}
      {d.duration && (
        <View style={styles.listItem}>
          <MaterialIcons name="schedule" size={14} color={colors.textSecondary} />
          <Text style={styles.listItemText}>Duration: {d.duration}</Text>
        </View>
      )}
      {d.onset && (
        <View style={styles.listItem}>
          <MaterialIcons name="today" size={14} color={colors.textSecondary} />
          <Text style={styles.listItemText}>Onset: {d.onset}</Text>
        </View>
      )}
      <CardFlagAction isFlagging={isFlagging} onFlag={onFlag} isFlagged={card.status === "flagged"} />
    </View>
  );
};

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------

const ProductCardView: React.FC<{ card: ChatCard; isFlagging: boolean; onFlag: () => void }> = ({
  card, isFlagging, onFlag,
}) => {
  const d = card.data as { name?: string; usage?: string; query_type?: string };
  const accent = CARD_COLORS.product;
  return (
    <View style={[styles.container, { borderColor: accent + "40" }]}>
      <View style={[styles.header, { borderLeftColor: accent }]}>
        <MaterialIcons name="inventory-2" size={20} color={accent} />
        <Text style={styles.title}>Product</Text>
        {card.status === "flagged" && <View style={styles.flaggedBadge}><Text style={styles.flaggedBadgeText}>Flagged</Text></View>}
      </View>
      {d.name && <Text style={styles.cardHeadline}>{d.name}</Text>}
      {d.usage && (
        <View style={styles.listItem}>
          <MaterialIcons name="info-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.listItemText}>{d.usage}</Text>
        </View>
      )}
      {d.query_type && (
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: accent + "20" }]}>
            <Text style={[styles.chipText, { color: accent }]}>{titleize(d.query_type)}</Text>
          </View>
        </View>
      )}
      <CardFlagAction isFlagging={isFlagging} onFlag={onFlag} isFlagged={card.status === "flagged"} />
    </View>
  );
};

// ---------------------------------------------------------------------------
// Routine Card
// ---------------------------------------------------------------------------

const RoutineCardView: React.FC<{
  card: ChatCard;
  isFlagging: boolean;
  onFlag: () => void;
  showHandoff: boolean;
  onHandoff: () => void;
}> = ({ card, isFlagging, onFlag, showHandoff, onHandoff }) => {
  const d = card.data as { routine_type?: string; keywords?: string[]; frequency?: string; suggested_action?: string };
  const accent = CARD_COLORS.routine;
  return (
    <View style={[styles.container, { borderColor: accent + "40" }]}>
      <View style={[styles.header, { borderLeftColor: accent }]}>
        <MaterialIcons name="event-repeat" size={20} color={accent} />
        <Text style={styles.title}>Routine</Text>
        {card.status === "flagged" && <View style={styles.flaggedBadge}><Text style={styles.flaggedBadgeText}>Flagged</Text></View>}
      </View>
      {d.routine_type && <Text style={styles.cardHeadline}>{titleize(d.routine_type)}</Text>}
      {d.frequency && (
        <View style={styles.listItem}>
          <MaterialIcons name="schedule" size={14} color={colors.textSecondary} />
          <Text style={styles.listItemText}>{d.frequency}</Text>
        </View>
      )}
      {d.suggested_action && (
        <View style={styles.listItem}>
          <MaterialIcons name="lightbulb-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.listItemText}>Suggested: {titleize(d.suggested_action)}</Text>
        </View>
      )}
      {d.keywords && d.keywords.length > 0 && (
        <View style={styles.chipRow}>
          {d.keywords.map((kw, i) => (
            <View key={i} style={[styles.chip, { backgroundColor: accent + "20" }]}>
              <Text style={[styles.chipText, { color: accent }]}>{kw}</Text>
            </View>
          ))}
        </View>
      )}
      {showHandoff && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.routineHandoffButton} testID="routine-handoff-button" onPress={onHandoff}>
            <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
            <Text style={styles.routineHandoffText}>Go to Routine</Text>
          </TouchableOpacity>
        </View>
      )}
      <CardFlagAction isFlagging={isFlagging} onFlag={onFlag} isFlagged={card.status === "flagged"} />
    </View>
  );
};

// ---------------------------------------------------------------------------
// Intervention Card
// ---------------------------------------------------------------------------

const InterventionCardView: React.FC<{ card: ChatCard; isFlagging: boolean; onFlag: () => void }> = ({
  card, isFlagging, onFlag,
}) => {
  const d = card.data as { intervention_type?: string; description?: string; related_symptoms?: string[] };
  const accent = CARD_COLORS.intervention;
  return (
    <View style={[styles.container, { borderColor: accent + "40" }]}>
      <View style={[styles.header, { borderLeftColor: accent }]}>
        <MaterialIcons name="medical-services" size={20} color={accent} />
        <Text style={styles.title}>Intervention</Text>
        {card.status === "flagged" && <View style={styles.flaggedBadge}><Text style={styles.flaggedBadgeText}>Flagged</Text></View>}
      </View>
      {d.intervention_type && <Text style={styles.cardHeadline}>{titleize(d.intervention_type)}</Text>}
      {d.description && <Text style={styles.bodyText}>{d.description}</Text>}
      {d.related_symptoms && d.related_symptoms.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Related Symptoms</Text>
          <View style={styles.chipRow}>
            {d.related_symptoms.map((s, i) => (
              <View key={i} style={[styles.chip, { backgroundColor: accent + "20" }]}>
                <Text style={[styles.chipText, { color: accent }]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      <CardFlagAction isFlagging={isFlagging} onFlag={onFlag} isFlagged={card.status === "flagged"} />
    </View>
  );
};

// ---------------------------------------------------------------------------
// Escalation Card
// ---------------------------------------------------------------------------

const EscalationCardView: React.FC<{ card: ChatCard }> = ({ card }) => {
  const d = card.data as { guidance?: string; category?: string };
  return (
    <View style={[styles.container, { borderColor: "#d32f2f40", backgroundColor: "#d32f2f10" }]}>
      <View style={[styles.header, { borderLeftColor: "#d32f2f" }]}>
        <MaterialIcons name="warning" size={20} color="#d32f2f" />
        <Text style={styles.title}>Escalation Required</Text>
      </View>
      {d.category && (
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: "#d32f2f20" }]}>
            <Text style={[styles.chipText, { color: "#d32f2f" }]}>{titleize(d.category)}</Text>
          </View>
        </View>
      )}
      {d.guidance && <Text style={[styles.bodyText, { marginTop: spacing.xs }]}>{d.guidance}</Text>}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Summary Card (existing)
// ---------------------------------------------------------------------------

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
  cardHeadline: {
    ...typography.h3,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
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
