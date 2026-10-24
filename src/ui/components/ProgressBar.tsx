import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAppTheme } from '@/ui/theme';

interface Props {
  /** Progress from 0 to 1; values outside are clamped. */
  ratio: number;
  color?: string;
  height?: number;
  accessibilityLabel?: string;
}

/** Thin progress bar that animates its fill when the value changes. */
export function ProgressBar({ ratio, color, height = 6, accessibilityLabel }: Props) {
  const theme = useAppTheme();
  const clamped = Math.min(1, Math.max(0, ratio));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, [clamped, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: theme.app.track }]}
    >
      <Animated.View
        style={[styles.fill, { borderRadius: height / 2, backgroundColor: color ?? theme.colors.primary }, fillStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
