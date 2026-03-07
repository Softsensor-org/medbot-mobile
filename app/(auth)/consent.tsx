import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import { colors, typography, spacing } from "../../src/theme";
import { useConsentTypes, useConsentStatus, useRecordConsent } from "../../src/hooks/useConsent";
import type { ConsentType, ConsentStatusItem } from "../../src/types/consent";

const CONSENT_SUMMARIES: Record<string, string> = {
  privacy_notice:
    "We explain how your health data is stored, who can access it, and your rights to control it.",
  telehealth_disclaimer:
    "This covers what our AI assistant can and cannot do, and when you should see a real doctor.",
  research_opt_in:
    "You can optionally allow anonymized data to help improve skin health research. This is not required.",
};

function getStatusForType(
  typeId: string,
  status: ReturnType<typeof useConsentStatus>["data"],
): ConsentStatusItem | undefined {
  if (!status) return undefined;
  const all = [
    ...status.pending_required,
    ...status.pending_optional,
    ...status.expired_consents,
    ...status.accepted_required,
    ...status.accepted_optional,
  ];
  return all.find((s) => s.consent_type_id === typeId);
}

function StatusBadge({ item }: { item?: ConsentStatusItem }) {
  if (!item) {
    return (
      <View style={[styles.badge, styles.badgePending]}>
        <Text style={styles.badgeText}>Pending</Text>
      </View>
    );
  }
  if (item.expired) {
    return (
      <View style={[styles.badge, styles.badgeExpired]}>
        <Text style={styles.badgeText}>Expired</Text>
      </View>
    );
  }
  if (!item.version_match && item.status === "accepted") {
    return (
      <View style={[styles.badge, styles.badgeExpired]}>
        <Text style={styles.badgeText}>Update needed</Text>
      </View>
    );
  }
  if (item.status === "accepted") {
    return (
      <View style={[styles.badge, styles.badgeAccepted]}>
        <Text style={styles.badgeText}>Accepted</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgePending]}>
      <Text style={styles.badgeText}>
        {item.status === "declined" ? "Declined" : "Pending"}
      </Text>
    </View>
  );
}

function ConsentCard({
  consentType,
  statusItem,
  onAccept,
  isRecording,
}: {
  consentType: ConsentType;
  statusItem?: ConsentStatusItem;
  onAccept: (typeId: string, version: string, signature?: string) => void;
  isRecording: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [signature, setSignature] = useState("");

  const needsAction =
    !statusItem ||
    statusItem.status !== "accepted" ||
    statusItem.expired ||
    !statusItem.version_match;

  const summary =
    CONSENT_SUMMARIES[consentType.id] || consentType.description;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        testID={`consent-card-${consentType.id}`}
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
      >
        <View style={styles.cardTitleRow}>
          <View style={styles.cardTitleLeft}>
            {consentType.type === "required" && (
              <Text style={styles.requiredTag}>Required</Text>
            )}
            <Text style={styles.cardTitle}>{consentType.title}</Text>
          </View>
          <View style={styles.cardTitleRight}>
            <StatusBadge item={statusItem} />
            <MaterialIcons
              name={expanded ? "expand-less" : "expand-more"}
              size={24}
              color={colors.textSecondary}
            />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.summaryContainer}>
        <MaterialIcons name="info-outline" size={16} color={colors.primary} />
        <Text style={styles.summaryText}>{summary}</Text>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Version {consentType.version}</Text>
          </View>

          <View style={styles.markdownContainer}>
            <Markdown style={markdownStyles}>
              {consentType.content_markdown || "_No content available._"}
            </Markdown>
          </View>

          {needsAction && (
            <View style={styles.actionContainer}>
              {consentType.requires_signature && (
                <View style={styles.signatureContainer}>
                  <Text style={styles.signatureLabel}>
                    Your signature (required)
                  </Text>
                  <TextInput
                    testID={`signature-input-${consentType.id}`}
                    style={styles.signatureInput}
                    placeholder="Type your full name"
                    value={signature}
                    onChangeText={setSignature}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <TouchableOpacity
                testID={`accept-button-${consentType.id}`}
                style={[
                  styles.acceptButton,
                  (isRecording ||
                    (consentType.requires_signature && !signature.trim())) &&
                    styles.acceptButtonDisabled,
                ]}
                disabled={
                  isRecording ||
                  (consentType.requires_signature && !signature.trim())
                }
                onPress={() =>
                  onAccept(
                    consentType.id,
                    consentType.version,
                    consentType.requires_signature
                      ? signature.trim()
                      : undefined,
                  )
                }
              >
                {isRecording ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.acceptButtonText}>
                    I agree to these terms
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function ConsentScreen() {
  const { data: types, isLoading: typesLoading } = useConsentTypes();
  const { data: status, isLoading: statusLoading } = useConsentStatus();
  const recordConsent = useRecordConsent();
  const [recordingId, setRecordingId] = useState<string | null>(null);

  const handleAccept = useCallback(
    async (typeId: string, version: string, signature?: string) => {
      setRecordingId(typeId);
      try {
        await recordConsent.mutateAsync({
          consent_type_id: typeId,
          status: "accepted",
          consent_version: version,
          signature,
          source: "mobile_app",
        });
      } finally {
        setRecordingId(null);
      }
    },
    [recordConsent],
  );

  const isLoading = typesLoading || statusLoading;
  const requiresAction = status?.requires_action ?? false;
  const activeTypes = types?.filter((t) => t.active) ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerSection}>
        <Text style={styles.title}>Your Privacy & Consent</Text>
        <Text style={styles.subtitle}>
          We believe in transparency. Review each item below to understand how
          your data is used and protected.
        </Text>

        {!isLoading && requiresAction && (
          <View style={styles.actionBanner}>
            <MaterialIcons name="warning" size={20} color={colors.amber} />
            <Text style={styles.actionBannerText}>
              Some required consents need your attention before data can be
              shared with your provider.
            </Text>
          </View>
        )}

        {!isLoading && !requiresAction && activeTypes.length > 0 && (
          <View style={styles.completeBanner}>
            <MaterialIcons name="check-circle" size={20} color={colors.success} />
            <Text style={styles.completeBannerText}>
              All required consents are up to date.
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {activeTypes.map((ct) => (
            <ConsentCard
              key={ct.id}
              consentType={ct}
              statusItem={getStatusForType(ct.id, status)}
              onAccept={handleAccept}
              isRecording={recordingId === ct.id}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  heading1: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heading2: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  heading3: {
    fontWeight: "600" as const,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  link: {
    color: colors.primary,
    textDecorationLine: "underline" as const,
  },
  list_item: {
    marginBottom: spacing.xs,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  actionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  actionBannerText: {
    ...typography.bodySmall,
    color: colors.amber,
    flex: 1,
  },
  completeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  completeBannerText: {
    ...typography.bodySmall,
    color: colors.success,
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: "center",
  },
  cardsContainer: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  cardHeader: {
    padding: spacing.lg,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitleLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardTitleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  requiredTag: {
    ...typography.caption,
    color: colors.error,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  summaryContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  summaryText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  versionRow: {
    marginBottom: spacing.sm,
  },
  versionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  markdownContainer: {
    marginBottom: spacing.md,
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  signatureContainer: {
    marginBottom: spacing.md,
  },
  signatureLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  signatureInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    backgroundColor: colors.surfaceVariant,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  acceptButtonText: {
    ...typography.button,
    color: colors.surface,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeAccepted: {
    backgroundColor: "#E8F5E9",
  },
  badgePending: {
    backgroundColor: "#FFF3E0",
  },
  badgeExpired: {
    backgroundColor: "#FFEBEE",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
