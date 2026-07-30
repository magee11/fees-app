import { Dialog } from './Dialog';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  isBusy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
  isBusy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 4px' }}>{message}</p>
      <div className="dialog-actions">
        <Button variant="secondary" onClick={onClose} disabled={isBusy}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={isBusy}
          style={danger ? { background: 'var(--danger)', boxShadow: 'none' } : undefined}
        >
          {isBusy ? 'Please wait…' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
