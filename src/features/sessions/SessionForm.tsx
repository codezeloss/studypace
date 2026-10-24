import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, TouchableRipple } from 'react-native-paper';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import { formatLongDate, formatTime } from '@/domain/format';
import type { NewSession, Session, StudyModule } from '@/domain/types';
import { MAX_NOTE_LENGTH, validateSession, type SessionFormValues } from '@/domain/validation';
import { parseDayKey, toDayKey } from '@/domain/week';
import { FocusRating } from '@/ui/components/FocusRating';
import { ModuleDot } from '@/ui/components/ModuleDot';
import { SelectChip } from '@/ui/components/SelectChip';
import { DATE_LOCALE, calendarProps } from '@/ui/dates';
import { SnackbarHost } from '@/ui/SnackbarProvider';
import { spacing } from '@/ui/theme';
import { useDiscardGuard } from '@/ui/useDiscardGuard';

const QUICK_DURATIONS = [25, 45, 60, 90];

interface Props {
  /** Modules the user can choose from. */
  modules: StudyModule[];
  /** Session to edit; omitted for a new one. */
  initial?: Session;
  defaultModuleId?: number | null;
  submitLabel: string;
  /** Persists the value; resolves true on success so the form can close. */
  onSubmit: (value: NewSession) => Promise<boolean>;
}

function toFormValues(modules: StudyModule[], initial?: Session, defaultModuleId?: number | null): SessionFormValues {
  if (initial) {
    const start = new Date(initial.startedAt);
    return {
      moduleId: initial.moduleId,
      date: toDayKey(start),
      time: formatTime(start),
      durationMin: String(initial.durationMin),
      focusRating: initial.focusRating,
      note: initial.note ?? '',
    };
  }
  // Default: a one-hour session that just ended, start rounded down to 5 minutes.
  const start = new Date(Date.now() - 60 * 60_000);
  start.setMinutes(Math.floor(start.getMinutes() / 5) * 5, 0, 0);
  return {
    moduleId: defaultModuleId ?? modules[0]?.id ?? null,
    date: toDayKey(start),
    time: formatTime(start),
    durationMin: '60',
    focusRating: null,
    note: '',
  };
}

/** Form to enter performance data manually: module, start, duration, focus and a note. */
export function SessionForm({ modules, initial, defaultModuleId, submitLabel, onSubmit }: Props) {
  const [initialValues] = useState(() => toFormValues(modules, initial, defaultModuleId));
  const [values, setValues] = useState(initialValues);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const guardDialog = useDiscardGuard(dirty && !saved);
  useEffect(() => {
    if (saved) router.back();
  }, [saved]);

  const set = <K extends keyof SessionFormValues>(key: K, value: SessionFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const result = validateSession(values, new Date());
  const errors = showErrors && !result.ok ? result.errors : {};
  const day = parseDayKey(values.date);
  const [hours, minutes] = values.time.split(':').map(Number);

  async function handleSubmit() {
    setShowErrors(true);
    if (!result.ok) return;
    setSaving(true);
    const ok = await onSubmit(result.value);
    setSaving(false);
    if (ok) setSaved(true);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="titleSmall" style={styles.label}>
          Module
        </Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {modules.map((m) => (
            <SelectChip
              key={m.id}
              label={m.code}
              selected={values.moduleId === m.id}
              icon={() => <ModuleDot color={m.color} />}
              onPress={() => set('moduleId', m.id)}
              accessibilityLabel={m.name}
            />
          ))}
        </View>
        <HelperText type="error" visible={!!errors.moduleId}>
          {errors.moduleId}
        </HelperText>

        <View style={styles.row}>
          <TouchableRipple
            style={styles.flex}
            onPress={() => setDatePickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={day ? `Date ${formatLongDate(day)}. Change` : 'Pick date'}
          >
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                label="Date"
                value={day ? formatLongDate(day) : ''}
                editable={false}
                right={<TextInput.Icon icon="calendar-outline" />}
                error={!!errors.date}
              />
            </View>
          </TouchableRipple>
          <TouchableRipple
            style={styles.time}
            onPress={() => setTimePickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Start time ${values.time}. Change`}
          >
            <View pointerEvents="none">
              <TextInput mode="outlined" label="Start" value={values.time} editable={false} error={!!errors.time} />
            </View>
          </TouchableRipple>
        </View>
        <HelperText type="error" visible={!!(errors.date || errors.time)}>
          {errors.date ?? errors.time}
        </HelperText>

        <TextInput
          mode="outlined"
          label="Duration (minutes)"
          keyboardType="number-pad"
          value={values.durationMin}
          onChangeText={(t) => set('durationMin', t)}
          error={!!errors.durationMin}
        />
        <View style={styles.chips}>
          {QUICK_DURATIONS.map((d) => (
            <SelectChip
              key={d}
              label={`${d} min`}
              selected={values.durationMin === String(d)}
              onPress={() => set('durationMin', String(d))}
            />
          ))}
        </View>
        <HelperText type="error" visible={!!errors.durationMin}>
          {errors.durationMin}
        </HelperText>

        <Text variant="titleSmall" style={styles.label}>
          How focused were you? (optional)
        </Text>
        <FocusRating value={values.focusRating} onChange={(v) => set('focusRating', v)} />

        <TextInput
          mode="outlined"
          label="Note (optional)"
          value={values.note}
          onChangeText={(t) => set('note', t)}
          multiline
          numberOfLines={3}
          maxLength={MAX_NOTE_LENGTH}
          style={styles.note}
          error={!!errors.note}
        />
        <HelperText type={errors.note ? 'error' : 'info'}>
          {errors.note ?? `${values.note.length}/${MAX_NOTE_LENGTH}`}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={saving}
          disabled={saving}
          style={styles.submit}
          contentStyle={styles.submitContent}
        >
          {submitLabel}
        </Button>
      </ScrollView>

      <DatePickerModal
        {...calendarProps}
        mode="single"
        visible={datePickerOpen}
        label="Session date"
        saveLabel="Save"
        date={day ?? undefined}
        validRange={{ endDate: new Date() }}
        onDismiss={() => setDatePickerOpen(false)}
        onConfirm={({ date }) => {
          setDatePickerOpen(false);
          if (date) set('date', toDayKey(date));
        }}
      />
      <TimePickerModal
        locale={DATE_LOCALE}
        visible={timePickerOpen}
        hours={hours}
        minutes={minutes}
        use24HourClock
        label="Start time"
        onDismiss={() => setTimePickerOpen(false)}
        onConfirm={({ hours: h, minutes: m }) => {
          setTimePickerOpen(false);
          set('time', `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }}
      />
      {guardDialog}
      <SnackbarHost safeArea />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: { marginBottom: spacing.md, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  time: { width: 112 },
  note: { marginTop: spacing.xl },
  submit: { marginTop: spacing.xl },
  submitContent: { height: 52 },
});
