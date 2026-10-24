import { Stack, router, useLocalSearchParams } from 'expo-router';
import { IconButton } from 'react-native-paper';
import type { Session } from '@/domain/types';
import { SessionForm } from '@/features/sessions/SessionForm';
import { useMutation, useQuery } from '@/state/hooks';
import { EmptyState } from '@/ui/components/EmptyState';
import { useSnackbar } from '@/ui/SnackbarProvider';

/** Screen to correct or delete a logged session. Deleting can be undone from the snackbar. */
export default function EditSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const mutate = useMutation();
  const showSnackbar = useSnackbar();
  const { data } = useQuery(async (r) => {
    const [session, modules] = await Promise.all([r.sessions.get(sessionId), r.modules.list({ includeArchived: true })]);
    return { session, modules };
  }, sessionId);

  if (!data) return null;
  if (!data.session) {
    return (
      <EmptyState
        icon="file-question-outline"
        title="Session not found"
        body="It may have been deleted."
        actionLabel="Go back"
        onAction={() => router.back()}
      />
    );
  }
  const session: Session = data.session;
  const modules = data.modules.filter((m) => !m.archived || m.id === session.moduleId);

  async function remove() {
    const ok = await mutate(async (r) => {
      await r.sessions.remove(session.id);
      return true;
    });
    if (!ok) return;
    router.back();
    showSnackbar({
      message: 'Session deleted',
      actionLabel: 'Undo',
      onAction: () => void mutate((r) => r.sessions.restore(session)),
    });
  }

  return (
    <>
      <Stack.Screen
        options={{ headerRight: () => <IconButton icon="delete-outline" accessibilityLabel="Delete session" onPress={remove} /> }}
      />
      <SessionForm
        key={session.id}
        modules={modules}
        initial={session}
        submitLabel="Save changes"
        onSubmit={async (value) => {
          const ok = await mutate(async (r) => {
            // Keep where the session came from (timer or manual) when it is corrected by hand.
            await r.sessions.update(session.id, { ...value, source: session.source });
            return true;
          });
          return ok === true;
        }}
      />
    </>
  );
}
