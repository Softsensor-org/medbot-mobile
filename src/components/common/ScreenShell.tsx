import React from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { colors, spacing, typography } from "../../theme";

interface ScreenShellProps {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ScreenShell({
  title,
  subtitle,
  headerRight,
  children,
  contentContainerStyle,
  testID,
}: ScreenShellProps) {
  return (
    <View style={styles.shell} testID={testID}>
      <View style={styles.backdropTop} />
      <View style={styles.backdropBottom} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {title || subtitle || headerRight ? (
          <View style={styles.header}>
            <View style={styles.copy}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  backdropTop: {
    position: "absolute",
    top: -120,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: colors.glow,
  },
  backdropBottom: {
    position: "absolute",
    bottom: -80,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(90, 127, 161, 0.08)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  headerRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
