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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { useTimeline } from '../../src/hooks/useTimeline';
import { safeFormat } from '../../src/utils/dateHelpers';
import { usePatientProgress } from '../../src/hooks/useProgress';
import { CompareSlider } from '../../src/components/common/CompareSlider';

export default function TimelineScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const { data: timeline, isLoading: isLoadingTimeline } = useTimeline();
  const { data: progress, isLoading: isLoadingProgress } = usePatientProgress();

  if (isLoadingTimeline || isLoadingProgress) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const events = timeline?.events || [];
  const photos = progress?.photos || [];
  const selectedDate = typeof date === 'string' ? date : undefined;
  const selectedDateKey = selectedDate?.slice(0, 10);
  const filteredEvents = selectedDateKey
    ? events.filter((event) => event.timestamp.slice(0, 10) === selectedDateKey)
    : events;
  const filteredPhotos = selectedDateKey
    ? photos.filter((photo) => photo.timestamp.slice(0, 10) === selectedDateKey)
    : photos;
  const subtitle = selectedDateKey
    ? `Focused on ${safeFormat(selectedDate, 'MMMM d, yyyy')}`
    : 'Historical record of treatments and observations';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Journey</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {filteredPhotos.length >= 2 && (
        <View style={styles.photoComparison}>
          <Text style={styles.sectionTitle}>Visual Progress</Text>
          <View style={styles.comparisonWrapper}>
            <CompareSlider
              beforeUri={filteredPhotos[filteredPhotos.length - 1].url}
              afterUri={filteredPhotos[0].url}
              beforeLabel={safeFormat(filteredPhotos[filteredPhotos.length - 1].timestamp, 'MMM d')}
              afterLabel={safeFormat(filteredPhotos[0].timestamp, 'MMM d')}
            />
          </View>
        </View>
      )}

      <View style={styles.eventList}>
        <Text style={styles.sectionTitle}>Activity Ledger</Text>
        {filteredEvents.length === 0 ? (
          <Text style={styles.emptyText}>
            {selectedDateKey
              ? `No events recorded for ${safeFormat(selectedDate, 'MMMM d, yyyy')}.`
              : 'No events recorded yet.'}
          </Text>
        ) : (
          filteredEvents.map((event: { id: string; type: string; timestamp: string; title: string; description: string }) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={[styles.eventIcon, { backgroundColor: getEventIconColor(event.type) + '1A' }]}>
                <MaterialIcons
                  name={getEventIcon(event.type) as React.ComponentProps<typeof MaterialIcons>['name']}
                  size={16}
                  color={getEventIconColor(event.type)}
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

function getEventIconColor(type: string) {
  switch (type) {
    case 'symptom': return colors.warning;
    case 'routine': return colors.success;
    case 'photo': return colors.info;
    case 'intervention': return colors.error;
    default: return colors.primary;
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
    ...typography.label,
    color: colors.secondary,
    marginBottom: spacing.md,
  },
  comparisonWrapper: {
    height: 300,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary + '20',
    ...shadows.md,
  },
  eventList: {
    marginBottom: spacing.xl,
  },
  eventCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  eventIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
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
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
  },
  backBtnText: {
    ...typography.button,
    color: colors.primary,
  }
});
