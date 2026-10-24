import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '@/ui/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  /** Progress from 0 to 1; values outside are clamped. */
  ratio: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  /** Content centered inside the ring, e.g. a percentage. */
  children?: ReactNode;
  accessibilityLabel?: string;
}

/**
 * Circular progress indicator drawn with SVG. The arc length is animated via
 * `strokeDashoffset` on the UI thread (Reanimated), so it stays smooth.
 */
export function ProgressRing({ ratio, size = 120, strokeWidth = 10, color, children, accessibilityLabel }: Props) {
  const theme = useAppTheme();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, ratio));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [clamped, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
    // Hide the round line cap at 0 %, otherwise a dot would show.
    strokeOpacity: progress.value > 0.001 ? 1 : 0,
  }));

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.app.track} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? theme.colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
