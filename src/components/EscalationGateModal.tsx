import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../theme";

export interface EscalationGateProps {
  visible: boolean;
  category?: string | null;
  guidance?: string | null;
  onAcknowledge: () => void;
}

const CATEGORY_CONFIG: Record<
  string,
  { title: string; icon: keyof typeof MaterialIcons.glyphMap; callLabel: string }
> = {
  life_threatening_derm: {
    title: "Urgent Medical Attention Needed",
    icon: "local-hospital",
    callLabel: "Call 911",
  },
  general_emergency: {
    title: "Seek Emergency Care",
    icon: "warning",
    callLabel: "Call 911",
  },
  mental_health_crisis: {
    title: "Crisis Support Available",
    icon: "support",
    callLabel: "Call 988",
  },
  red_flag_escalation: {
    title: "Clinical Review Required",
    icon: "medical-services",
    callLabel: "Call your doctor",
  },
};

const DEFAULT_CONFIG = {
  title: "Important Health Notice",
  icon: "warning" as keyof typeof MaterialIcons.glyphMap,
  callLabel: "Call 911",
};

function getPhoneNumber(category: string | null | undefined): string {
  if (category === "mental_health_crisis") return "988";
  return "911";
}

export default function EscalationGateModal({
  visible,
  category,
  guidance,
  onAcknowledge,
}: EscalationGateProps) {
  const config = (category && CATEGORY_CONFIG[category]) || DEFAULT_CONFIG;

  const handleCall = () => {
    const number = getPhoneNumber(category);
    const url = Platform.OS === "web" ? `tel:${number}` : `tel:${number}`;
    Linking.openURL(url).catch(() => {
      // Fallback: user sees the number in the button
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialIcons
              name={config.icon}
              size={48}
              color={colors.error}
            />
          </View>

          <Text style={styles.title}>{config.title}</Text>

          <Text style={styles.guidance}>
            {guidance ||
              "Based on your symptoms, we recommend seeking immediate medical attention. Your safety is our priority."}
          </Text>

          <TouchableOpacity
            testID="escalation-call-button"
            style={styles.callButton}
            onPress={handleCall}
            accessibilityRole="button"
            accessibilityLabel={config.callLabel}
          >
            <MaterialIcons name="phone" size={20} color={colors.surface} />
            <Text style={styles.callButtonText}>{config.callLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="escalation-acknowledge-button"
            style={styles.acknowledgeButton}
            onPress={onAcknowledge}
            accessibilityRole="button"
            accessibilityLabel="I understand"
          >
            <Text style={styles.acknowledgeButtonText}>
              I understand — continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.error,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  guidance: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    width: "100%",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  callButtonText: {
    ...typography.button,
    color: colors.surface,
    fontWeight: "700",
  },
  acknowledgeButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: "100%",
    alignItems: "center",
  },
  acknowledgeButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
});
