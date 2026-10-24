import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { useAppTheme } from '@/ui/theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Optional leading element, e.g. a module color dot. Replaced by a check mark while selected. */
  icon?: () => ReactNode;
  accessibilityLabel?: string;
}

/**
 * Selectable chip for single-choice rows (module, duration, filters).
 * Selection is shown three ways — tinted background, stronger outline and a
 * check mark — so it never depends on color alone.
 */
export function SelectChip({ label, selected, onPress, icon, accessibilityLabel }: Props) {
  const theme = useAppTheme();
  return (
    <Chip
      mode="outlined"
      selected={selected}
      showSelectedCheck
      icon={selected ? undefined : icon}
      onPress={onPress}
      // Chips are 32 dp tall; 8 dp slop on each side gives the 48 dp touch target Android requires.
      hitSlop={8}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primaryContainer : 'transparent',
          borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
        },
      ]}
      textStyle={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}
    >
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1 },
});
