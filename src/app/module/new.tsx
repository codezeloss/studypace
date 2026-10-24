import { ModuleForm } from '@/features/modules/ModuleForm';
import { useMutation } from '@/state/hooks';

/** Screen to add a module and set its weekly goal. */
export default function NewModuleScreen() {
  const mutate = useMutation();
  return (
    <ModuleForm
      loggedTotalMin={0}
      submitLabel="Save module"
      onSubmit={async (value) => (await mutate((r) => r.modules.create(value))) !== undefined}
    />
  );
}
