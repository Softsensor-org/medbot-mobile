import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  Text,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - spacing.lg * 2;
const SLIDER_HEIGHT = 300;

interface CompareSliderProps {
  beforeUri: string;
  afterUri: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  beforeUri,
  afterUri,
  beforeLabel = "Before",
  afterLabel = "After",
}) => {
  const translateX = useSharedValue(SLIDER_WIDTH / 2);
  const startX = useSharedValue(SLIDER_WIDTH / 2);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      'worklet';
      let nextX = startX.value + event.translationX;
      if (nextX < 0) nextX = 0;
      if (nextX > SLIDER_WIDTH) nextX = SLIDER_WIDTH;
      translateX.value = nextX;
    });

  const afterStyle = useAnimatedStyle(() => ({
    width: translateX.value,
  }));

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - 20 }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.sliderFrame}>
        {/* Before Image (Base) */}
        <Image source={{ uri: beforeUri }} style={styles.image} />
        <View style={styles.labelContainerBase}>
            <Text style={styles.label}>{beforeLabel}</Text>
        </View>

        {/* After Image (Overlay) */}
        <Animated.View style={[styles.afterOverlay, afterStyle]}>
          <Image source={{ uri: afterUri }} style={[styles.image, { width: SLIDER_WIDTH }]} />
          <View style={styles.labelContainerOverlay}>
            <Text style={styles.label}>{afterLabel}</Text>
          </View>
        </Animated.View>

        {/* Interaction Handle */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.handle, handleStyle]}>
            <View style={styles.handleLine} />
            <View style={styles.handleCircle}>
                <MaterialIcons name="unfold-more" size={20} color={colors.surface} style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    alignItems: 'center',
  },
  sliderFrame: {
    width: SLIDER_WIDTH,
    height: SLIDER_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.md,
  },
  image: {
    width: SLIDER_WIDTH,
    height: SLIDER_HEIGHT,
    resizeMode: 'cover',
  },
  afterOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: SLIDER_HEIGHT,
    overflow: 'hidden',
    borderRightWidth: 1,
    borderRightColor: colors.surface,
  },
  handle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  handleLine: {
    width: 3,
    flex: 1,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  handleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    ...shadows.md,
  },
  labelContainerBase: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  labelContainerOverlay: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  label: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
  }
});
