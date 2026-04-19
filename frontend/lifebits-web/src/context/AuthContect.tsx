import { createContext, useState } from "react";

// 1️⃣ 创建 Context（先当成“全局变量容器”）
export const AuthContext = createContext<any>(null);

// 2️⃣ 创建 Provider（核心）
export const AuthProvider = ({ children }: any) => {

  // 3️⃣ 用 state 管 token
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  return (
    // 4️⃣ 把 token 和 setToken 提供给全局
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};