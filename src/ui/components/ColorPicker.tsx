import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';
import { MODULE_COLORS, type ModuleColor } from '@/domain/types';
import { useAppTheme } from '@/ui/theme';

const LABELS: Record<ModuleColor, string> = {
  ink: 'Ink blue', teal: 'Teal', cobalt: 'Cobalt', olive: 'Olive',
  plum: 'Plum', ochre: 'Ochre', slate: 'Slate', rose: 'Rose',
};

/** Swatch picker for the module color; each swatch is an accessible radio button. */
export function ColorPicker({ value, onChange }: { value: ModuleColor; onChange: (c: ModuleColor) => void }) {
  const theme = useAppTheme();
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Module color">
      {MODULE_COLORS.map((c) => {
        const selected = c === value;
        return (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={LABELS[c]}
            hitSlop={6}
            style={[
              styles.swatch,
              { backgroundColor: theme.app.modules[c], borderColor: selected ? theme.colors.onSurface : 'transparent' },
            ]}
          >
            {selected && <MaterialCommunityIcons name="check" size={18} color={theme.dark ? '#121417' : '#FFFFFF'} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
