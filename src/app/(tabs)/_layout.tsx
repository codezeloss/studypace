import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@/state/hooks';
import { fonts, useAppTheme } from '@/ui/theme';

/** Bottom navigation with the three main areas. Sends first-time users to onboarding. */
export default function TabsLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { data: onboarded, loading } = useQuery((r) => r.settings.get('onboarded'));

  if (loading) return null;
  if (onboarded !== 'true') return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        tabBarStyle: {
          backgroundColor: theme.colors.elevation.level2,
          borderTopWidth: 0,
          elevation: 0,
          height: 64 + insets.bottom,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'This week',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'view-dashboard' : 'view-dashboard-outline'} size={24} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          title: 'Modules',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'book-open-page-variant' : 'book-open-page-variant-outline'}
              size={24}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="history" size={24} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
