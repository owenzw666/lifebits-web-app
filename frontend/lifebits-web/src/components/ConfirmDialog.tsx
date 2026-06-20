import { useEffect } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmDialog = ({
  title,
  message,
  confirmLabel = "Delete",
  isConfirming = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isConfirming) onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirming, onCancel]);

  return (
    <div
      role="presentation"
      onClick={() => {
        if (!isConfirming) onCancel();
      }}
      style={backdropStyle}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(event) => event.stopPropagation()}
        style={dialogStyle}
      >
        <h2 id="confirm-dialog-title" style={titleStyle}>
          {title}
        </h2>
        <p id="confirm-dialog-message" style={messageStyle}>
          {message}
        </p>

        <div style={actionRowStyle}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            style={{
              ...buttonStyle,
              ...cancelButtonStyle,
              opacity: isConfirming ? 0.65 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            style={{
              ...buttonStyle,
              ...deleteButtonStyle,
              opacity: isConfirming ? 0.72 : 1,
            }}
          >
            {isConfirming ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};

const backdropStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
  background: "rgba(15, 23, 42, 0.52)",
} as const;

const dialogStyle = {
  width: "min(100%, 420px)",
  boxSizing: "border-box",
  padding: "22px",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#111827",
  boxShadow: "0 24px 64px rgba(15, 23, 42, 0.28)",
} as const;

const titleStyle = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.3,
} as const;

const messageStyle = {
  margin: "12px 0 0",
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: 1.55,
  overflowWrap: "anywhere",
} as const;

const actionRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginTop: "22px",
} as const;

const buttonStyle = {
  minHeight: "48px",
  padding: "11px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: 700,
  touchAction: "manipulation",
} as const;

const cancelButtonStyle = {
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
} as const;

const deleteButtonStyle = {
  border: "1px solid #b91c1c",
  background: "#b91c1c",
  color: "#ffffff",
} as const;

export default ConfirmDialog;
