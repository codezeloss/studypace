import { router, useLocalSearchParams } from 'expo-router';
import { totalMinutes } from '@/domain/progress';
import { ModuleForm } from '@/features/modules/ModuleForm';
import { useMutation, useQuery } from '@/state/hooks';
import { EmptyState } from '@/ui/components/EmptyState';

/** Screen to change a module's details or weekly goal. */
export default function EditModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const moduleId = Number(id);
  const mutate = useMutation();
  const { data } = useQuery(async (r) => {
    const [module, sessions] = await Promise.all([r.modules.get(moduleId), r.sessions.list({ moduleId })]);
    return { module, loggedTotalMin: totalMinutes(sessions, moduleId) };
  }, moduleId);

  if (!data) return null;
  if (!data.module) {
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
  return (
    <ModuleForm
      key={data.module.id}
      initial={data.module}
      loggedTotalMin={data.loggedTotalMin}
      submitLabel="Save changes"
      onSubmit={async (value) => {
        const ok = await mutate(async (r) => {
          await r.modules.update(moduleId, value);
          return true;
        });
        return ok === true;
      }}
    />
  );
}
