import { Platform, TextStyle } from "react-native";

const fontFamily = Platform.select({
  ios: "System",
  android: "Roboto",
  default: "System",
});

export const typography: Record<string, TextStyle> = {
  h1: { fontFamily, fontSize: 28, fontWeight: "700", lineHeight: 34 },
  h2: { fontFamily, fontSize: 24, fontWeight: "700", lineHeight: 30 },
  h3: { fontFamily, fontSize: 20, fontWeight: "600", lineHeight: 26 },
  body: { fontFamily, fontSize: 16, fontWeight: "400", lineHeight: 22 },
  bodySmall: { fontFamily, fontSize: 14, fontWeight: "400", lineHeight: 20 },
  caption: { fontFamily, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  button: { fontFamily, fontSize: 16, fontWeight: "600", lineHeight: 22 },
  label: { fontFamily, fontSize: 14, fontWeight: "500", lineHeight: 20 },
};
