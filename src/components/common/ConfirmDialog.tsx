import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** Red confirm button for destructive actions. */
  danger?: boolean;
  /** Label of the other button (default "Cancel"). */
  cancelLabel?: string;
  /**
   * Whether Esc or a click on the backdrop counts as the other button (default true). Turn off when that button
   * itself throws something away, so it only happens on purpose.
   */
  dismissible?: boolean;
  onConfirm(): void;
  onCancel(): void;
}

/**
 * In-app confirmation. The other button has focus, so a stray Enter never confirms; Esc or a click on the
 * backdrop picks the other button too, unless the dialog isn't dismissible.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  danger,
  cancelLabel = 'Cancel',
  dismissible = true,
  onConfirm,
  onCancel,
}: Props) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelButton.current?.focus(), []);

  return createPortal(
    <div className="dialog-backdrop" onClick={(e) => dismissible && e.target === e.currentTarget && onCancel()}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return;
          e.stopPropagation();
          if (dismissible) onCancel();
        }}
      >
        <h2 id="confirm-title">{title}</h2>
        <div className="confirm-body">{children}</div>
        <div className="btns dialog-actions">
          <button ref={cancelButton} type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={danger ? 'danger-solid' : 'on'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
