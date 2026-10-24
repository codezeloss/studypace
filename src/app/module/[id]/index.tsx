import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, IconButton, Menu, Surface, Text } from 'react-native-paper';
import { formatDuration, formatLongDate } from '@/domain/format';
import { suggestWeeklyTarget, weeksUntilExam, workloadMinutes } from '@/domain/pace';
import { moduleWeekProgress, totalMinutes, weeklyHistory } from '@/domain/progress';
import type { StudyModule } from '@/domain/types';
import { parseDayKey } from '@/domain/week';
import { useMutation, useNow, useQuery } from '@/state/hooks';
import { ConfirmDialog } from '@/ui/components/ConfirmDialog';
import { EmptyState } from '@/ui/components/EmptyState';
import { Num } from '@/ui/components/Num';
import { PaceBadge } from '@/ui/components/PaceBadge';
import { ProgressBar } from '@/ui/components/ProgressBar';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { SessionRow } from '@/ui/components/SessionRow';
import { WeeklyBars } from '@/ui/components/WeeklyBars';
import { SnackbarHost } from '@/ui/SnackbarProvider';
import { radius, spacing, useAppTheme } from '@/ui/theme';

const RECENT_SESSIONS = 10;

/** "5 ECTS · Exam 12 Feb 2027 · 16 weeks left" */
function metaLine(module: StudyModule, now: Date): string {
  const examDate = module.examDate ? parseDayKey(module.examDate) : null;
  const weeksLeft = weeksUntilExam(module.examDate, now);
  const parts = [`${module.ects} ECTS`, examDate ? `Exam ${formatLongDate(examDate)}` : 'No exam date'];
  if (weeksLeft !== null) parts.push(weeksLeft === 0 ? 'exam week' : `${weeksLeft} ${weeksLeft === 1 ? 'week' : 'weeks'} left`);
  return parts.join(' · ');
}

/**
 * Everything about one module: this week's goal, overall workload progress,
 * a 6-week chart, a pace-based goal suggestion and the latest sessions.
 */
