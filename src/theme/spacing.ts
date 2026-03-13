import { Platform, type ViewStyle } from "react-native";

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  smd: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const borderRadius = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  xxl: 34,
  full: 9999,
} as const;

const shadow = (elevation: number, y: number, blur: number, opacity: number): ViewStyle =>
  Platform.select({
    web: {
      boxShadow: `0px ${y}px ${blur}px rgba(0, 0, 0, ${opacity})`,
    },
    default: {
      shadowColor: "#7E4F36",
      shadowOffset: { width: 0, height: y },
      shadowOpacity: opacity,
      shadowRadius: blur,
      elevation,
    },
  }) ?? {};

export const shadows = {
  sm: shadow(1, 1, 6, 0.08),
  md: shadow(3, 8, 16, 0.12),
  lg: shadow(6, 14, 22, 0.16),
  hero: shadow(8, 18, 28, 0.18),
} as const;
