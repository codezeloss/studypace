import { router, useLocalSearchParams } from 'expo-router';
import { formatDuration } from '@/domain/format';
import { SessionForm } from '@/features/sessions/SessionForm';
import { useMutation, useQuery } from '@/state/hooks';
import { EmptyState } from '@/ui/components/EmptyState';
import { useSnackbar } from '@/ui/SnackbarProvider';

/** Screen to log a session that was not recorded with the timer. */
export default function NewSessionScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId?: string }>();
  const mutate = useMutation();
  const showSnackbar = useSnackbar();
  const { data: modules } = useQuery((r) => r.modules.list());

  if (!modules) return null;
  if (modules.length === 0) {
    return (
      <EmptyState
        icon="book-plus-outline"
        title="Add a module first"
        body="Sessions belong to a module, so create one before logging time."
        actionLabel="Add module"
        onAction={() => router.replace('/module/new')}
      />
    );
  }
  return (
    <SessionForm
      modules={modules}
      defaultModuleId={moduleId ? Number(moduleId) : null}
      submitLabel="Save session"
      onSubmit={async (value) => {
        const id = await mutate((r) => r.sessions.create(value));
        if (id === undefined) return false;
        showSnackbar({ message: `Logged ${formatDuration(value.durationMin)}` });
        return true;
      }}
    />
  );
}
