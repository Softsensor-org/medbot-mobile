import React from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "../../theme";
import { MetricChip } from "../common/MetricChip";

interface ProfileStatItem {
  label: string;
  value: string;
  tone?: "default" | "primary" | "success" | "warning" | "info";
}

interface ProfileStatsRowProps {
  items: ProfileStatItem[];
}

export function ProfileStatsRow({ items }: ProfileStatsRowProps) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <MetricChip
          key={`${item.label}-${item.value}`}
          label={item.label}
          value={item.value}
          tone={item.tone}
          style={styles.chip}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 108,
  },
});
