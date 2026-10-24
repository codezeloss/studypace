import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, useAppTheme } from '@/ui/theme';

interface Props {
  value: number | null;
  /** Called with the new rating, or null when the selected rating is tapped again. */
  onChange: (value: number | null) => void;
}

/** 1–5 focus self-assessment. Optional: tapping the selected value clears it. */
export function FocusRating({ value, onChange }: Props) {
  const theme = useAppTheme();
  return (
    <View>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Focus rating">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(selected ? null : n)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`Focus ${n} of 5`}
              hitSlop={4}
              style={[
                styles.option,
                {
                  borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
                  backgroundColor: selected ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              <Text variant="titleMedium" style={{ color: selected ? theme.colors.onPrimary : theme.colors.onSurface }}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.captions}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Distracted
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Deep focus
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  option: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  captions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
});
