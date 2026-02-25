import React from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { AuthProvider } from "../src/auth/AuthProvider";
import { QueryProvider } from "../src/providers/QueryProvider";
import { ToastProvider } from "../src/providers/ToastProvider";
import { ErrorBoundary } from "../src/components/common/ErrorBoundary";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <QueryProvider>
              <ToastProvider>
                <StatusBar style="auto" />
                <Slot />
              </ToastProvider>
            </QueryProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
