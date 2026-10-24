import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@/state/hooks';
import { Logo } from '@/ui/components/Logo';
import { spacing, useAppTheme } from '@/ui/theme';

const POINTS: { icon: ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; body: string }[] = [
  {
    icon: 'target',
    title: 'Set a weekly goal per module',
    body: 'Choose the hours yourself, or let StudyPace work them out from the ECTS and your exam date.',
  },
  {
    icon: 'timer-outline',
    title: 'Track every session',
    body: 'Use the focus timer while you study, or log a session you did away from your phone.',
  },
  {
    icon: 'chart-bar',
    title: 'Know if you are on pace',
    body: 'See your week at a glance, keep a daily streak and check how much is left before the exam.',
  },
];

/** First-launch introduction. Marks onboarding as done and optionally opens the module form. */
export default function OnboardingScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const mutate = useMutation();

  async function finish(addModule: boolean) {
    await mutate((r) => r.settings.set('onboarded', 'true'));
    router.replace('/');
    if (addModule) router.push('/module/new');
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Logo size={72} />
      <Text variant="headlineMedium" style={styles.title}>
        Study at a steady pace
      </Text>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        StudyPace helps you spread your study hours over the term, module by module.
      </Text>
      <View style={styles.points}>
        {POINTS.map((p) => (
          <View key={p.title} style={styles.point}>
            <MaterialCommunityIcons name={p.icon} size={24} color={theme.colors.primary} />
            <View style={styles.pointText}>
              <Text variant="titleMedium">{p.title}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {p.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        <Button mode="contained" onPress={() => finish(true)} contentStyle={styles.buttonContent}>
          Add my first module
        </Button>
        <Button mode="text" onPress={() => finish(false)} contentStyle={styles.buttonContent}>
          Look around first
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.xl },
  title: { marginTop: spacing.xl, marginBottom: spacing.sm },
  points: { marginTop: spacing.xxl, gap: spacing.xl },
  point: { flexDirection: 'row', gap: spacing.lg },
  pointText: { flex: 1, gap: 2 },
  actions: { marginTop: 'auto', paddingTop: spacing.xxl, gap: spacing.sm },
  buttonContent: { height: 48 },
});
