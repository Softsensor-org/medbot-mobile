import React from "react";
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="skin-brief" options={{ title: "Skin Brief" }} />
      <Stack.Screen name="preferences" options={{ title: "Preferences" }} />
    </Stack>
  );
}
