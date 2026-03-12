import React from "react";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import { WebHeaderBackground } from "../../../src/components/common/WebHeaderBackground";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackground: Platform.OS === "web" ? () => <WebHeaderBackground /> : undefined,
      }}
    >
      <Stack.Screen name="skin-brief" options={{ title: "Skin Brief" }} />
      <Stack.Screen name="preferences" options={{ title: "Preferences" }} />
      <Stack.Screen name="goal-journey" options={{ title: "Future-You Goal" }} />
    </Stack>
  );
}