export default function ModuleDetailScreen() {
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const moduleId = Number(id);
  const now = useNow(60_000);
  const mutate = useMutation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteCount, setDeleteCount] = useState<number | null>(null);

  const { data } = useQuery(async (r) => {
    const [module, sessions] = await Promise.all([r.modules.get(moduleId), r.sessions.list({ moduleId })]);
    return { module, sessions };
  }, moduleId);

  if (!data) return null;
  const { module, sessions } = data;
  if (!module) {
    return (
      <EmptyState
        icon="file-question-outline"
        title="Module not found"
        body="It may have been deleted."
        actionLabel="Go back"
        onAction={() => router.back()}
      />
    );
  }
  const current: StudyModule = module;

  const color = theme.app.modules[current.color];
  const week = moduleWeekProgress(current, sessions, now);
  const loggedTotal = totalMinutes(sessions, current.id);
  const workload = workloadMinutes(current.ects);
  const suggestion = suggestWeeklyTarget({
    ects: current.ects,
    examDate: current.examDate,
    loggedTotalMin: loggedTotal,
    today: now,
  });
  const showSuggestion = !current.archived && suggestion !== null && Math.abs(suggestion - current.weeklyTargetMin) >= 15;

  async function askDelete() {
    setMenuOpen(false);
    const count = await mutate((r) => r.sessions.countForModule(current.id));
    if (count !== undefined) setDeleteCount(count);
  }

  async function confirmDelete() {
    setDeleteCount(null);
    const ok = await mutate(async (r) => {
      await r.modules.remove(current.id);
      return true;
    });
    if (ok) router.back();
  }

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          title: current.code,
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton
                icon="pencil-outline"
                accessibilityLabel="Edit module"
                onPress={() => router.push(`/module/${current.id}/edit`)}
              />
              <Menu
                visible={menuOpen}
                onDismiss={() => setMenuOpen(false)}
                anchor={<IconButton icon="dots-vertical" accessibilityLabel="More options" onPress={() => setMenuOpen(true)} />}
              >
                <Menu.Item
                  leadingIcon={current.archived ? 'archive-arrow-up-outline' : 'archive-outline'}
                  title={current.archived ? 'Restore module' : 'Archive module'}
                  onPress={() => {
                    setMenuOpen(false);
                    void mutate((r) => r.modules.setArchived(current.id, !current.archived));
                  }}
                />
                <Menu.Item leadingIcon="delete-outline" title="Delete module" onPress={askDelete} />
              </Menu>
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.block}>
          <Text variant="headlineSmall">{current.name}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {metaLine(current, now)}
          </Text>
          {current.archived && (
            <Text variant="labelLarge" style={[styles.archived, { color: theme.colors.onSurfaceVariant }]}>
              Archived: not counted in your weekly goal
            </Text>
          )}
        </View>

        <Surface mode="flat" elevation={0} style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            This week
          </Text>
          <View style={styles.bigRow}>
            <Num variant="headlineMedium">{formatDuration(week.loggedMin)}</Num>
            <Num variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {` / ${formatDuration(week.targetMin)}`}
            </Num>
          </View>
          <ProgressBar ratio={week.ratio} color={color} height={8} accessibilityLabel="Weekly goal progress" />
          <View style={styles.cardFooter}>
            {/* Archived modules have no weekly goal to be "behind" on. */}
            {!current.archived && <PaceBadge status={week.pace} />}
            {!current.archived && (
              <Button
                mode="contained"
                icon="timer-outline"
                compact
                onPress={() => router.push({ pathname: '/timer', params: { moduleId: String(current.id) } })}
              >
                Focus
              </Button>
            )}
          </View>
        </Surface>

        {showSuggestion && suggestion !== null && (
          <Surface mode="flat" elevation={0} style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              To cover the full workload by the exam, plan about {formatDuration(suggestion)} per week.
            </Text>
            <Button
              mode="text"
              compact
              style={styles.alignStart}
              textColor={theme.colors.onPrimaryContainer}
              onPress={() => void mutate((r) => r.modules.setWeeklyTarget(current.id, suggestion))}
            >
              {`Use ${formatDuration(suggestion)} as goal`}
            </Button>
          </Surface>
        )}

        <View style={styles.block}>
          <View style={styles.spaceBetween}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {`Workload (${current.ects} ECTS)`}
            </Text>
            <Num variant="labelLarge">{`${formatDuration(loggedTotal)} / ${formatDuration(workload)}`}</Num>
          </View>
          <ProgressBar ratio={workload > 0 ? loggedTotal / workload : 0} color={color} accessibilityLabel="Total workload progress" />
        </View>

        <SectionHeader title="Last 6 weeks" />
        <View style={styles.chart}>
          <WeeklyBars data={weeklyHistory(sessions, current.id, now, 6)} targetMin={current.weeklyTargetMin} color={color} />
        </View>

        <SectionHeader
          title="Sessions"
          right={
            <Button
              compact
              icon="plus"
              onPress={() => router.push({ pathname: '/session/new', params: { moduleId: String(current.id) } })}
            >
              Log
            </Button>
          }
        />
        {sessions.length === 0 ? (
          <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            No sessions yet. Start the focus timer or log one you already did.
          </Text>
        ) : (
          sessions.slice(0, RECENT_SESSIONS).map((s, i) => (
            <View key={s.id}>
              {i > 0 && <Divider style={styles.divider} />}
              <SessionRow session={s} module={current} onPress={() => router.push(`/session/${s.id}`)} />
            </View>
          ))
        )}
        {sessions.length > RECENT_SESSIONS && (
          <Button
            style={styles.alignStart}
            onPress={() => router.push({ pathname: '/history', params: { module: String(current.id) } })}
          >
            {`See all ${sessions.length} sessions`}
          </Button>
        )}
      </ScrollView>

      <SnackbarHost safeArea />
      <ConfirmDialog
        visible={deleteCount !== null}
        title={`Delete ${current.code}?`}
        message={
          deleteCount
            ? `This also deletes ${deleteCount} logged ${deleteCount === 1 ? 'session' : 'sessions'}. This can't be undone. Archive the module instead to keep its history.`
            : "This can't be undone."
        }
        confirmLabel="Delete"
        destructive
        onDismiss={() => setDeleteCount(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  headerActions: { flexDirection: 'row' },
  block: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  archived: { marginTop: spacing.xs },
  card: { marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, gap: spacing.sm },
  bigRow: { flexDirection: 'row', alignItems: 'baseline' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  spaceBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  alignStart: { alignSelf: 'flex-start', marginLeft: spacing.sm },
  chart: { paddingHorizontal: spacing.lg },
  emptyText: { paddingHorizontal: spacing.lg },
  divider: { marginLeft: spacing.lg },
});
