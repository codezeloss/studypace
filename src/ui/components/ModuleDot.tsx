import { View } from 'react-native';
import type { ModuleColor } from '@/domain/types';
import { useAppTheme } from '@/ui/theme';

/** Small colored circle that identifies a module across all screens. */
export function ModuleDot({ color, size = 10 }: { color: ModuleColor; size?: number }) {
  const theme = useAppTheme();
  return (
    <View
      accessible={false}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.app.modules[color] }}
    />
  );
}
