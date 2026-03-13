import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { borderRadius, colors, shadows, spacing, typography } from "../../theme";
import { SoftCard } from "./SoftCard";

interface HeroSurfaceProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  media?: React.ReactNode;
  metrics?: React.ReactNode;
  actions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function HeroSurface({
  eyebrow,
  title,
  subtitle,
  media,
  metrics,
  actions,
  style,
  children,
}: HeroSurfaceProps) {
  return (
    <SoftCard padded={false} style={[styles.card, style]} tone="highlight">
      <View style={styles.glowPrimary} />
      <View style={styles.glowSecondary} />
      <View style={styles.inner}>
        <View style={styles.copy}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {metrics ? <View style={styles.metrics}>{metrics}</View> : null}
        {media ? <View style={styles.media}>{media}</View> : null}
        {children}
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
    </SoftCard>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    borderRadius: borderRadius.xxl,
    ...shadows.hero,
  },
  inner: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  glowPrimary: {
    position: "absolute",
    top: -48,
    right: -22,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: colors.glow,
  },
  glowSecondary: {
    position: "absolute",
    bottom: -56,
    left: -36,
    width: 140,
    height: 140,
    borderRadius: 140,
    backgroundColor: "rgba(90, 127, 161, 0.10)",
  },
  copy: {
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  media: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
