import { Platform, type ViewStyle } from "react-native";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

const shadow = (elevation: number, y: number, blur: number, opacity: number): ViewStyle =>
  Platform.select({
    web: {
      boxShadow: `0px ${y}px ${blur}px rgba(0, 0, 0, ${opacity})`,
    },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: y },
      shadowOpacity: opacity,
      shadowRadius: blur,
      elevation,
    },
  }) ?? {};

export const shadows = {
  sm: shadow(1, 1, 2, 0.05),
  md: shadow(3, 2, 4, 0.1),
  lg: shadow(6, 4, 8, 0.15),
} as const;
