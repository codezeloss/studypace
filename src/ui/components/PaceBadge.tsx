import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { PaceStatus } from '@/domain/types';
import { useAppTheme } from '@/ui/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const META: Record<PaceStatus, { icon: IconName; label: string }> = {
  done: { icon: 'check-circle-outline', label: 'Goal reached' },
  onTrack: { icon: 'progress-check', label: 'On track' },
  behind: { icon: 'alert-circle-outline', label: 'Behind pace' },
};

/** Pace status as icon + text in the status color, so it never relies on color alone. */
export function PaceBadge({ status }: { status: PaceStatus }) {
  const theme = useAppTheme();
  const color = status === 'behind' ? theme.app.behind : theme.app.success;
  const { icon, label } = META[status];
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text variant="labelMedium" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
