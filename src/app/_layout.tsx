import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { migrate } from '@/data/db';
import { DataProvider } from '@/state/DataProvider';
import { EmptyState } from '@/ui/components/EmptyState';
import { registerDateLocale } from '@/ui/dates';
import { SnackbarProvider } from '@/ui/SnackbarProvider';
import { darkTheme, fonts, lightTheme } from '@/ui/theme';

registerDateLocale();
void SplashScreen.preventAutoHideAsync();

/**
 * Root of the app: loads fonts, opens and migrates the database, applies the
 * light or dark theme and declares every stack screen with its header.
 */
export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_500Medium,
  });
  const [dbError, setDbError] = useState<Error | null>(null);
  const [dbAttempt, setDbAttempt] = useState(0);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const baseNav = theme.dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...baseNav,
    colors: {
      ...baseNav.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
      notification: theme.colors.error,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <ThemeProvider value={navTheme}>
          <StatusBar style={theme.dark ? 'light' : 'dark'} />
          {dbError ? (
            <EmptyState
              icon="database-alert-outline"
              title="Your data could not be opened"
              body={dbError.message}
              actionLabel="Try again"
              onAction={() => {
                setDbError(null);
                setDbAttempt((n) => n + 1);
              }}
            />
          ) : (
            <SQLiteProvider key={dbAttempt} databaseName="studypace.db" onInit={migrate} onError={setDbError}>
              <SnackbarProvider>
                <DataProvider>
                  <Stack
                    screenOptions={{
                      headerShadowVisible: false,
                      headerStyle: { backgroundColor: theme.colors.background },
                      headerTintColor: theme.colors.onSurface,
                      headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 18 },
                      contentStyle: { backgroundColor: theme.colors.background },
                      animation: 'slide_from_right',
                    }}
                  >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
                    <Stack.Screen name="module/new" options={{ title: 'New module' }} />
                    <Stack.Screen name="module/[id]/index" options={{ title: '' }} />
                    <Stack.Screen name="module/[id]/edit" options={{ title: 'Edit module' }} />
                    <Stack.Screen name="session/new" options={{ title: 'Log session' }} />
                    <Stack.Screen name="session/[id]" options={{ title: 'Edit session' }} />
                    <Stack.Screen name="timer" options={{ title: 'Focus', animation: 'slide_from_bottom' }} />
                  </Stack>
                </DataProvider>
              </SnackbarProvider>
            </SQLiteProvider>
          )}
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
