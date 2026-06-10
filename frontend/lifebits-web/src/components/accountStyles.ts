import type { CSSProperties } from "react";

export const accountInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  boxSizing: "border-box",
  marginBottom: "12px",
  padding: "10px 11px",
  borderRadius: "7px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  fontSize: "16px",
};

export const accountPrimaryButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  padding: "10px 14px",
  borderRadius: "7px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 700,
};

export const accountLinkButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "40px",
  marginTop: "8px",
  border: "none",
  background: "transparent",
  color: "#2563eb",
  cursor: "pointer",
  fontSize: "14px",
};

export const accountMessageStyle: CSSProperties = {
  margin: "0 0 16px",
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: 1.55,
};

export const accountErrorStyle: CSSProperties = {
  margin: "0 0 12px",
  color: "#b91c1c",
  fontSize: "13px",
  lineHeight: 1.45,
};

export const developmentLinkStyle: CSSProperties = {
  display: "block",
  margin: "12px 0",
  padding: "10px",
  border: "1px solid #bfdbfe",
  borderRadius: "7px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: "13px",
  overflowWrap: "anywhere",
};
