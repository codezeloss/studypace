import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, RadioButton, Text, TextInput } from 'react-native-paper';
import { formatClock, formatDuration } from '@/domain/format';
import { minutesInRange } from '@/domain/progress';
import { elapsedMs, isSavable, pauseTimer, resumeTimer, startTimer, toSessionMinutes } from '@/domain/timer';
import type { ActiveTimer } from '@/domain/types';
import { MAX_NOTE_LENGTH } from '@/domain/validation';
import { weekRange } from '@/domain/week';
import { useMutation, useNow, useQuery } from '@/state/hooks';
import { ConfirmDialog } from '@/ui/components/ConfirmDialog';
import { EmptyState } from '@/ui/components/EmptyState';
import { FocusRating } from '@/ui/components/FocusRating';
import { ModuleDot } from '@/ui/components/ModuleDot';
import { Num } from '@/ui/components/Num';
import { ProgressRing } from '@/ui/components/ProgressRing';
import { SnackbarHost, useSnackbar } from '@/ui/SnackbarProvider';
import { spacing, useAppTheme } from '@/ui/theme';

const KEEP_AWAKE_TAG = 'focus-timer';

/**
 * Focus timer with three phases: choose a module, track time (pause/resume),
 * then review and save the session. The timer state lives in SQLite, so
 * leaving the screen or closing the app does not lose the running session.
 */
