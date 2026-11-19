import { AlertTriangle } from "lucide-react";
import { useModalFocus } from "@/hooks/useModalFocus";

interface DeleteApplicationDialogProps {
  company: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteApplicationDialog({
  company,
  onCancel,
  onConfirm,
}: DeleteApplicationDialogProps) {
  const dialogRef = useModalFocus<HTMLElement>();

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        aria-labelledby="delete-application-title"
        aria-modal="true"
        className="confirm-modal"
        ref={dialogRef}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        role="alertdialog"
      >
        <div className="confirm-icon"><AlertTriangle size={21} /></div>
        <h2 id="delete-application-title">Delete this application?</h2>
        <p>
          <strong>{company}</strong> and its notes will be permanently removed from this browser.
        </p>
        <div className="modal-actions">
          <button autoFocus className="button button--secondary" type="button" onClick={onCancel}>
            Keep application
          </button>
          <button className="button button--danger" type="button" onClick={onConfirm}>
            Delete application
          </button>
        </div>
      </section>
    </div>
  );
}
