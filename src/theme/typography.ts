import { Platform, TextStyle } from "react-native";

const fontFamily = Platform.select({
  ios: "System",
  android: "Roboto",
  default: "System",
});

export const typography: Record<string, TextStyle> = {
  h1: { fontFamily, fontSize: 32, fontWeight: "800", lineHeight: 40, letterSpacing: -0.5 },
  h2: { fontFamily, fontSize: 24, fontWeight: "700", lineHeight: 32, letterSpacing: -0.3 },
  h3: { fontFamily, fontSize: 20, fontWeight: "600", lineHeight: 28 },
  body: { fontFamily, fontSize: 16, fontWeight: "400", lineHeight: 24 },
  bodySmall: { fontFamily, fontSize: 14, fontWeight: "400", lineHeight: 20 },
  caption: { fontFamily, fontSize: 12, fontWeight: "500", lineHeight: 16, letterSpacing: 0.2 },
  button: { fontFamily, fontSize: 16, fontWeight: "600", lineHeight: 24, letterSpacing: 0.1 },
  label: { fontFamily, fontSize: 14, fontWeight: "600", lineHeight: 20, textTransform: "uppercase", letterSpacing: 0.5 },
};