export default function TimerScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ moduleId?: string }>();
  const mutate = useMutation();
  const showSnackbar = useSnackbar();

  const { data } = useQuery(async (r) => {
    const [timer, modules, sessions] = await Promise.all([
      r.timer.get(),
      r.modules.list({ includeArchived: true }),
      r.sessions.list(),
    ]);
    return { timer, modules, sessions };
  });

  const timer = data?.timer ?? null;
  const running = timer !== null && timer.pausedAt === null;
  const now = useNow(running ? 1000 : null);

  const [selectedId, setSelectedId] = useState<number | null>(params.moduleId ? Number(params.moduleId) : null);
  const [reviewing, setReviewing] = useState(false);
  const [focusRating, setFocusRating] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Keep the screen on only while time is running.
  useEffect(() => {
    if (!running) return;
    void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => {
      void deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [running]);

  if (!data) return null;

  const activeModules = data.modules.filter((m) => !m.archived);
  if (!timer && activeModules.length === 0) {
    return (
      <EmptyState
        icon="book-plus-outline"
        title="Add a module first"
        body="The timer records time for a module, so create one to start."
        actionLabel="Add module"
        onAction={() => router.replace('/module/new')}
      />
    );
  }

  const moduleId = timer?.moduleId ?? selectedId ?? activeModules[0]?.id ?? null;
  const module = data.modules.find((m) => m.id === moduleId);
  const color = module ? theme.app.modules[module.color] : theme.colors.primary;

  // ---- Phase 1: choose module ----
  if (!timer) {
    return (
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            What are you studying?
          </Text>
          <RadioButton.Group value={String(moduleId)} onValueChange={(v) => setSelectedId(Number(v))}>
            {activeModules.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setSelectedId(m.id)}
                style={styles.option}
                accessibilityRole="radio"
                accessibilityState={{ checked: m.id === moduleId }}
                accessibilityLabel={m.name}
              >
                <RadioButton.Android value={String(m.id)} />
                <ModuleDot color={m.color} />
                <View style={styles.flex}>
                  <Text variant="titleMedium" numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {m.code}
                  </Text>
                </View>
              </Pressable>
            ))}
          </RadioButton.Group>
        </ScrollView>
        <View style={styles.footer}>
          <Button
            mode="contained"
            icon="play"
            disabled={moduleId === null}
            contentStyle={styles.bigButton}
            onPress={async () => {
              if (moduleId === null) return;
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await mutate((r) => r.timer.save(startTimer(moduleId, new Date())));
            }}
          >
            Start focus
          </Button>
        </View>
        <SnackbarHost safeArea />
      </View>
    );
  }

  const active: ActiveTimer = timer;
  const elapsed = elapsedMs(active, now);
  const { start, end } = weekRange(now);
  const weekLogged = minutesInRange(data.sessions, start, end, active.moduleId);
  const target = module?.weeklyTargetMin ?? 0;
  const withSession = weekLogged + elapsed / 60_000;
  const weekRatio = target > 0 ? withSession / target : 0;

  async function togglePause() {
    void Haptics.selectionAsync();
    const next = active.pausedAt ? resumeTimer(active, new Date()) : pauseTimer(active, new Date());
    await mutate((r) => r.timer.save(next));
  }

  async function finish() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!active.pausedAt) await mutate((r) => r.timer.save(pauseTimer(active, new Date())));
    setReviewing(true);
  }

  async function save() {
    const minutes = toSessionMinutes(elapsedMs(active, new Date()));
    const ok = await mutate(async (r) => {
      await r.sessions.create({
        moduleId: active.moduleId,
        startedAt: active.startedAt,
        durationMin: minutes,
        focusRating,
        note: note.trim() || null,
        source: 'timer',
      });
      await r.timer.clear();
      return true;
    });
    if (!ok) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSnackbar({ message: `Saved ${formatDuration(minutes)} for ${module?.code ?? 'your module'}` });
    router.back();
  }

  async function discard() {
    setConfirmDiscard(false);
    await mutate((r) => r.timer.clear());
    router.back();
  }

  // ---- Phase 3: review and save ----
  if (reviewing && active.pausedAt) {
    const savable = isSavable(elapsed);
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Session finished
          </Text>
          <Num variant="displaySmall" style={styles.reviewTime}>
            {formatDuration(toSessionMinutes(elapsed))}
          </Num>
          <View style={styles.moduleLine}>
            {module && <ModuleDot color={module.color} />}
            <Text variant="titleMedium">{module?.name ?? 'Deleted module'}</Text>
          </View>
          {savable ? (
            <>
              <Text variant="titleSmall" style={styles.sectionLabel}>
                How focused were you? (optional)
              </Text>
              <FocusRating value={focusRating} onChange={setFocusRating} />
              <TextInput
                mode="outlined"
                label="What did you work on? (optional)"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                maxLength={MAX_NOTE_LENGTH}
                style={styles.note}
              />
            </>
          ) : (
            <Text variant="bodyMedium" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
              Sessions shorter than a minute are not saved.
            </Text>
          )}
        </ScrollView>
        <View style={styles.footer}>
          {savable && (
            <Button mode="contained" icon="content-save-outline" contentStyle={styles.bigButton} onPress={save}>
              Save session
            </Button>
          )}
          <Button mode="text" textColor={theme.colors.error} onPress={() => (savable ? setConfirmDiscard(true) : discard())}>
            Discard
          </Button>
        </View>
        <ConfirmDialog
          visible={confirmDiscard}
          title="Discard this session?"
          message={`${formatDuration(toSessionMinutes(elapsed))} of study time will not be saved.`}
          confirmLabel="Discard"
          destructive
          onDismiss={() => setConfirmDiscard(false)}
          onConfirm={discard}
        />
        <SnackbarHost safeArea />
      </KeyboardAvoidingView>
    );
  }

  // ---- Phase 2: running or paused ----
  return (
    <View style={styles.flex}>
      <View style={styles.timerBody}>
        <View style={styles.moduleLine}>
          {module && <ModuleDot color={module.color} />}
          <Text variant="titleMedium">{module?.code ?? 'Deleted module'}</Text>
        </View>
        <ProgressRing
          ratio={weekRatio}
          size={260}
          strokeWidth={14}
          color={color}
          accessibilityLabel={`Weekly goal ${Math.round(weekRatio * 100)} percent`}
        >
          <Num style={styles.clock} accessibilityLabel={`Elapsed ${formatClock(elapsed)}`}>
            {formatClock(elapsed)}
          </Num>
          <Text variant="labelLarge" style={{ color: active.pausedAt ? theme.app.accent : theme.colors.onSurfaceVariant }}>
            {active.pausedAt ? 'Paused' : 'This session'}
          </Text>
        </ProgressRing>
        <Text variant="bodyMedium" style={[styles.weekLine, { color: theme.colors.onSurfaceVariant }]}>
          {`This week ${formatDuration(withSession)} of ${formatDuration(target)}`}
        </Text>
      </View>
      <View style={[styles.footer, styles.controls]}>
        <Button
          mode="contained-tonal"
          icon={active.pausedAt ? 'play' : 'pause'}
          style={styles.flex}
          contentStyle={styles.bigButton}
          onPress={togglePause}
        >
          {active.pausedAt ? 'Resume' : 'Pause'}
        </Button>
        <Button mode="contained" icon="stop" style={styles.flex} contentStyle={styles.bigButton} onPress={finish}>
          Finish
        </Button>
      </View>
      <SnackbarHost bottom={96} safeArea />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { marginBottom: spacing.lg },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56 },
  footer: { padding: spacing.lg, gap: spacing.sm },
  controls: { flexDirection: 'row', gap: spacing.md },
  bigButton: { height: 56 },
  timerBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, padding: spacing.lg },
  moduleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clock: { fontSize: 52, lineHeight: 60, letterSpacing: -1 },
  weekLine: { textAlign: 'center' },
  reviewTime: { marginTop: spacing.xs, marginBottom: spacing.sm },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.md },
  note: { marginTop: spacing.xl },
});
