import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressBoard } from '../../../src/components/ProgressBoard';
import { colors } from '../../../src/theme';

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <ProgressBoard days={30} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
