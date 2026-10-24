/**
 * Visual design tokens: a calm "paper planner" Material 3 theme with ink-navy
 * primary, warm paper surfaces and an amber accent reserved for the streak and
 * the focus timer. Light and dark variants share the same shape.
 */
import { MD3DarkTheme, MD3LightTheme, configureFonts, useTheme } from 'react-native-paper';
import type { ModuleColor } from '@/domain/types';

/** Font family names as registered by `useFonts` in `src/app/_layout.tsx`. */
export const fonts = {
  regular: 'IBMPlexSans_400Regular',
  medium: 'IBMPlexSans_500Medium',
  semibold: 'IBMPlexSans_600SemiBold',
  mono: 'IBMPlexMono_500Medium',
} as const;

/** 8-point spacing scale. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Snackbar offset on screens with a FAB, so the message never covers the button (56 FAB + 2 × 16 margin). */
export const FAB_CLEARANCE = 88;

/** Corner radii. */
export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

const fontConfig = configureFonts({
  config: {
    displayLarge: { fontFamily: fonts.semibold },
    displayMedium: { fontFamily: fonts.semibold },
    displaySmall: { fontFamily: fonts.semibold },
    headlineLarge: { fontFamily: fonts.semibold },
    headlineMedium: { fontFamily: fonts.semibold },
    headlineSmall: { fontFamily: fonts.semibold },
    titleLarge: { fontFamily: fonts.semibold },
    titleMedium: { fontFamily: fonts.medium },
    titleSmall: { fontFamily: fonts.medium },
    labelLarge: { fontFamily: fonts.medium },
    labelMedium: { fontFamily: fonts.medium },
    labelSmall: { fontFamily: fonts.medium },
    bodyLarge: { fontFamily: fonts.regular },
    bodyMedium: { fontFamily: fonts.regular },
    bodySmall: { fontFamily: fonts.regular },
  },
});

const lightModules: Record<ModuleColor, string> = {
  ink: '#3E5C84', teal: '#2E7D74', cobalt: '#3253A8', olive: '#5F6E24',
  plum: '#7A4E7E', ochre: '#94661A', slate: '#56606B', rose: '#A84D66',
};

const darkModules: Record<ModuleColor, string> = {
  ink: '#8FAED6', teal: '#6FC2B7', cobalt: '#93A9EA', olive: '#B4C27A',
  plum: '#C79BCB', ochre: '#E0B160', slate: '#A5AFBA', rose: '#E39AAD',
};

/** Light theme; its type defines {@link AppTheme}. */
export const lightTheme = {
  ...MD3LightTheme,
  fonts: fontConfig,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1F3A5F',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D8E3F1',
    onPrimaryContainer: '#0D2240',
    secondary: '#56606B',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E3E6EA',
    onSecondaryContainer: '#1C2229',
    tertiary: '#8A5A12',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#F6E2BF',
    onTertiaryContainer: '#2C1A00',
    background: '#FAF8F4',
    onBackground: '#1B1C1E',
    surface: '#FAF8F4',
    onSurface: '#1B1C1E',
    surfaceVariant: '#ECE8E1',
    onSurfaceVariant: '#4A4D52',
    outline: '#7A7D82',
    outlineVariant: '#DCD7CF',
    error: '#B3412E',
    onError: '#FFFFFF',
    errorContainer: '#F8DDD6',
    onErrorContainer: '#410E05',
    inverseSurface: '#2F3033',
    inverseOnSurface: '#F2EFEA',
    inversePrimary: '#A9C4E6',
    elevation: {
      level0: 'transparent', level1: '#F3F0EA', level2: '#EEEAE3',
      level3: '#E9E5DD', level4: '#E7E3DB', level5: '#E4DFD6',
    },
  },
  /** App-specific tokens that Material 3 has no role for. */
  app: {
    accent: '#E0A030',
    success: '#2E7D74',
    behind: '#B5523B',
    track: '#E6E1D8',
    modules: lightModules,
  },
};

/** The theme type used across the app. */
export type AppTheme = typeof lightTheme;

/** Dark theme with the same token names. */
export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  fonts: fontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#A9C4E6',
    onPrimary: '#0E2540',
    primaryContainer: '#284A73',
    onPrimaryContainer: '#D8E3F1',
    secondary: '#BCC6D2',
    onSecondary: '#26303B',
    secondaryContainer: '#3C4652',
    onSecondaryContainer: '#DCE3EC',
    tertiary: '#E8B04A',
    onTertiary: '#3F2A00',
    tertiaryContainer: '#5C4300',
    onTertiaryContainer: '#F6E2BF',
    background: '#121417',
    onBackground: '#E4E2DE',
    surface: '#121417',
    onSurface: '#E4E2DE',
    surfaceVariant: '#2A2E33',
    onSurfaceVariant: '#B9BCC1',
    outline: '#8A8E94',
    outlineVariant: '#3A3E44',
    error: '#F2A391',
    onError: '#5C1A0D',
    errorContainer: '#7A2A1A',
    onErrorContainer: '#F8DDD6',
    inverseSurface: '#E4E2DE',
    inverseOnSurface: '#2F3033',
    inversePrimary: '#1F3A5F',
    elevation: {
      level0: 'transparent', level1: '#1A1D21', level2: '#1F2227',
      level3: '#24282D', level4: '#262A30', level5: '#292D33',
    },
  },
  app: {
    accent: '#E8B04A',
    success: '#6FC2B7',
    behind: '#E58D76',
    track: '#2A2E33',
    modules: darkModules,
  },
};

/** Typed access to the current theme including the `app` tokens. */
export const useAppTheme = () => useTheme<AppTheme>();
