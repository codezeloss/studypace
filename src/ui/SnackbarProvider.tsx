import { useIsFocused } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, useAppTheme } from '@/ui/theme';

/** What a snackbar shows; `onAction` powers "Undo". */
export interface SnackbarOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Long enough to read the message and react to "Undo" (Material recommends 4–10 s). */
const DURATION_MS = 6000;

type Current = SnackbarOptions & { id: number };

const ShowContext = createContext<(options: SnackbarOptions) => void>(() => {});
const StateContext = createContext<{ current: Current | null; dismiss: () => void }>({
  current: null,
  dismiss: () => {},
});

/**
 * Holds the app-wide snackbar state so any screen can show a message, even
 * right before navigating back. The bar itself is drawn by {@link SnackbarHost}
 * inside the screens (see there for why).
 */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  // `id` restarts the auto-dismiss timer when a new message replaces the current one.
  const [current, setCurrent] = useState<Current | null>(null);
  const show = useCallback((options: SnackbarOptions) => setCurrent({ ...options, id: Date.now() }), []);
  const dismiss = useCallback(() => setCurrent(null), []);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setCurrent(null), DURATION_MS);
    return () => clearTimeout(timer);
  }, [current]);

  const state = useMemo(() => ({ current, dismiss }), [current, dismiss]);
  return (
    <ShowContext.Provider value={show}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ShowContext.Provider>
  );
}

/** Returns a function that shows a snackbar message. */
export const useSnackbar = () => useContext(ShowContext);

/**
 * Draws the current snackbar on the focused screen. Every screen that can show
 * feedback renders one host as its last child.
 *
 * Why inside the screens: on Android with the new architecture, views rendered
 * next to the navigator (outside the native screen containers) were drawn on
 * top but never received touches, so "Undo" could not be pressed. A Pressable
 * inside the screen receives touches reliably (verified on the emulator).
 *
 * @param bottom distance from the bottom edge of the screen content.
 * @param safeArea add the system navigation bar inset (stack screens reach the screen edge; tab screens end above the tab bar).
 */
export function SnackbarHost({ bottom = spacing.lg, safeArea = false }: { bottom?: number; safeArea?: boolean }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { current, dismiss } = useContext(StateContext);
  if (!current || !focused) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: bottom + (safeArea ? insets.bottom : 0) }]}>
      <View accessibilityLiveRegion="polite" style={[styles.bar, { backgroundColor: theme.colors.inverseSurface }]}>
        <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.inverseOnSurface }]}>
          {current.message}
        </Text>
        {current.actionLabel && (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            style={styles.action}
            onPress={() => {
              const action = current.onAction;
              dismiss();
              action?.();
            }}
          >
            <Text variant="labelLarge" style={{ color: theme.colors.inversePrimary }}>
              {current.actionLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: spacing.sm, right: spacing.sm },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radius.sm,
    elevation: 6,
  },
  message: { flex: 1, paddingVertical: spacing.md },
  action: { minHeight: 48, minWidth: 64, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
});
