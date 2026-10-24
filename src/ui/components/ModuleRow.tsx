import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { formatDuration } from '@/domain/format';
import type { ModuleWeekProgress } from '@/domain/progress';
import { spacing, useAppTheme } from '@/ui/theme';
import { ModuleDot } from './ModuleDot';
import { Num } from './Num';
import { PaceBadge } from './PaceBadge';
import { ProgressBar } from './ProgressBar';

/** One module with this week's logged time vs. goal, its pace and a progress bar. */
export function ModuleRow({ progress, onPress }: { progress: ModuleWeekProgress; onPress: () => void }) {
  const theme = useAppTheme();
  const { module, loggedMin, targetMin, ratio, pace } = progress;
  return (
    <TouchableRipple
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${module.name}, ${formatDuration(loggedMin)} of ${formatDuration(targetMin)} this week`}
    >
      <View style={styles.container}>
        <View style={styles.line}>
          <ModuleDot color={module.color} />
          <Text variant="titleMedium" numberOfLines={1} style={styles.name}>
            {module.name}
          </Text>
          <Num variant="bodyMedium">{formatDuration(loggedMin)}</Num>
          <Num variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {` / ${formatDuration(targetMin)}`}
          </Num>
        </View>
        <View style={styles.line}>
          <Text variant="bodySmall" style={[styles.code, { color: theme.colors.onSurfaceVariant }]}>
            {module.code}
          </Text>
          <PaceBadge status={pace} />
        </View>
        <ProgressBar ratio={ratio} color={theme.app.modules[module.color]} />
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1 },
  code: { flex: 1, marginLeft: 18 },
});
