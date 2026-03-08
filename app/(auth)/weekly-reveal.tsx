import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { PremiumWeeklyReveal } from '../../src/components/PremiumWeeklyReveal';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme';

export default function WeeklyRevealScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="close" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Progress Reveal</Text>
        <View style={{ width: 28 }} />
      </View>
      <PremiumWeeklyReveal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: spacing.xs,
  },
  navTitle: {
    ...typography.label,
    fontSize: 16,
    color: colors.textSecondary,
  }
});
