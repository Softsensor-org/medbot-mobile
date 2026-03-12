import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useIsMutating, useIsFetching } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

export const SyncStatus: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const isMutating = useIsMutating();
  const isFetching = useIsFetching();
  const isSyncing = isMutating > 0 || isFetching > 0;

  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOffline || (isSyncing && isMutating > 0)) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [isOffline, isSyncing, isMutating]);

  if (!isOffline && !isSyncing) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={[
        styles.badge, 
        isOffline ? styles.offlineBadge : styles.syncingBadge
      ]}>
        <MaterialIcons 
          name={isOffline ? "cloud-off" : "sync"} 
          size={16} 
          color={colors.surface} 
          style={isSyncing && !isOffline ? styles.spin : undefined}
        />
        <Text style={styles.text}>
          {isOffline 
            ? "Offline Mode" 
            : isMutating > 0 
              ? `Syncing ${isMutating} action${isMutating > 1 ? 's' : ''}...` 
              : "Syncing..."
          }
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.xl * 2,
    alignSelf: 'center',
    zIndex: 1000,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    ...shadows.md,
  },
  offlineBadge: {
    backgroundColor: colors.textSecondary,
  },
  syncingBadge: {
    backgroundColor: colors.primary,
  },
  text: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '700',
  },
  spin: {
    // Note: React Native doesn't have CSS spin, usually handled via Animated
  }
});
