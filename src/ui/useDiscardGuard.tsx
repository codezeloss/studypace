import { useNavigation, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog';

/**
 * Asks "Discard changes?" when the user leaves a screen with unsaved form
 * input (back button, gesture or header arrow). Returns the dialog element,
 * which the screen must render.
 */
export function useDiscardGuard(enabled: boolean) {
  const navigation = useNavigation();
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  usePreventRemove(enabled, ({ data }) => {
    setPendingAction(() => () => navigation.dispatch(data.action));
  });

  return (
    <ConfirmDialog
      visible={pendingAction !== null}
      title="Discard changes?"
      message="What you entered on this screen will be lost."
      confirmLabel="Discard"
      destructive
      onDismiss={() => setPendingAction(null)}
      onConfirm={() => {
        const leave = pendingAction;
        setPendingAction(null);
        leave?.();
      }}
    />
  );
}
