import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { formatDayTime, formatDuration } from '@/domain/format';
import type { Session, StudyModule } from '@/domain/types';
import { spacing, useAppTheme } from '@/ui/theme';
import { Num } from './Num';

interface Props {
  session: Session;
  module: StudyModule | undefined;
  onPress: () => void;
  onLongPress?: () => void;
}

/**
 * One logged session: module, start time, duration, focus rating and note.
 *
 * `onLongPress` runs only after the finger is lifted. Deleting the row while
 * its own touch was still active left React Native's touch handling in a state
 * where the following "Undo" tap was lost (found on the emulator), so the
 * long-press only gives haptic feedback and the action waits for press-out.
 */
export function SessionRow({ session, module, onPress, onLongPress }: Props) {
  const theme = useAppTheme();
  const longPressed = useRef(false);
  const start = new Date(session.startedAt);
  const color = module ? theme.app.modules[module.color] : theme.colors.outline;
  return (
    <TouchableRipple
      onPress={onPress}
      onLongPress={
        onLongPress
          ? () => {
              longPressed.current = true;
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          : undefined
      }
      onPressOut={() => {
        if (!longPressed.current) return;
        longPressed.current = false;
        requestAnimationFrame(() => onLongPress?.());
      }}
      accessibilityRole="button"
      accessibilityLabel={`${module?.code ?? 'Deleted module'}, ${formatDayTime(start)}, ${formatDuration(session.durationMin)}`}
      accessibilityHint={onLongPress ? 'Long press to delete' : undefined}
    >
      <View style={styles.container}>
        <View style={[styles.stripe, { backgroundColor: color }]} />
        <View style={styles.main}>
          <Text variant="titleSmall">{module?.code ?? 'Deleted module'}</Text>
          <View style={styles.meta}>
            {session.source === 'timer' && (
              <MaterialCommunityIcons name="timer-outline" size={14} color={theme.colors.onSurfaceVariant} />
            )}
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatDayTime(start)}
            </Text>
          </View>
          {session.note && (
            <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
              {session.note}
            </Text>
          )}
        </View>
        <View style={styles.right}>
          <Num variant="titleSmall">{formatDuration(session.durationMin)}</Num>
          {session.focusRating !== null && (
            <View style={styles.dots} accessibilityLabel={`Focus ${session.focusRating} of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <View
                  key={n}
                  style={[
                    styles.dot,
                    { backgroundColor: n <= (session.focusRating ?? 0) ? theme.colors.primary : theme.app.track },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md, minHeight: 64 },
  stripe: { width: 4, borderRadius: 2 },
  main: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  right: { alignItems: 'flex-end', justifyContent: 'center', gap: 6 },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
