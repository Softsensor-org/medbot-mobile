import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../../../src/theme";
import { useConsentStatus, useConsentTypes, useRecordConsent } from "../../../src/hooks/useConsent";
import { useSharePacket, useEvidenceSnapshot } from "../../../src/hooks/useSessions";
import { colorFor } from "../../../src/status/statusHelpers";

export default function ReviewPacketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  
  const [step, setStep] = useState<'review' | 'consent'>('review');
  const [signature, setSignature] = useState("");
  const [acceptedRequired, setAcceptedRequired] = useState<Record<string, boolean>>({});

  const { data: snapshot, isLoading: isLoadingSnapshot } = useEvidenceSnapshot(sessionId || "");
  const { data: consentStatus, isLoading: isLoadingStatus } = useConsentStatus();
  const { data: consentTypes } = useConsentTypes();
  const sharePacket = useSharePacket();
  const recordConsent = useRecordConsent();

  const requiredPending = consentStatus?.pending_required || [];
  const needsConsentAction = requiredPending.length > 0;

  const handleShare = async () => {
    if (needsConsentAction) {
      setStep('consent');
      return;
    }
    if (!sessionId) return;
    try {
      await sharePacket.mutateAsync({ sessionId });
      Alert.alert("Success", "Clinical packet shared with your doctor.");
      router.back();
    } catch {
      Alert.alert("Error", "Failed to share packet.");
    }
  };

  const handleSubmitConsent = async () => {
    if (!sessionId) return;
    try {
      // Record all accepted required consents
      for (const item of requiredPending) {
        const typeInfo = consentTypes?.find(t => t.id === item.id);
        await recordConsent.mutateAsync({
          consent_type_id: item.id,
          status: 'accepted',
          consent_version: item.version,
          signature: typeInfo?.requires_signature ? signature : undefined,
          source: 'mobile'
        });
      }
      // After recording, try sharing
      await sharePacket.mutateAsync({ sessionId });
      Alert.alert("Success", "Consents accepted and packet shared.");
      router.back();
    } catch {
      Alert.alert("Error", "Failed to process consents or share packet.");
    }
  };

  const allRequiredChecked = requiredPending.every(p => acceptedRequired[p.id]);
  const signatureNeeded = requiredPending.some(p => 
    consentTypes?.find(t => t.id === p.id)?.requires_signature
  );
  const canSubmitConsent = allRequiredChecked && (!signatureNeeded || signature.trim().length > 2);

  if (isLoadingSnapshot || isLoadingStatus) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (step === 'consent') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('review')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Required Consents</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.description}>
            To share data with your provider, you must review and accept the following required terms.
          </Text>

          {requiredPending.map((item) => {
            const typeInfo = consentTypes?.find(t => t.id === item.id);
            const isChecked = !!acceptedRequired[item.id];
            
            return (
              <View key={item.id} style={styles.consentItem}>
                <Text style={styles.consentTitle}>{item.title}</Text>
                <View style={styles.markdownContainer}>
                  <Text style={styles.markdownText}>{typeInfo?.content_markdown || "Terms content loading..."}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.checkboxContainer}
                  onPress={() => setAcceptedRequired(prev => ({ ...prev, [item.id]: !isChecked }))}
                >
                  <Ionicons 
                    name={isChecked ? "checkbox" : "square-outline"} 
                    size={24} 
                    color={isChecked ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={styles.checkboxLabel}>I have read and accept the {item.title}</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {signatureNeeded && (
            <View style={styles.signatureContainer}>
              <Text style={styles.consentTitle}>Digital Signature</Text>
              <TextInput
                style={styles.signatureInput}
                placeholder="Type your full legal name"
                value={signature}
                onChangeText={setSignature}
                autoCapitalize="words"
              />
              <Text style={styles.caption}>
                By typing your name, you are providing a digital signature.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, !canSubmitConsent && styles.buttonDisabled]} 
            onPress={handleSubmitConsent}
            disabled={!canSubmitConsent || recordConsent.isPending || sharePacket.isPending}
          >
            {recordConsent.isPending || sharePacket.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Accept & Share</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Review Packet</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>
          Sharing this summary with your doctor will provide them with a structured overview of your symptoms and concerns.
        </Text>

        {snapshot ? (
          <View style={styles.snapshotCard}>
            <View style={styles.chipRow}>
              <View style={[styles.chip, { backgroundColor: colorFor(snapshot.triage_label || undefined) }]}>
                <Text style={styles.chipText}>{(snapshot.triage_label || 'Review').replace('_', ' ')}</Text>
              </View>
              <View style={[styles.chip, styles.chipOutline]}>
                <Text style={styles.chipTextOutline}>Evidence: {Math.round(snapshot.evidence_completeness * 100)}%</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Key Details to be Shared:</Text>
            {snapshot.slots.filter(s => s.state === 'provided').map(slot => (
              <Text key={slot.name} style={styles.slotItem}>
                • <Text style={styles.bold}>{slot.name.replace('_', ' ')}:</Text> {slot.value}
              </Text>
            ))}

            {snapshot.red_flags.length > 0 && (
              <View style={styles.redFlagsContainer}>
                <Text style={[styles.sectionTitle, { color: colors.error }]}>Safety Risks Identified:</Text>
                {snapshot.red_flags.map(flag => (
                  <Text key={flag} style={[styles.slotItem, { color: colors.error }]}>
                    • {flag}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.snapshotCard}>
            <Text style={styles.description}>No active clinical session found.</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Your data is immutable once shared. This helps your doctor maintain accurate clinical records.
          </Text>
        </View>

        {needsConsentAction && (
          <View style={[styles.infoBox, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
            <Ionicons name="warning-outline" size={20} color="#C2410C" />
            <Text style={[styles.infoText, { color: '#C2410C' }]}>
              You have {requiredPending.length} required consent(s) to review before you can share this packet.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleShare}
          disabled={sharePacket.isPending || !sessionId}
        >
          {sharePacket.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {needsConsentAction ? "Review Consents" : "Share with Doctor"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  snapshotCard: {
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginRight: spacing.xs,
  },
  chipText: {
    ...typography.caption,
    color: 'white',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chipOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipTextOutline: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.label,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  slotItem: {
    ...typography.bodySmall,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  redFlagsContainer: {
    marginTop: spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.primary,
    flex: 1,
    marginLeft: spacing.xs,
  },
  consentItem: {
    marginBottom: spacing.lg,
  },
  consentTitle: {
    ...typography.label,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  markdownContainer: {
    maxHeight: 200,
    padding: spacing.sm,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  markdownText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    ...typography.bodySmall,
    marginLeft: spacing.sm,
    color: colors.textPrimary,
  },
  signatureContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  signatureInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    backgroundColor: 'white',
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    ...typography.button,
    color: 'white',
  },
});
