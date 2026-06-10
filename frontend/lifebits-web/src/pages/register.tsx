import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import { developmentLinkStyle } from "../components/accountStyles";

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5",
    padding: "20px",
    boxSizing: "border-box" as const,
  },
  card: {
    width: "min(360px, 100%)",
    padding: "24px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column" as const,
  },
  title: {
    textAlign: "center" as const,
    marginBottom: "20px",
  },
  input: {
    minHeight: "42px",
    marginBottom: "12px",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  button: {
    minHeight: "44px",
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    background: "#4CAF50",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 650,
  },
  linkButton: {
    minHeight: "40px",
    marginTop: "10px",
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "14px",
  },
};

const Register = () => {
  // Local registration stays available as a fallback for users who do not use OAuth.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [developmentLink, setDevelopmentLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");
    setSuccessMessage("");
    setDevelopmentLink(null);
    setIsSubmitting(true);

    try {
      const result = await registerApi({
        email: email.trim(),
        password,
      });

      setSuccessMessage(result.message);
      setDevelopmentLink(result.developmentLink ?? null);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Could not create your account. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleRegister}>
        <h2 style={styles.title}>Register</h2>

        {successMessage ? (
          <>
            <p style={successStyle}>{successMessage}</p>
            {developmentLink && (
              <a href={developmentLink} style={developmentLinkStyle}>
                Open development verification link
              </a>
            )}
          </>
        ) : (
          <>
            <input
              style={styles.input}
              type="email"
              placeholder="Email"
              autoComplete="email"
              required
              maxLength={100}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <div style={hintStyle}>Use at least 8 characters.</div>

            {errorMessage && (
              <div role="alert" style={errorStyle}>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.button,
                cursor: isSubmitting ? "wait" : "pointer",
                opacity: isSubmitting ? 0.72 : 1,
              }}
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </button>
          </>
        )}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => navigate("/login")}
          style={{
            ...styles.linkButton,
            opacity: isSubmitting ? 0.65 : 1,
          }}
        >
          Back to login
        </button>
      </form>
    </div>
  );
};

const hintStyle = {
  margin: "-4px 0 12px",
  color: "#6b7280",
  fontSize: "12px",
} as const;

const errorStyle = {
  marginBottom: "12px",
  color: "#b91c1c",
  fontSize: "13px",
  lineHeight: 1.4,
} as const;

const successStyle = {
  margin: "0 0 12px",
  color: "#166534",
  fontSize: "14px",
  lineHeight: 1.5,
} as const;

export default Register;
