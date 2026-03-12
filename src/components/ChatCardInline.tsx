/**
 * IMP-242: Inline structured card rendered within the chat stream.
 *
 * Cards represent extracted structured data (symptoms, products, routines,
 * interventions) that the user can confirm, edit, or dismiss.
 */
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../theme";
import type { ChatCard } from "../types/ai";

const CARD_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  symptom: "local-hospital",
  product: "shopping-bag",
  routine: "event-repeat",
  intervention: "report-problem",
};

const CARD_ICON_COLORS: Record<string, string> = {
  symptom: colors.error,
  product: colors.info,
  routine: colors.success,
  intervention: colors.warning,
};

const CARD_BG_COLORS: Record<string, string> = {
  symptom: colors.errorLight,
  product: colors.infoLight,
  routine: colors.successLight,
  intervention: colors.warningLight,
};

const CARD_LABELS: Record<string, string> = {
  symptom: "Symptom Detected",
  product: "Product Identified",
  routine: "Routine Suggested",
  intervention: "Intervention Recommended",
};

interface ChatCardInlineProps {
  card: ChatCard;
  onConfirm?: (cardId: string) => void;
  onDismiss?: (cardId: string) => void;
  onUpdate?: (cardId: string, data: Record<string, unknown>) => void;
}

export default function ChatCardInline({
  card,
  onConfirm,
  onDismiss,
  onUpdate,
}: ChatCardInlineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({ ...card.data });
  const [actionTaken, setActionTaken] = useState<"confirmed" | "dismissed" | null>(null);

  if (actionTaken) {
    return (
      <View
        style={[
          styles.collapsedCard,
          {
            backgroundColor:
              actionTaken === "confirmed" ? colors.successLight : colors.surfaceVariant,
            borderColor: actionTaken === "confirmed" ? colors.success : colors.border,
          },
        ]}
      >
        <Text style={styles.collapsedText}>
          {CARD_LABELS[card.card_type] ?? "Card"}{" "}
          {actionTaken === "confirmed" ? "confirmed" : "dismissed"}
        </Text>
      </View>
    );
  }

  const dataEntries = Object.entries(card.data).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  const handleConfirm = () => {
    if (isEditing) {
      onUpdate?.(card.card_id, editData);
    } else {
      onConfirm?.(card.card_id);
    }
    setActionTaken("confirmed");
  };

  const handleDismiss = () => {
    onDismiss?.(card.card_id);
    setActionTaken("dismissed");
  };

  const bgColor = CARD_BG_COLORS[card.card_type] ?? colors.surfaceVariant;
  const iconName = CARD_ICONS[card.card_type] ?? "info";
  const iconColor = CARD_ICON_COLORS[card.card_type] ?? colors.textSecondary;

  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name={iconName} size={18} color={iconColor} />
        <Text style={styles.headerLabel}>
          {CARD_LABELS[card.card_type] ?? card.card_type}
        </Text>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            {Math.round(card.confidence * 100)}%
          </Text>
        </View>
      </View>

      {/* Data fields */}
      {isEditing ? (
        <View style={styles.editSection}>
          {card.editable_fields.map((field) => (
            <View key={field} style={styles.editRow}>
              <Text style={styles.fieldLabel}>{field.replace(/_/g, " ")}</Text>
              <TextInput
                style={styles.editInput}
                value={String(editData[field] ?? "")}
                onChangeText={(text) =>
                  setEditData((prev) => ({ ...prev, [field]: text }))
                }
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.dataSection}>
          {dataEntries.map(([key, value]) => (
            <View key={key} style={styles.dataRow}>
              <Text style={styles.fieldLabel}>{key.replace(/_/g, " ")}:</Text>
              <Text style={styles.fieldValue}>
                {Array.isArray(value) ? value.join(", ") : String(value)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleDismiss}>
          <Text style={styles.secondaryButtonText}>Dismiss</Text>
        </TouchableOpacity>
        {card.editable_fields.length > 0 && !isEditing && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.primaryButton} onPress={handleConfirm}>
          <Text style={styles.primaryButtonText}>
            {isEditing ? "Save" : "Confirm"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
  },
  collapsedCard: {
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1,
    opacity: 0.7,
    marginVertical: spacing.xs,
  },
  collapsedText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  headerLabel: {
    ...typography.subtitle,
    fontWeight: "600",
    marginLeft: spacing.xs,
    flex: 1,
  },
  confidenceBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  confidenceText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  dataSection: {
    marginBottom: spacing.sm,
  },
  dataRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  editSection: {
    marginBottom: spacing.sm,
  },
  editRow: {
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    minWidth: 80,
    textTransform: "capitalize",
  },
  fieldValue: {
    ...typography.body,
    flex: 1,
  },
  editInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    marginTop: 2,
    ...typography.body,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.xs,
  },
  secondaryButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  secondaryButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  primaryButtonText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: "600",
  },
});
