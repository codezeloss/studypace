import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, TouchableRipple } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { formatDuration, formatLongDate, minutesToHoursInput } from '@/domain/format';
import { HOURS_PER_ECTS, suggestWeeklyTarget, weeksUntilExam, workloadMinutes } from '@/domain/pace';
import type { NewModule, StudyModule } from '@/domain/types';
import { validateModule, type ModuleFormValues } from '@/domain/validation';
import { parseDayKey, startOfDay, toDayKey } from '@/domain/week';
import { ColorPicker } from '@/ui/components/ColorPicker';
import { calendarProps } from '@/ui/dates';
import { SnackbarHost } from '@/ui/SnackbarProvider';
import { spacing } from '@/ui/theme';
import { useDiscardGuard } from '@/ui/useDiscardGuard';

interface Props {
  /** Module to edit; omitted when creating a new one. */
  initial?: StudyModule;
  /** Minutes already logged for this module, used by the goal suggestion. */
  loggedTotalMin: number;
  submitLabel: string;
  /** Persists the value; resolves true on success so the form can close. */
  onSubmit: (value: NewModule) => Promise<boolean>;
}

function toFormValues(module?: StudyModule): ModuleFormValues {
  return {
    code: module?.code ?? '',
    name: module?.name ?? '',
    ects: module ? String(module.ects) : '5',
    examDate: module?.examDate ?? null,
    weeklyTargetHours: module ? minutesToHoursInput(module.weeklyTargetMin) : '',
    color: module?.color ?? 'ink',
  };
}

/**
 * Create/edit form for a module, i.e. where the user sets their individual
 * goal. "Suggest" fills the weekly goal from the ECTS workload, the time
 * already logged and the weeks left until the exam.
 */
export function ModuleForm({ initial, loggedTotalMin, submitLabel, onSubmit }: Props) {
  const initialValues = useMemo(() => toFormValues(initial), [initial]);
  const [values, setValues] = useState(initialValues);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const guardDialog = useDiscardGuard(dirty && !saved);

  // Navigate only after the render in which `saved` disabled the discard guard.
  useEffect(() => {
    if (saved) router.back();
  }, [saved]);

  const set = <K extends keyof ModuleFormValues>(key: K, value: ModuleFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const result = validateModule(values);
  const errors = showErrors && !result.ok ? result.errors : {};

  const today = new Date();
  const ects = Number.parseInt(values.ects, 10);
  const validEcts = Number.isInteger(ects) && ects >= 1 && ects <= 30;
  const suggestion = validEcts
    ? suggestWeeklyTarget({ ects, examDate: values.examDate, loggedTotalMin, today })
    : null;
  const weeksLeft = Math.max(1, weeksUntilExam(values.examDate, today) ?? 1);
  const suggestionHint =
    suggestion !== null
      ? `${ects} ECTS × ${HOURS_PER_ECTS} h = ${formatDuration(workloadMinutes(ects))}. ` +
        `${formatDuration(Math.max(0, workloadMinutes(ects) - loggedTotalMin))} left over ` +
        `${weeksLeft} ${weeksLeft === 1 ? 'week' : 'weeks'}.`
      : 'Add an exam date to get a suggestion based on the ECTS workload.';

  const examDate = values.examDate ? parseDayKey(values.examDate) : null;

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
        <TextInput
          mode="outlined"
          label="Module code"
          value={values.code}
          onChangeText={(t) => set('code', t)}
          autoCapitalize="characters"
          autoCorrect={false}
          error={!!errors.code}
        />
        <HelperText type={errors.code ? 'error' : 'info'}>{errors.code ?? 'As shown in myCampus, e.g. DLBCSEMSE02'}</HelperText>

        <TextInput
          mode="outlined"
          label="Module name"
          value={values.name}
          onChangeText={(t) => set('name', t)}
          error={!!errors.name}
        />
        <HelperText type="error" visible={!!errors.name}>
          {errors.name}
        </HelperText>

        <TextInput
          mode="outlined"
          label="ECTS credits"
          keyboardType="number-pad"
          value={values.ects}
          onChangeText={(t) => set('ects', t)}
          error={!!errors.ects}
        />
        <HelperText type="error" visible={!!errors.ects}>
          {errors.ects}
        </HelperText>

        <TouchableRipple
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={examDate ? `Exam date ${formatLongDate(examDate)}. Change` : 'Pick exam date'}
        >
          <View pointerEvents="none">
            <TextInput
              mode="outlined"
              label="Exam date (optional)"
              value={examDate ? formatLongDate(examDate) : ''}
              editable={false}
              right={<TextInput.Icon icon="calendar-outline" />}
              error={!!errors.examDate}
            />
          </View>
        </TouchableRipple>
        <View style={styles.inlineRow}>
          <HelperText type={errors.examDate ? 'error' : 'info'} style={styles.flex}>
            {errors.examDate ?? 'Used to pace your weekly goal.'}
          </HelperText>
          {values.examDate && (
            <Button compact onPress={() => set('examDate', null)}>
              Remove
            </Button>
          )}
        </View>

        <Text variant="titleSmall" style={styles.label}>
          Color
        </Text>
        <ColorPicker value={values.color} onChange={(c) => set('color', c)} />

        <Text variant="titleSmall" style={styles.label}>
          Weekly goal
        </Text>
        <View style={styles.targetRow}>
          <TextInput
            style={styles.flex}
            mode="outlined"
            label="Hours per week"
            keyboardType="decimal-pad"
            value={values.weeklyTargetHours}
            onChangeText={(t) => set('weeklyTargetHours', t)}
            error={!!errors.weeklyTargetHours}
          />
          <Button
            mode="contained-tonal"
            icon="calculator-variant-outline"
            disabled={suggestion === null}
            onPress={() => suggestion !== null && set('weeklyTargetHours', minutesToHoursInput(suggestion))}
            style={styles.suggest}
            contentStyle={styles.suggestContent}
          >
            Suggest
          </Button>
        </View>
        <HelperText type={errors.weeklyTargetHours ? 'error' : 'info'}>
          {errors.weeklyTargetHours ?? suggestionHint}
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
        visible={pickerOpen}
        label="Exam date"
        saveLabel="Save"
        date={examDate ?? undefined}
        validRange={{ startDate: startOfDay(today) }}
        onDismiss={() => setPickerOpen(false)}
        onConfirm={({ date }) => {
          setPickerOpen(false);
          if (date) set('examDate', toDayKey(date));
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
  label: { marginTop: spacing.lg, marginBottom: spacing.md },
  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  suggest: { marginTop: 6 },
  suggestContent: { height: 48 },
  submit: { marginTop: spacing.xl },
  submitContent: { height: 52 },
});
