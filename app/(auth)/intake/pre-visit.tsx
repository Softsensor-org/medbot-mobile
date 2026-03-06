import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../../../src/theme";
import {
  useAppointmentContext,
  useSetAppointmentContext,
  usePrevisitQuestions,
  useSubmitPrevisitAnswer,
  usePrevisitReadiness,
} from "../../../src/hooks/useWellness";
import { AppointmentType, PreVisitQuestion } from "../../../src/types/medical";
import { showToast } from "../../../src/providers/ToastProvider";

export default function PreVisitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  const { data: apptContext, isLoading: isLoadingAppt } = useAppointmentContext(sessionId || "");
  const { mutate: setApptContext, isPending: isSettingAppt } = useSetAppointmentContext();
  const { data: readiness, isLoading: isLoadingReadiness } = usePrevisitReadiness(sessionId || "");
  
  const appointmentType = apptContext?.appointment_type;
  const { data: questions, isLoading: isLoadingQuestions } = usePrevisitQuestions(appointmentType || "");
  const { mutate: submitAnswer } = useSubmitPrevisitAnswer();

  const [step, setStep] = useState<1 | 2>(appointmentType ? 2 : 1);
  const [selectedApptType, setSelectedApptType] = useState<AppointmentType | null>(appointmentType || null);
  const [apptDate, setApptDate] = useState(apptContext?.appointment_datetime || "");
  const [apptLocation, setApptLocation] = useState(apptContext?.clinic_location || "");

  // Simple local state for answers
  const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({});

  const handleSetAppt = useCallback(() => {
    if (!sessionId || !selectedApptType || !apptDate) {
      showToast("error", "Error", "Please fill in all appointment details");
      return;
    }

    setApptContext(
      {
        sessionId,
        appointment: {
          appointment_type: selectedApptType,
          appointment_datetime: apptDate,
          clinic_location: apptLocation,
        },
      },
      {
        onSuccess: () => {
          setStep(2);
          showToast("success", "Success", "Appointment context updated");
        },
      }
    );
  }, [sessionId, selectedApptType, apptDate, apptLocation, setApptContext]);

  const handleAnswerSubmit = useCallback((questionId: number) => {
    const answer = localAnswers[questionId];
    if (!answer || !sessionId) return;

    submitAnswer({
      sessionId,
      questionId,
      answer,
    }, {
      onSuccess: () => {
        showToast("success", "Saved", "Answer submitted");
      }
    });
  }, [sessionId, localAnswers, submitAnswer]);

  const renderQuestion = ({ item }: { item: PreVisitQuestion }) => {
    const isAnswered = readiness?.answers_provided.includes(item.id);
    return (
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>
          {item.text}
          {item.required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <TextInput
          style={styles.answerInput}
          placeholder="Your answer..."
          value={localAnswers[item.id] !== undefined ? localAnswers[item.id] : ""}
          onChangeText={(text) => setLocalAnswers(prev => ({ ...prev, [item.id]: text }))}
          onBlur={() => handleAnswerSubmit(item.id)}
        />
        {isAnswered && (
          <View style={styles.answeredBadge}>
            <MaterialIcons name="check-circle" size={16} color={colors.success} />
            <Text style={styles.answeredText}>Saved</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoadingAppt || isLoadingReadiness) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pre-Visit Check-In</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 1 ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          
          <Text style={styles.label}>Type of Appointment</Text>
          <View style={styles.typeContainer}>
            {(["clinic", "telemed", "urgent_care"] as AppointmentType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeButton,
                  selectedApptType === t && styles.typeButtonSelected,
                ]}
                onPress={() => setSelectedApptType(t)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    selectedApptType === t && styles.typeButtonTextSelected,
                  ]}
                >
                  {t.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Date & Time (YYYY-MM-DD HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={apptDate}
            onChangeText={setApptDate}
            placeholder="e.g. 2026-03-15 10:30"
          />

          <Text style={styles.label}>Location / Clinic Name</Text>
          <TextInput
            style={styles.input}
            value={apptLocation}
            onChangeText={setApptLocation}
            placeholder="e.g. Downtown Skin Clinic"
          />

          <TouchableOpacity
            style={[styles.primaryButton, isSettingAppt && styles.buttonDisabled]}
            onPress={handleSetAppt}
            disabled={isSettingAppt}
          >
            {isSettingAppt ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonText}>Next</Text>}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.flex1}>
          <View style={styles.readinessBanner}>
            <View style={styles.readinessTextContainer}>
              <Text style={styles.readinessTitle}>Readiness Score</Text>
              <Text style={styles.readinessValue}>{Math.round((readiness?.readiness_pct || 0) * 100)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(readiness?.readiness_pct || 0) * 100}%` }]} />
            </View>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.editApptLink}>
              <Text style={styles.editApptText}>Edit appointment details</Text>
            </TouchableOpacity>
          </View>

          {isLoadingQuestions ? (
            <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />
          ) : (
            <FlatList
              data={questions}
              renderItem={renderQuestion}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No specific questions for this appointment type.</Text>
              }
            />
          )}

          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Finish Check-In</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  iconButton: {
    padding: spacing.xs,
  },
  scrollContent: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  typeButtonTextSelected: {
    color: colors.surface,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  buttonText: {
    ...typography.button,
    color: colors.surface,
  },
  readinessBanner: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  readinessTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  readinessTitle: {
    ...typography.label,
    color: colors.textSecondary,
  },
  readinessValue: {
    ...typography.h3,
    color: colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  editApptLink: {
    marginTop: spacing.sm,
  },
  editApptText: {
    ...typography.caption,
    color: colors.primary,
    textDecorationLine: "underline",
  },
  listContent: {
    padding: spacing.md,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  questionText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  requiredStar: {
    color: colors.error,
  },
  answerInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
    ...typography.body,
  },
  answeredBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  answeredText: {
    ...typography.caption,
    color: colors.success,
    marginLeft: 4,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  finishButton: {
    backgroundColor: colors.success,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
});
