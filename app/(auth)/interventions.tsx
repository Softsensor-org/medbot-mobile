import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { useInterventionLedger, useAddIntervention } from '../../src/hooks/useInterventions';
import { ChipSelect } from '../../src/components/common/ChipSelect';
import { showToast } from '../../src/providers/ToastProvider';
import { format, parseISO } from 'date-fns';

export default function InterventionLedgerScreen() {
  const _router = useRouter();
  const { data: ledger = [], isLoading } = useInterventionLedger();
  const addMutation = useAddIntervention();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<any>("medication");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = () => {
    if (!name) {
      showToast("error", "Error", "Name is required");
      return;
    }

    addMutation.mutate({
      name,
      type,
      dosage,
      frequency,
      notes,
    }, {
      onSuccess: () => {
        showToast("success", "Added", "Intervention added to ledger");
        setShowAddModal(false);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setName("");
    setType("medication");
    setDosage("");
    setFrequency("");
    setNotes("");
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const activeInterventions = ledger.filter(i => i.status === 'active');
  const discontinuedInterventions = ledger.filter(i => i.status === 'discontinued');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Active Interventions</Text>
        {activeInterventions.length === 0 ? (
          <Text style={styles.emptyText}>No active medications or supplements.</Text>
        ) : (
          activeInterventions.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.name}</Text>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                  <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>{item.type}</Text>
                </View>
              </View>
              <Text style={styles.cardDetail}>{item.dosage} • {item.frequency}</Text>
              {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
              <Text style={styles.cardDate}>Started: {format(parseISO(item.started_at!), 'PPP')}</Text>
            </View>
          ))
        )}

        {discontinuedInterventions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>History</Text>
            {discontinuedInterventions.map((item) => (
              <View key={item.id} style={[styles.card, styles.discontinuedCard]}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardDate}>Stopped: {format(parseISO(item.discontinued_at!), 'PPP')}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <MaterialIcons name="add" size={32} color={colors.surface} />
      </TouchableOpacity>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Intervention</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Spironolactone, Zinc" 
                value={name}
                onChangeText={setName}
              />

              <ChipSelect
                label="Type"
                options={[
                  { value: "medication", label: "Medication" },
                  { value: "supplement", label: "Supplement" },
                  { value: "nutrition", label: "Nutrition" },
                ]}
                selectedValue={type}
                onSelect={setType}
                horizontal={false}
              />

              <Text style={styles.label}>Dosage</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. 50mg" 
                value={dosage}
                onChangeText={setDosage}
              />

              <Text style={styles.label}>Frequency</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Once daily" 
                value={frequency}
                onChangeText={setFrequency}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Add any observations..." 
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity 
                style={[styles.submitBtn, addMutation.isPending && styles.disabled]} 
                onPress={handleAdd}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.submitBtnText}>Add to Ledger</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'medication': return colors.error;
    case 'supplement': return colors.primary;
    case 'nutrition': return colors.success;
    default: return colors.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  discontinuedCard: {
    opacity: 0.6,
    backgroundColor: colors.surfaceVariant,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  typeText: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardDetail: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  cardNotes: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardDate: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  form: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  submitBtnText: {
    ...typography.button,
    color: colors.surface,
  },
  disabled: {
    opacity: 0.7,
  },
});
