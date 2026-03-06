import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../../../src/theme";
import { useSymptomTypes, useLogSymptom } from "../../../src/hooks/useSymptomLogging";
import { SymptomType, Symptom } from "../../../src/types/medical";
import { showToast } from "../../../src/providers/ToastProvider";

type SymptomLogPayload = Omit<Symptom, "id" | "created_at"> & { session_id?: string };

export default function SymptomLogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  const { data: symptomTypes, isLoading: isLoadingTypes } = useSymptomTypes();
  const { mutate: logSymptom, isPending: isSubmitting } = useLogSymptom();

  const [selectedType, setSelectedType] = useState<SymptomType | null>(null);
  const [severity, setSeverity] = useState<number>(3);
  const [notes, setNotes] = useState("");
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!selectedType) {
      showToast("error", "Error", "Please select a symptom type");
      return;
    }

    const payload: SymptomLogPayload = {
      symptom_type_id: selectedType.id,
      severity,
      description: selectedType.name,
      notes,
      occurred_at: new Date().toISOString(),
      // Link to session if we have one
      ...(sessionId ? { session_id: sessionId } : {}),
    };

    logSymptom(
      payload as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      {
        onSuccess: () => {
          showToast("success", "Success", "Symptom logged successfully");
          if (sessionId) {
            router.push({ pathname: "/(auth)/chat/[sessionId]", params: { sessionId } } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
          } else {
            router.back();
          }
        },
        onError: (error) => {
          showToast("error", "Error", "Failed to log symptom");
          console.error("Log symptom error:", error);
        },
      }
    );
  }, [selectedType, severity, notes, logSymptom, router, sessionId]);

  const renderTypeItem = ({ item }: { item: SymptomType }) => (
    <TouchableOpacity
      style={styles.typeItem}
      onPress={() => {
        setSelectedType(item);
        setIsTypeModalVisible(false);
      }}
    >
      <Text style={styles.typeItemName}>{item.name}</Text>
      <Text style={styles.typeItemDesc}>{item.description}</Text>
    </TouchableOpacity>
  );

  if (isLoadingTypes) {
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
          <MaterialIcons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Symptom</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>What symptom are you experiencing?</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setIsTypeModalVisible(true)}
        >
          <Text style={selectedType ? styles.selectorText : styles.placeholderText}>
            {selectedType ? selectedType.name : "Select symptom type..."}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.label}>How severe is it? (1-5)</Text>
        <View style={styles.severityContainer}>
          {[1, 2, 3, 4, 5].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.severityButton,
                severity === num && styles.severityButtonSelected,
              ]}
              onPress={() => setSeverity(num)}
            >
              <Text
                style={[
                  styles.severityButtonText,
                  severity === num && styles.severityButtonTextSelected,
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.severityLabels}>
          <Text style={styles.caption}>Mild</Text>
          <Text style={styles.caption}>Severe</Text>
        </View>

        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Add any additional details..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitButtonText}>Log Symptom</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isTypeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTypeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Symptom Type</Text>
              <TouchableOpacity onPress={() => setIsTypeModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={symptomTypes}
              renderItem={renderTypeItem}
              keyExtractor={(item) => item.id.toString()}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
  },
  selectorText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textDisabled,
  },
  severityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  severityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  severityButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  severityButtonText: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  severityButtonTextSelected: {
    color: colors.surface,
  },
  severityLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    height: 120,
    textAlignVertical: "top",
    ...typography.body,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  typeItem: {
    padding: spacing.md,
  },
  typeItemName: {
    ...typography.body,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  typeItemDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
});
