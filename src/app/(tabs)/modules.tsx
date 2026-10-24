import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Divider, FAB, List } from 'react-native-paper';
import { formatDuration } from '@/domain/format';
import { weekProgress } from '@/domain/progress';
import { useNow, useQuery } from '@/state/hooks';
import { EmptyState } from '@/ui/components/EmptyState';
import { ModuleDot } from '@/ui/components/ModuleDot';
import { ModuleRow } from '@/ui/components/ModuleRow';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { TabScreen } from '@/ui/components/TabScreen';
import { SnackbarHost } from '@/ui/SnackbarProvider';
import { FAB_CLEARANCE, spacing } from '@/ui/theme';

/** All modules: active ones with this week's progress, archived ones below. */
export default function ModulesScreen() {
  const now = useNow(60_000);
  const { data } = useQuery(async (r) => {
    const [modules, sessions] = await Promise.all([r.modules.list({ includeArchived: true }), r.sessions.list()]);
    return { modules, sessions };
  });

  const active = data?.modules.filter((m) => !m.archived) ?? [];
  const archived = data?.modules.filter((m) => m.archived) ?? [];
  const progress = data ? weekProgress(active, data.sessions, now) : null;
  const subtitle =
    active.length > 0 && progress ? `${active.length} active · ${formatDuration(progress.targetMin)} weekly goal` : undefined;

  return (
    <View style={styles.flex}>
      <TabScreen title="Modules" subtitle={subtitle}>
        {data && data.modules.length === 0 && (
          <EmptyState
            icon="book-plus-outline"
            title="No modules yet"
            body="Add the modules you study this term and set a weekly goal for each one."
            actionLabel="Add module"
            onAction={() => router.push('/module/new')}
          />
        )}
        {progress?.modules.map((p, i) => (
          <View key={p.module.id}>
            {i > 0 && <Divider style={styles.divider} />}
            <ModuleRow progress={p} onPress={() => router.push(`/module/${p.module.id}`)} />
          </View>
        ))}
        {archived.length > 0 && (
          <>
            <SectionHeader title="Archived" />
            {archived.map((m) => (
              <List.Item
                key={m.id}
                title={m.name}
                description={m.code}
                left={() => (
                  <View style={styles.dot}>
                    <ModuleDot color={m.color} />
                  </View>
                )}
                onPress={() => router.push(`/module/${m.id}`)}
              />
            ))}
          </>
        )}
      </TabScreen>
      {data && data.modules.length > 0 && (
        <FAB icon="plus" label="Add module" style={styles.fab} onPress={() => router.push('/module/new')} />
      )}
      <SnackbarHost bottom={FAB_CLEARANCE} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  divider: { marginLeft: spacing.lg },
  dot: { justifyContent: 'center', paddingLeft: spacing.lg },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});
