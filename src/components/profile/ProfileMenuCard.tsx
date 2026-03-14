import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "../../theme";
import { SoftCard } from "../common/SoftCard";

interface ProfileMenuCardProps {
  eyebrow?: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  testID?: string;
}

export function ProfileMenuCard({
  eyebrow,
  title,
  description,
  icon,
  onPress,
  testID,
}: ProfileMenuCardProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" testID={testID}>
      {({ pressed }) => (
        <SoftCard style={[styles.card, pressed && styles.pressed]} padded={false}>
          <View style={styles.inner}>
            <View style={styles.iconWrap}>
              <MaterialIcons name={icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.copy}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </View>
        </SoftCard>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.94,
  },
  inner: {
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
