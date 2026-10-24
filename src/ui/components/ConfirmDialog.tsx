import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useAppTheme } from '@/ui/theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

/** Material confirmation dialog, used only for actions that cannot be undone. */
export function ConfirmDialog({ visible, title, message, confirmLabel, destructive, onConfirm, onDismiss }: Props) {
  const theme = useAppTheme();
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onConfirm} textColor={destructive ? theme.colors.error : undefined}>
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
