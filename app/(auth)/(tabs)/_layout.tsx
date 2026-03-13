import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet } from "react-native";
import { borderRadius, colors, spacing, typography } from "../../../src/theme";
import { useCapabilities } from "../../../src/hooks/useCapabilities";
import { WebHeaderBackground } from "../../../src/components/common/WebHeaderBackground";

export default function TabsLayout() {
  const { isLoading, isFeatureEnabled } = useCapabilities();
  const careTabEnabled = isLoading || isFeatureEnabled("medical_chat");
  const routinesTabEnabled = isLoading || isFeatureEnabled("routines");

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: true,
        headerBackground: Platform.OS === "web" ? () => <WebHeaderBackground /> : undefined,
        headerStyle: styles.header,
        headerShadowVisible: false,
        headerTintColor: colors.textPrimary,
        headerTitleStyle: styles.headerTitle,
        sceneStyle: styles.scene,
        tabBarStyle: Platform.OS === "web"
          ? {
              ...StyleSheet.flatten(styles.tabBar),
              boxShadow: "none",
            }
          : styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Daily",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: "Care",
          href: careTabEnabled ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: "Routines",
          href: routinesTabEnabled ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surfaceLight,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontFamily: typography.h3.fontFamily,
    fontSize: typography.h3.fontSize,
    fontWeight: "700",
  },
  scene: {
    backgroundColor: colors.background,
  },
  tabBar: {
    height: 76,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    position: "absolute",
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
  },
  tabBarItem: {
    borderRadius: borderRadius.lg,
  },
  tabBarLabel: {
    ...typography.caption,
    fontWeight: "700",
  },
});
