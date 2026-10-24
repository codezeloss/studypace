import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useAppTheme } from '@/ui/theme';

interface HeaderProps {
  title: string;
  overline?: string;
  subtitle?: string;
}

/** Large in-content title used by the tab screens (they have no navigation header). */
export function TabHeader({ title, overline, subtitle }: HeaderProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.header}>
      {overline && (
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {overline}
        </Text>
      )}
      <Text variant="headlineMedium" accessibilityRole="header">
        {title}
      </Text>
      {subtitle && (
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

/** Scrollable tab screen with safe-area padding, a large title and room for a FAB at the bottom. */
export function TabScreen({ children, ...header }: HeaderProps & { children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 96 }}
    >
      <TabHeader {...header} />
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  subtitle: { marginTop: spacing.xs },
});
