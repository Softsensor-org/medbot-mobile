import React from "react";
import { Redirect, Stack, usePathname } from "expo-router";
import { Platform } from "react-native";
import { useAuth } from "../../src/auth/useAuth";
import { useConsentStatus } from "../../src/hooks/useConsent";
import { LoadingSpinner } from "../../src/components/common/LoadingSpinner";
import { SyncStatus } from "../../src/components/common/SyncStatus";
import { WebHeaderBackground } from "../../src/components/common/WebHeaderBackground";

const webHeaderOptions =
  Platform.OS === "web"
    ? {
        headerBackground: () => <WebHeaderBackground />,
      }
    : undefined;

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const { data: consentStatus, isLoading: isConsentLoading } = useConsentStatus();
  const isDataSharingRoute =
    pathname.includes("/chat/") ||
    pathname.includes("/intake/symptom-log") ||
    pathname.includes("/intake/camera");

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Redirect href="/sign-in" />;
  if (isDataSharingRoute && isConsentLoading) return <LoadingSpinner />;
  if (isDataSharingRoute && consentStatus?.requires_action) {
    return <Redirect href="/(auth)/consent" />;
  }

  return (
    <>
      <SyncStatus />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[sessionId]" options={{ headerShown: true, title: "Chat", ...webHeaderOptions }} />
        <Stack.Screen name="intake" options={{ headerShown: true, title: "Intake", ...webHeaderOptions }} />
        <Stack.Screen name="consent" options={{ headerShown: true, title: "Consent", presentation: "modal", ...webHeaderOptions }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings", ...webHeaderOptions }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="weekly-reveal" options={{ headerShown: false, presentation: "fullScreenModal" }} />
        <Stack.Screen name="label-scan" options={{ headerShown: true, title: "Scan Product Label" }} />
      </Stack>
    </>
  );
}
