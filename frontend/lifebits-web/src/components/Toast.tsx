export type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type: ToastType;
  isMobile: boolean;
}

const Toast = ({ message, type, isMobile }: ToastProps) => {
  // Toast only needs two visual states for now.
  // Keeping this small avoids adding a notification library before the MVP needs it.
  const isError = type === "error";

  return (
    <div
      role="status"
      style={{
        // Desktop toasts sit in the top-right corner.
        // Mobile toasts sit near the bottom so they do not cover the map header area.
        position: "fixed",
        left: isMobile ? "16px" : "auto",
        right: "16px",
        bottom: isMobile
          ? "calc(20px + env(safe-area-inset-bottom))"
          : "auto",
        top: isMobile ? "auto" : "16px",
        zIndex: 60,
        maxWidth: isMobile ? "calc(100vw - 32px)" : "360px",
        padding: "12px 14px",
        borderRadius: "8px",
        border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
        background: isError ? "#fef2f2" : "#f0fdf4",
        color: isError ? "#991b1b" : "#166534",
        boxShadow: "0 14px 30px rgba(15, 23, 42, 0.16)",
        fontSize: "14px",
        fontWeight: 650,
        lineHeight: 1.4,
      }}
    >
      {message}
    </div>
  );
};

export default Toast;
