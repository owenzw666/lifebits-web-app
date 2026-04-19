import { useContext, useState } from "react";
import { loginApi } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContect";

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
    <div>
      <h2>Login</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
