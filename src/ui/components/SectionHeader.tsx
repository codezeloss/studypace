import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, useAppTheme } from '@/ui/theme';

/** Section title with an optional element on the right (e.g. a total or a text button). */
export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={styles.row}>
      <Text variant="titleSmall" accessibilityRole="header" style={{ color: theme.colors.onSurfaceVariant }}>
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    minHeight: 48,
  },
});
