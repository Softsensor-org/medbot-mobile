import React from "react";
import Toast from "react-native-toast-message";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toast />
    </>
  );
}

/** Show a toast notification. */
export function showToast(type: "success" | "error" | "info", text1: string, text2?: string) {
  Toast.show({ type, text1, text2, visibilityTime: 4000 });
}
