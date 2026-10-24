import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, Surface, Text } from 'react-native-paper';
import { formatClock, formatDuration, formatPercent, formatWeekRange } from '@/domain/format';
import { weekProgress } from '@/domain/progress';
import { currentStreak } from '@/domain/streak';
import { elapsedMs } from '@/domain/timer';
import { isoWeekNumber, startOfWeek } from '@/domain/week';
import { useNow, useQuery } from '@/state/hooks';
import { EmptyState } from '@/ui/components/EmptyState';
import { ModuleRow } from '@/ui/components/ModuleRow';
import { Num } from '@/ui/components/Num';
import { PaceBadge } from '@/ui/components/PaceBadge';
import { ProgressRing } from '@/ui/components/ProgressRing';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { TabScreen } from '@/ui/components/TabScreen';
import { SnackbarHost } from '@/ui/SnackbarProvider';
import { radius, spacing, useAppTheme } from '@/ui/theme';

/** Home screen: this week's combined goal, streak, quick actions and progress per module. */
export default function DashboardScreen() {
  const theme = useAppTheme();
  const { data } = useQuery(async (r) => {
    const [modules, sessions, timer] = await Promise.all([r.modules.list(), r.sessions.list(), r.timer.get()]);
    return { modules, sessions, timer };
  });
  const running = !!data?.timer && data.timer.pausedAt === null;
  // Tick every second only while a timer runs, so the shortcut button shows live time.
  const now = useNow(running ? 1000 : 60_000);
  const overline = `Week ${isoWeekNumber(now)} · ${formatWeekRange(startOfWeek(now))}`;

  let content;
  if (!data) {
    content = null;
  } else if (data.modules.length === 0) {
    content = (
      <EmptyState
        icon="book-plus-outline"
        title="Set up your first module"
        body="StudyPace tracks your study time per module against a weekly goal you choose."
        actionLabel="Add module"
        onAction={() => router.push('/module/new')}
      />
    );
  } else {
    const progress = weekProgress(data.modules, data.sessions, now);
    const streak = currentStreak(data.sessions, now);
    const timer = data.timer;
    const timerModule = timer ? data.modules.find((m) => m.id === timer.moduleId) : undefined;
    content = (
      <>
        <Surface mode="flat" elevation={0} style={[styles.hero, { backgroundColor: theme.colors.elevation.level1 }]}>
          <ProgressRing
            ratio={progress.ratio}
            size={112}
            strokeWidth={10}
            accessibilityLabel={`${formatPercent(progress.ratio)} of your weekly goal`}
          >
            <Num variant="titleLarge">{formatPercent(progress.ratio)}</Num>
          </ProgressRing>
          <View style={styles.heroText}>
            <Num variant="headlineSmall">{formatDuration(progress.loggedMin)}</Num>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {`of ${formatDuration(progress.targetMin)} goal`}
            </Text>
            <View style={styles.heroMeta}>
              <PaceBadge status={progress.pace} />
              <View style={styles.streak}>
                <MaterialCommunityIcons name="calendar-check-outline" size={16} color={theme.app.accent} />
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {streak > 0 ? `${streak}-day streak` : 'Start a streak today'}
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        <View style={styles.actions}>
          <Button
            mode="contained"
            icon={timer ? (timer.pausedAt ? 'pause' : 'timer-sand') : 'timer-outline'}
            contentStyle={styles.buttonContent}
            onPress={() => router.push('/timer')}
          >
            {timer
              ? `${timer.pausedAt ? 'Paused' : 'Focusing'} · ${timerModule?.code ?? ''} · ${formatClock(elapsedMs(timer, now))}`
              : 'Start focus session'}
          </Button>
          <Button mode="text" icon="pencil-plus-outline" onPress={() => router.push('/session/new')}>
            Log a past session
          </Button>
        </View>

        <SectionHeader title="Modules" />
        {progress.modules.map((p, i) => (
          <View key={p.module.id}>
            {i > 0 && <Divider style={styles.divider} />}
            <ModuleRow progress={p} onPress={() => router.push(`/module/${p.module.id}`)} />
          </View>
        ))}
      </>
    );
  }

  return (
    <View style={styles.flex}>
      <TabScreen title="This week" overline={overline}>
        {content}
      </TabScreen>
      <SnackbarHost />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
  },
  heroText: { flex: 1, gap: 2 },
  heroMeta: { marginTop: spacing.sm, gap: spacing.xs },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.xs },
  buttonContent: { height: 52 },
  divider: { marginLeft: spacing.lg },
});
