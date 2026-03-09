import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../src/theme';
import { useTimeline } from '../../src/hooks/useTimeline';
import { safeFormat } from '../../src/utils/dateHelpers';
import { usePatientProgress } from '../../src/hooks/useProgress';
import { CompareSlider } from '../../src/components/common/CompareSlider';

export default function TimelineScreen() {
  const router = useRouter();
  const { data: timeline, isLoading: isLoadingTimeline } = useTimeline();
  const { data: progress, isLoading: isLoadingProgress } = usePatientProgress();

  if (isLoadingTimeline || isLoadingProgress) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const events = timeline?.events || [];
  const photos = progress?.photos || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Journey</Text>
        <Text style={styles.subtitle}>Historical record of treatments and observations</Text>
      </View>

      {photos.length >= 2 && (
        <View style={styles.photoComparison}>
          <Text style={styles.sectionTitle}>Visual Progress</Text>
          <View style={styles.comparisonWrapper}>
            <CompareSlider
              beforeUri={photos[photos.length - 1].url}
              afterUri={photos[0].url}
              beforeLabel={safeFormat(photos[photos.length - 1].timestamp, 'MMM d')}
              afterLabel={safeFormat(photos[0].timestamp, 'MMM d')}
            />
          </View>
        </View>
      )}

      <View style={styles.eventList}>
        <Text style={styles.sectionTitle}>Activity Ledger</Text>
        {events.length === 0 ? (
          <Text style={styles.emptyText}>No events recorded yet.</Text>
        ) : (
          events.map((event: { id: string; type: string; timestamp: string; title: string; description: string }) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventIcon}>
                <MaterialIcons 
                  name={getEventIcon(event.type) as React.ComponentProps<typeof MaterialIcons>['name']} 
                  size={20} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {safeFormat(event.timestamp, 'MMM d, h:mm a')}
                  </Text>
                </View>
                <Text style={styles.eventDesc}>{event.description}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity 
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backBtnText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getEventIcon(type: string) {
  switch (type) {
    case 'symptom': return 'report-problem';
    case 'routine': return 'check-circle';
    case 'photo': return 'photo-camera';
    case 'intervention': return 'medical-services';
    default: return 'event';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  photoComparison: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  comparisonWrapper: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  eventList: {
    marginBottom: spacing.xl,
  },
  eventCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  eventTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  eventDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  backBtn: {
    alignItems: 'center',
    padding: spacing.md,
  },
  backBtnText: {
    ...typography.button,
    color: colors.primary,
  }
});
