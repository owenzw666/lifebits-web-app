import type { CSSProperties, ReactNode } from "react";

interface Props {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}

const LegalPage = ({ title, effectiveDate, children }: Props) => (
  <main style={pageStyle}>
    <article style={articleStyle}>
      <a href="/" style={backLinkStyle}>Back to Lifebits Map</a>
      <h1 style={titleStyle}>{title}</h1>
      <p style={dateStyle}>Effective date: {effectiveDate}</p>
      <div style={contentStyle}>{children}</div>
    </article>
  </main>
);

export const LegalSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section style={{ marginTop: "28px" }}>
    <h2 style={sectionTitleStyle}>{title}</h2>
    {children}
  </section>
);

const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  padding: "32px 20px 64px",
  background: "#f8fafc",
};

const articleStyle: CSSProperties = {
  width: "min(760px, 100%)",
  margin: "0 auto",
  color: "#374151",
  fontSize: "15px",
  lineHeight: 1.7,
};

const backLinkStyle: CSSProperties = {
  color: "#2563eb",
  fontSize: "14px",
};

const titleStyle: CSSProperties = {
  margin: "24px 0 4px",
  color: "#111827",
  fontSize: "32px",
  lineHeight: 1.2,
};

const dateStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
};

const contentStyle: CSSProperties = {
  marginTop: "28px",
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#111827",
  fontSize: "20px",
  lineHeight: 1.35,
};

export default LegalPage;
