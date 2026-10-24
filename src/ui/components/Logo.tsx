import Svg, { Circle, Path } from 'react-native-svg';
import { useAppTheme } from '@/ui/theme';

/** App mark: a 3/4 progress ring with an amber marker. Same geometry as the launcher icon. */
export function Logo({ size = 72 }: { size?: number }) {
  const theme = useAppTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityLabel="StudyPace logo">
      <Circle cx={512} cy={512} r={250} fill="none" stroke={theme.colors.primary} strokeOpacity={0.18} strokeWidth={72} />
      <Path d="M512 262 A250 250 0 1 1 262 512" fill="none" stroke={theme.colors.primary} strokeWidth={72} strokeLinecap="round" />
      <Circle cx={262} cy={512} r={56} fill={theme.app.accent} />
    </Svg>
  );
}
