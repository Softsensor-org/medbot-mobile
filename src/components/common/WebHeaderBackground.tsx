import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../theme";

export function WebHeaderBackground() {
  return <View style={styles.background} />;
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    boxShadow: "none",
  },
});
