import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, shadows } from '../theme';
import { usePatientProgress } from '../hooks/useProgress';
import { safeFormat } from '../utils/dateHelpers';

export const HeroDashboard = () => {
  const router = useRouter();
  const { data: progress, isLoading } = usePatientProgress();

  if (isLoading || !progress) return null;

  const { summary, photos, symptoms } = progress;
  const latestPhoto = photos?.[0];
  const lastSymptom = symptoms?.[0];
  const prevSymptom = symptoms?.[1];

  const trend = (lastSymptom && prevSymptom) 
    ? (lastSymptom.severity < prevSymptom.severity ? 'improving' : 'stable')
    : 'stable';

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{Math.round(summary.adherence_rate * 100)}%</Text>
          <Text style={styles.statLabel}>Adherence</Text>
        </View>
        <View style={[styles.statBox, styles.centerStat]}>
          <MaterialIcons 
            name={trend === 'improving' ? "trending-down" : "trending-flat"} 
            size={24} 
            color={trend === 'improving' ? colors.success : colors.amber} 
          />
          <Text style={styles.statLabel}>{trend === 'improving' ? 'Improving' : 'Stable'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{summary.photo_count}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
      </View>

      <View style={styles.mainCard}>
        <View style={styles.latestPhotoContainer}>
          {latestPhoto ? (
            <Image source={{ uri: latestPhoto.url }} style={styles.latestPhoto} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialIcons name="add-a-photo" size={48} color={colors.borderLight} />
            </View>
          )}
          <View style={styles.photoOverlay}>
             <Text style={styles.photoDate}>
               {latestPhoto ? safeFormat(latestPhoto.timestamp, 'MMMM do, yyyy') : 'No photos yet'}
             </Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push('/(auth)/intake/symptom-log')}
          >
            <MaterialIcons name="report-problem" size={24} color={colors.primary} />
            <Text style={styles.actionText}>Symptom</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push('/(auth)/intake/camera')}
          >
            <MaterialIcons name="photo-camera" size={24} color={colors.primary} />
            <Text style={styles.actionText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push('/(auth)/(tabs)/routines')}
          >
            <MaterialIcons name="check-circle" size={24} color={colors.primary} />
            <Text style={styles.actionText}>Routines</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  centerStat: {
    marginHorizontal: spacing.sm,
    justifyContent: 'center',
    gap: 4,
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  mainCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    ...shadows.md,
  },
  latestPhotoContainer: {
    height: 240,
    backgroundColor: colors.borderLight,
    position: 'relative',
  },
  latestPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  photoDate: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    padding: spacing.md,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
