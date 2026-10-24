import { useState } from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { formatDuration, formatShortDate, formatWeekRange } from '@/domain/format';
import type { WeekBucket } from '@/domain/progress';
import { fonts, useAppTheme } from '@/ui/theme';

interface Props {
  data: WeekBucket[];
  targetMin: number;
  color: string;
  height?: number;
}

const LABEL_HEIGHT = 20;
const TOP_PADDING = 22;

/**
 * Bar chart of study minutes per week. The weekly goal is drawn as a dashed
 * line; the current (last) week is fully opaque, earlier weeks are muted.
 * Screen readers get the values as one text summary.
 */
export function WeeklyBars({ data, targetMin, color, height = 168 }: Props) {
  const theme = useAppTheme();
  const [width, setWidth] = useState(0);

  const chartHeight = height - LABEL_HEIGHT - TOP_PADDING;
  const baseline = TOP_PADDING + chartHeight;
  const max = Math.max(targetMin, ...data.map((d) => d.minutes), 1);
  const slot = data.length > 0 ? width / data.length : 0;
  const barWidth = Math.min(28, slot * 0.5);
  const yFor = (minutes: number) => baseline - (minutes / max) * chartHeight;
  const targetY = yFor(targetMin);
  const summary = data.map((d) => `${formatWeekRange(d.weekStart)}: ${formatDuration(d.minutes)}`).join(', ');

  return (
    <View
      style={{ height }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`Weekly study time, goal ${formatDuration(targetMin)}. ${summary}`}
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          <Line x1={0} x2={width} y1={baseline} y2={baseline} stroke={theme.colors.outlineVariant} strokeWidth={1} />
          {data.map((d, i) => {
            const x = slot * i + (slot - barWidth) / 2;
            const top = yFor(d.minutes);
            const isCurrent = i === data.length - 1;
            return (
              <G key={d.weekStart.toISOString()}>
                <Rect
                  x={x}
                  y={top}
                  width={barWidth}
                  height={Math.max(0, baseline - top)}
                  rx={4}
                  fill={color}
                  opacity={isCurrent ? 1 : 0.5}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={height - 4}
                  fontSize={11}
                  fontFamily={fonts.regular}
                  fill={theme.colors.onSurfaceVariant}
                  textAnchor="middle"
                >
                  {formatShortDate(d.weekStart)}
                </SvgText>
              </G>
            );
          })}
          <Line
            x1={0}
            x2={width}
            y1={targetY}
            y2={targetY}
            stroke={theme.colors.onSurfaceVariant}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <SvgText
            x={width}
            y={targetY - 6}
            fontSize={11}
            fontFamily={fonts.mono}
            fill={theme.colors.onSurfaceVariant}
            textAnchor="end"
          >
            {`goal ${formatDuration(targetMin)}`}
          </SvgText>
        </Svg>
      )}
    </View>
  );
}
