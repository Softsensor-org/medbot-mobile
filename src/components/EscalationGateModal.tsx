import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../theme";

export interface EscalationGateProps {
  visible: boolean;
  category?: string | null;
  guidance?: string | null;
  onAcknowledge: () => void;
}

interface EscalationContactConfig {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  callLabel: string;
  phoneNumber: string | null;
  fallbackMessage: string;
}

const CATEGORY_CONFIG: Record<
  string,
  EscalationContactConfig
> = {
  life_threatening_derm: {
    title: "Urgent Medical Attention Needed",
    icon: "local-hospital",
    callLabel: "Call 911",
    phoneNumber: "911",
    fallbackMessage: "Unable to open your phone app. Please dial 911 manually.",
  },
  general_emergency: {
    title: "Seek Emergency Care",
    icon: "warning",
    callLabel: "Call 911",
    phoneNumber: "911",
    fallbackMessage: "Unable to open your phone app. Please dial 911 manually.",
  },
  mental_health_crisis: {
    title: "Crisis Support Available",
    icon: "support",
    callLabel: "Call 988",
    phoneNumber: "988",
    fallbackMessage: "Unable to open your phone app. Please dial 988 manually.",
  },
  red_flag_escalation: {
    title: "Clinical Review Required",
    icon: "medical-services",
    callLabel: "Call your doctor",
    phoneNumber: null,
    fallbackMessage:
      "Please call your doctor using the clinic or care-team number you already have on file.",
  },
};

const DEFAULT_CONFIG: EscalationContactConfig = {
  title: "Important Health Notice",
  icon: "warning" as keyof typeof MaterialIcons.glyphMap,
  callLabel: "Call 911",
  phoneNumber: "911",
  fallbackMessage: "Unable to open your phone app. Please dial 911 manually.",
};

export default function EscalationGateModal({
  visible,
  category,
  guidance,
  onAcknowledge,
}: EscalationGateProps) {
  const config = (category && CATEGORY_CONFIG[category]) || DEFAULT_CONFIG;
  const [callFallback, setCallFallback] = React.useState<string | null>(null);

  const handleCall = async () => {
    setCallFallback(null);

    if (!config.phoneNumber) {
      setCallFallback(config.fallbackMessage);
      return;
    }

    const url = `tel:${config.phoneNumber}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        setCallFallback(config.fallbackMessage);
        return;
      }
      await Linking.openURL(url);
    } catch {
      setCallFallback(config.fallbackMessage);
    }
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

          {callFallback ? (
            <Text
              testID="escalation-call-fallback"
              accessibilityRole="alert"
              style={styles.callFallback}
            >
              {callFallback}
            </Text>
          ) : null}

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
  callFallback: {
    ...typography.body,
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.md,
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
