import React from "react";
import { Stack } from "expo-router";

export default function IntakeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Start Session" }} />
      <Stack.Screen name="symptom-log" options={{ title: "Log Symptom" }} />
      <Stack.Screen name="pre-visit" options={{ title: "Pre-Visit Check-In" }} />
    </Stack>
  );
}
