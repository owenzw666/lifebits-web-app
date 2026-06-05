import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../api/authApi";

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
};

const Register = () => {
  // Local registration stays available as a fallback for users who do not use OAuth.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await registerApi({
        email,
        password,
      });

      navigate("/login");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Register</h2>

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

        <button style={styles.button} onClick={handleRegister}>
          Register
        </button>
      </div>
    </div>
  );
};

export default Register;
