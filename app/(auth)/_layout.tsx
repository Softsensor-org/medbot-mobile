import React from "react";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/auth/useAuth";
import { LoadingSpinner } from "../../src/components/common/LoadingSpinner";
import { SyncStatus } from "../../src/components/common/SyncStatus";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Redirect href="/sign-in" />;

  return (
    <>
      <SyncStatus />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[sessionId]" options={{ headerShown: true, title: "Chat" }} />
        <Stack.Screen name="intake" options={{ headerShown: true, title: "Intake" }} />
        <Stack.Screen name="consent" options={{ headerShown: true, title: "Consent", presentation: "modal" }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="weekly-reveal" options={{ headerShown: false, presentation: "fullScreenModal" }} />
        <Stack.Screen name="label-scan" options={{ headerShown: true, title: "Scan Product Label" }} />
      </Stack>
    </>
  );
}
