import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';
import { usePatientProgress } from '../hooks/useProgress';
import { format, parseISO } from 'date-fns';
import { SymptomTrendPoint, AdherenceTrendPoint, ProgressPhoto } from '../api/analyticsApi';

interface ProgressBoardProps {
  days?: number;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

export const ProgressBoard: React.FC<ProgressBoardProps> = ({ days = 30 }) => {
  const { data, isLoading, isError, refetch } = usePatientProgress(days);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator testID="loading-indicator" size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Failed to load progress data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { summary, symptoms, adherence, photos } = data;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Summary Cards */}
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <MaterialIcons name="analytics" size={24} color={colors.primary} />
          <Text testID="adherence-value" style={styles.statValue}>{Math.round(summary.adherence_rate * 100)}%</Text>
          <Text style={styles.statLabel}>Adherence</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="bug-report" size={24} color={colors.warning} />
          <Text testID="symptom-value" style={styles.statValue}>{summary.symptom_count}</Text>
          <Text style={styles.statLabel}>Symptom Logs</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="photo-library" size={24} color={colors.success} />
          <Text testID="photo-value" style={styles.statValue}>{summary.photo_count}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="event-note" size={24} color={colors.secondary} />
          <Text testID="routine-value" style={styles.statValue}>{summary.active_routines}</Text>
          <Text style={styles.statLabel}>Active Routines</Text>
        </View>
      </View>

      {/* Symptom Severity Trend (Simple Bar Chart) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Symptom Severity</Text>
        {symptoms.length > 0 ? (
          <View style={styles.chartContainer}>
            <View style={styles.chartArea}>
              {symptoms.map((point: SymptomTrendPoint, index: number) => (
                <View key={index} style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { height: (point.severity / 5) * 100 },
                      point.severity >= 4 ? { backgroundColor: colors.error } :
                      point.severity >= 3 ? { backgroundColor: colors.warning } :
                      { backgroundColor: colors.primaryLight }
                    ]} 
                  />
                  <Text style={styles.barLabel}>{format(parseISO(point.date), 'MM/dd')}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>No symptoms logged in this period.</Text>
        )}
      </View>

      {/* Adherence Trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Routine Adherence</Text>
        {adherence.length > 0 ? (
          <View style={styles.chartContainer}>
            <View style={styles.chartArea}>
              {adherence.map((point: AdherenceTrendPoint, index: number) => (
                <View key={index} style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { height: point.rate * 100, backgroundColor: colors.success }
                    ]} 
                  />
                  <Text style={styles.barLabel}>{format(parseISO(point.date), 'MM/dd')}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>No routine activity logged.</Text>
        )}
      </View>

      {/* Photo Gallery */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progress Photos</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
            {photos.map((photo: ProgressPhoto) => (
              <View key={photo.id} style={styles.photoWrapper}>
                <Image source={{ uri: photo.url }} style={styles.photo} />
                <Text style={styles.photoDate}>{format(parseISO(photo.timestamp), 'MMM dd')}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>No photos captured yet.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    height: 180,
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 12,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  photoList: {
    flexDirection: 'row',
  },
  photoWrapper: {
    marginRight: spacing.md,
    alignItems: 'center',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  photoDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  viewAll: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.surface,
    fontWeight: '600',
  },
});
