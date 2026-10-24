import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { spacing, useAppTheme } from '@/ui/theme';

interface Props {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Placeholder for empty lists: explains what belongs here and offers one clear action. */
export function EmptyState({ icon, title, body, actionLabel, onAction }: Props) {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialCommunityIcons name={icon} size={32} color={theme.colors.onSurfaceVariant} />
      </View>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
        {body}
      </Text>
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.action}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: spacing.lg, textAlign: 'center' },
  body: { marginTop: spacing.sm, textAlign: 'center', maxWidth: 300 },
  action: { marginTop: spacing.xl },
});
