import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, typography, spacing } from "../../../src/theme";
import EvidenceProgressBar from "../../../src/components/EvidenceProgressBar";
import { EvidenceSlot } from "../../../src/types/ai";

export default function ChatScreen() {
  const params = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  // Mock data for demonstration since full chat is not yet implemented
  const [mockEvidence] = useState<{
    slots: EvidenceSlot[];
    completeness: number;
    missing: string[];
  }>({
    slots: [
      { name: "location", state: "provided", value: "left arm" },
      { name: "duration", state: "pending" },
      { name: "severity", state: "unknown" },
    ],
    completeness: 0.33,
    missing: ["duration"],
  });

  if (!sessionId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Chat</Text>
        <Text style={styles.errorText}>Invalid session.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat</Text>
      <Text style={styles.sessionId}>Session: {sessionId}</Text>
      
      <ScrollView style={styles.chatArea}>
        <Text style={styles.placeholder}>
          Chat interface with streaming messages will be implemented here.
        </Text>

        <View style={styles.messageSpacer} />

        {/* Integration of EvidenceProgressBar */}
        <EvidenceProgressBar
          evidenceSlots={mockEvidence.slots}
          evidenceCompleteness={mockEvidence.completeness}
          missingEvidence={mockEvidence.missing}
          onPress={() => router.push("/(auth)/intake")}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sessionId: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  chatArea: {
    flex: 1,
  },
  placeholder: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  messageSpacer: {
    height: 20,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
});
