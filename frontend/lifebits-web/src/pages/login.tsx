import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
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

  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      const result = await loginApi({
        email,
        password,
      });

      auth.login(result.token);
      navigate("/notes");
    } catch (error) {
      alert(error);
    }
  };

  const handleGoogleLoginPlaceholder = () => {
    // Google sign-in needs a Google OAuth Client ID before it can be enabled.
    // This placeholder keeps the UI ready without pretending the provider is live.
    alert("Google sign-in is prepared but not configured yet.");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        <button
          type="button"
          style={styles.googleButton}
          onClick={handleGoogleLoginPlaceholder}
        >
          Continue with Google
        </button>

        <div style={styles.divider}>or use email</div>

        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button style={styles.button} onClick={handleLogin}>
          Login
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
      </div>
    </div>
  );
};

export default Login;
