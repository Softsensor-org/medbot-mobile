import { Platform, TextStyle } from "react-native";

const displayFamily = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia",
});

const bodyFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "System",
});

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: displayFamily,
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 44,
    letterSpacing: -1.1,
  },
  h1: {
    fontFamily: displayFamily,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    letterSpacing: -0.7,
  },
  h2: {
    fontFamily: displayFamily,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h3: {
    fontFamily: bodyFamily,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: bodyFamily,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: bodyFamily,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: bodyFamily,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 21,
  },
  caption: {
    fontFamily: bodyFamily,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  button: {
    fontFamily: bodyFamily,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  label: {
    fontFamily: bodyFamily,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 1.0,
  },
  eyebrow: {
    fontFamily: bodyFamily,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
};
