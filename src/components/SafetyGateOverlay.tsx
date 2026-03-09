import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { SafetyStatus } from '../hooks/useSafetyGate';
import { useRouter } from 'expo-router';
import { validateDeepLink } from '../utils/deepLinkValidator';

interface SafetyGateOverlayProps {
  safety: SafetyStatus;
}

export const SafetyGateOverlay: React.FC<SafetyGateOverlayProps> = ({ safety }) => {
  const router = useRouter();

  const getIcon = () => {
    switch (safety.severity) {
      case 'high': return 'report-problem';
      case 'medium': return 'warning';
      default: return 'info';
    }
  };

  const getColor = () => {
    switch (safety.severity) {
      case 'high': return colors.error;
      case 'medium': return colors.amber;
      default: return colors.info;
    }
  };

  return (
    <View style={[styles.container, { borderColor: getColor() }]}>
      <View style={styles.header}>
        <MaterialIcons name={getIcon()} size={28} color={getColor()} />
        <Text style={[styles.title, { color: getColor() }]}>Safety Restriction</Text>
      </View>
      
      <Text style={styles.message}>{safety.message}</Text>

      <TouchableOpacity 
        style={[styles.ctaButton, { backgroundColor: getColor() }]}
        onPress={() => router.push(validateDeepLink(safety.cta.route))}
      >
        <Text style={styles.ctaText}>{safety.cta.label}</Text>
        <MaterialIcons name="arrow-forward" size={18} color={colors.surface} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    ...shadows.md,
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    fontWeight: '800',
  },
  message: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  ctaText: {
    ...typography.button,
    color: colors.surface,
  },
});
