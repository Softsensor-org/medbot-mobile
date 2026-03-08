import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, parseISO, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { useTimeline, TimelineEvent } from '../../src/hooks/useTimeline';
import { usePatientProgress } from '../../src/hooks/useProgress';
import { ProgressPhoto } from '../../src/api/analyticsApi';
import { CompareSlider } from '../../src/components/common/CompareSlider';

const { width } = Dimensions.get('window');

export default function TimelineScreen() {
  const router = useRouter();
  const { data: timelineData, isLoading: isLoadingTimeline } = useTimeline(100);
  const { data: progressData, isLoading: isLoadingProgress } = usePatientProgress(90);

  const [viewingPhoto, setViewingPhoto] = useState<ProgressPhoto | null>(null);

  const groupedEvents = useMemo(() => {
    const events: any[] = timelineData?.events ? [...timelineData.events] : [];

    // Add photos if not present
    if (progressData?.photos) {
      progressData.photos.forEach(photo => {
        if (!events.find(e => e.type === 'photo' && e.id === photo.id)) {
          events.push({
            id: photo.id,
            type: 'photo',
            timestamp: photo.timestamp,
            title: 'Progress Photo',
            url: photo.url,
          });
        }
      });
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Group by week
    const groups: { weekLabel: string; events: any[]; photos: any[] }[] = [];
    events.forEach(event => {
      const date = parseISO(event.timestamp);
      const weekStart = startOfWeek(date);
      const weekLabel = `Week of ${format(weekStart, 'MMM dd')}`;
      
      let group = groups.find(g => g.weekLabel === weekLabel);
      if (!group) {
        group = { weekLabel, events: [], photos: [] };
        groups.push(group);
      }
      
      if (event.type === 'photo') {
        group.photos.push(event);
      } else {
        group.events.push(event);
      }
    });

    return groups;
  }, [timelineData, progressData]);

  const renderEvent = (item: any) => {
    const date = parseISO(item.timestamp);
    return (
      <View key={item.id} style={styles.eventRow}>
        <View style={[styles.dot, { backgroundColor: getEventColor(item.type) }]} />
        <View style={styles.eventBody}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventTime}>{format(date, 'p')}</Text>
          </View>
          {item.description ? <Text style={styles.eventDesc}>{item.description}</Text> : null}
          {item.type === 'symptom' && (
            <View style={[styles.badge, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.badgeText, { color: colors.error }]}>Severity {item.metadata?.severity}/5</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderGroup = ({ item }: { item: any }) => {
    // For each week, if we have at least 2 photos, show a comparison slider
    const showSlider = item.photos.length >= 2;
    
    return (
      <View style={styles.weekGroup}>
        <View style={styles.weekHeader}>
            <Text style={styles.weekLabel}>{item.weekLabel}</Text>
            <View style={styles.weekLine} />
        </View>

        {showSlider && (
            <View style={styles.sliderContainer}>
                <Text style={styles.sliderHint}>Swipe to compare progress</Text>
                <CompareSlider 
                    beforeUri={item.photos[item.photos.length - 1].url} 
                    afterUri={item.photos[0].url} 
                    beforeLabel={format(parseISO(item.photos[item.photos.length - 1].timestamp), 'MMM dd')}
                    afterLabel={format(parseISO(item.photos[0].timestamp), 'MMM dd')}
                />
            </View>
        )}

        <View style={styles.eventsList}>
            {item.events.map(renderEvent)}
            {/* If not in slider, show photos as individual items */}
            {!showSlider && item.photos.map((p: any) => (
                <TouchableOpacity key={p.id} onPress={() => setViewingPhoto(p)}>
                    <Image source={{ uri: p.url }} style={styles.smallPhoto} />
                </TouchableOpacity>
            ))}
        </View>
      </View>
    );
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'symptom': return colors.error;
      case 'routine': return colors.teal;
      case 'intervention': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  if (isLoadingTimeline || isLoadingProgress) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Visual Timeline</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={groupedEvents}
        renderItem={renderGroup}
        keyExtractor={(item) => item.weekLabel}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No history recorded yet.</Text>}
      />

      {/* Photo Overlay */}
      <Modal visible={viewingPhoto !== null} transparent animationType="fade">
        <View style={styles.photoOverlay}>
            <TouchableOpacity 
                style={styles.closeOverlay}
                onPress={() => setViewingPhoto(null)}
            >
                <MaterialIcons name="close" size={32} color={colors.surface} />
            </TouchableOpacity>
            {viewingPhoto && (
                <View style={styles.overlayContent}>
                    <Image source={{ uri: viewingPhoto.url }} style={styles.overlayImage} resizeMode="contain" />
                    <Text style={styles.overlayDate}>
                        {format(parseISO(viewingPhoto.timestamp), 'PPP p')}
                    </Text>
                </View>
            )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.md,
  },
  weekGroup: {
    marginBottom: spacing.xl,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  weekLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  weekLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  sliderContainer: {
    marginBottom: spacing.lg,
  },
  sliderHint: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  eventsList: {
    paddingLeft: spacing.sm,
  },
  eventRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: spacing.md,
  },
  eventBody: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  eventTime: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  eventDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  smallPhoto: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xxl,
  },
  photoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeOverlay: {
    position: 'absolute',
    top: spacing.xl * 2,
    right: spacing.lg,
    zIndex: 10,
  },
  overlayContent: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayImage: {
    width: '90%',
    height: '80%',
  },
  overlayDate: {
    ...typography.body,
    color: colors.surface,
    marginTop: spacing.xl,
  },
});
