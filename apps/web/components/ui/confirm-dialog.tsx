"use client";

import { Modal } from "./modal";

export function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div className="modal-actions">
          <button type="button" className="button button-soft" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button ${destructive ? "button-danger" : "button-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}
