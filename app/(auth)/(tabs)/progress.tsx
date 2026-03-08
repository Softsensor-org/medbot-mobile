import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ProgressBoard } from '../../../src/components/ProgressBoard';
import { TrajectoryBoard } from '../../../src/components/TrajectoryBoard';
import { colors, spacing } from '../../../src/theme';

export default function ProgressScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TrajectoryBoard />
      <ProgressBoard days={30} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
});
