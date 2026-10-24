import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { Divider, FAB, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDuration, formatWeekRange } from '@/domain/format';
import { groupSessionsByWeek } from '@/domain/progress';
import type { Session } from '@/domain/types';
import { addDays, startOfWeek } from '@/domain/week';
import { useMutation, useNow, useQuery } from '@/state/hooks';
import { EmptyState } from '@/ui/components/EmptyState';
import { ModuleDot } from '@/ui/components/ModuleDot';
import { Num } from '@/ui/components/Num';
import { SelectChip } from '@/ui/components/SelectChip';
import { SessionRow } from '@/ui/components/SessionRow';
import { TabHeader } from '@/ui/components/TabScreen';
import { SnackbarHost, useSnackbar } from '@/ui/SnackbarProvider';
import { FAB_CLEARANCE, spacing, useAppTheme } from '@/ui/theme';

/** "This week", "Last week", or a date range for older weeks. */
function weekTitle(weekStart: Date, now: Date): string {
  const current = startOfWeek(now);
  if (weekStart.getTime() === current.getTime()) return 'This week';
  if (weekStart.getTime() === addDays(current, -7).getTime()) return 'Last week';
  return formatWeekRange(weekStart);
}

/** All sessions grouped by week with weekly totals, filterable by module. */
export default function HistoryScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ module?: string }>();
  // A module id passed from Module detail ("See all sessions") pre-selects the filter.
  const routeFilter = params.module ? Number(params.module) : null;
  const [chosenFilter, setChosenFilter] = useState<number | null | undefined>(undefined);
  const filter = chosenFilter === undefined ? routeFilter : chosenFilter;
  const now = useNow(60_000);
  const mutate = useMutation();
  const showSnackbar = useSnackbar();

  const { data } = useQuery(async (r) => {
    const [modules, sessions] = await Promise.all([r.modules.list({ includeArchived: true }), r.sessions.list()]);
    return { modules, sessions };
  });

  const modulesById = useMemo(() => new Map((data?.modules ?? []).map((m) => [m.id, m])), [data]);
  const sections = useMemo(() => {
    const visible = (data?.sessions ?? []).filter((s) => filter === null || s.moduleId === filter);
    return groupSessionsByWeek(visible).map((g) => ({
      key: String(g.weekStart.getTime()),
      title: weekTitle(g.weekStart, now),
      totalMin: g.totalMin,
      data: g.sessions,
    }));
  }, [data, filter, now]);

  async function remove(session: Session) {
    const ok = await mutate(async (r) => {
      await r.sessions.remove(session.id);
      return true;
    });
    if (ok) {
      showSnackbar({
        message: 'Session deleted',
        actionLabel: 'Undo',
        onAction: () => void mutate((r) => r.sessions.restore(session)),
      });
    }
  }

  const header = (
    <>
      <TabHeader title="History" subtitle="Tap a session to edit it, long-press to delete." />
      {data && data.modules.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <SelectChip label="All" selected={filter === null} onPress={() => setChosenFilter(null)} />
          {data.modules.map((m) => (
            <SelectChip
              key={m.id}
              label={m.code}
              selected={filter === m.id}
              icon={() => <ModuleDot color={m.color} />}
              onPress={() => setChosenFilter(m.id)}
              accessibilityLabel={`Show ${m.name}`}
            />
          ))}
        </ScrollView>
      )}
    </>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(s) => String(s.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 96 }}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text variant="titleSmall" accessibilityRole="header" style={{ color: theme.colors.onSurfaceVariant }}>
              {section.title}
            </Text>
            <Num variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatDuration(section.totalMin)}
            </Num>
          </View>
        )}
        renderItem={({ item }) => (
          <SessionRow
            session={item}
            module={modulesById.get(item.moduleId)}
            onPress={() => router.push(`/session/${item.id}`)}
            onLongPress={() => remove(item)}
          />
        )}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        ListEmptyComponent={
          data ? (
            <EmptyState
              icon="history"
              title={filter === null ? 'No sessions yet' : 'No sessions for this module'}
              body="Sessions you track with the focus timer or log by hand show up here, grouped by week."
              actionLabel="Log a session"
              onAction={() => router.push('/session/new')}
            />
          ) : undefined
        }
      />
      {data && data.sessions.length > 0 && (
        <FAB icon="plus" label="Log session" style={styles.fab} onPress={() => router.push('/session/new')} />
      )}
      <SnackbarHost bottom={FAB_CLEARANCE} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filters: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  divider: { marginLeft: spacing.lg },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});
