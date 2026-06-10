import type { CSSProperties, ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

const AccountPage = ({ title, children }: Props) => {
  return (
    <main style={containerStyle}>
      <section style={cardStyle}>
        <h1 style={titleStyle}>{title}</h1>
        {children}
      </section>
    </main>
  );
};

const containerStyle: CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  padding: "20px",
  background: "#f5f5f5",
};

const cardStyle: CSSProperties = {
  width: "min(390px, 100%)",
  boxSizing: "border-box",
  padding: "24px",
  borderRadius: "8px",
  background: "#ffffff",
  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.12)",
};

const titleStyle: CSSProperties = {
  margin: "0 0 18px",
  color: "#111827",
  textAlign: "center",
  fontSize: "22px",
  lineHeight: 1.25,
};

export default AccountPage;
