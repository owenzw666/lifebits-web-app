import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import { AuthContext } from "../context/AuthContext";

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
  googleButton: {
    minHeight: "44px",
    marginTop: "12px",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: 650,
  },
  divider: {
    margin: "16px 0",
    textAlign: "center" as const,
    color: "#6b7280",
    fontSize: "13px",
  },
  link: {
    marginTop: "12px",
    textAlign: "center" as const,
    fontSize: "14px",
  },
};

const Login = () => {
  // Keep email/password login as a fallback even after OAuth is added.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await loginApi({
        email: email.trim(),
        password,
      });

      auth.login(result.token);
      navigate("/notes");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Could not log in. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleLogin}>
        <h2 style={styles.title}>Login</h2>

        <button
          type="button"
          disabled
          style={{
            ...styles.googleButton,
            cursor: "not-allowed",
            opacity: 0.65,
          }}
        >
          Google sign-in coming soon
        </button>

        <div style={styles.divider}>or use email</div>

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
          autoComplete="current-password"
          required
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

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
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <p style={styles.link}>
          Don't have an account?{" "}
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
      </form>
    </div>
  );
};

const errorStyle = {
  marginBottom: "12px",
  color: "#b91c1c",
  fontSize: "13px",
  lineHeight: 1.4,
} as const;

export default Login;
