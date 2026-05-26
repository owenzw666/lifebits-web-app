import { useContext, useState } from "react";
import { loginApi } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5",
  },
  card: {
    width: "300px",
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
    marginBottom: "12px",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    background: "#4CAF50",
    color: "#fff",
    cursor: "pointer",
  },
  link: {
    marginTop: "12px",
    textAlign: "center" as const,
    fontSize: "14px",
  },
};

const Login = () => {
  // 表单状态
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  // 登录按钮点击
  const handleLogin = async () => {
    try {
      // 调用登录接口
      const result = await loginApi({
        email,
        password,
      });
      //更新全局
      auth.setToken(result.token);
      // 保存 token
      localStorage.setItem("token", result.token);

      // TODO: 跳转到 notes 页面
      navigate("/notes");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
