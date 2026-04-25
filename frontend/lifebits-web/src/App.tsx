import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Notes from "./pages/notes";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContect";
import Register from "./pages/register";

export default function App() {
  const auth = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页 */}
        <Route path="/login" element={<Login />} />
        {/* 注册页 */}
        <Route path="/register" element={<Register />} />

        {/* notes页（受保护） */}
        <Route
          path="/notes"
          element={auth.token ? <Notes /> : <Navigate to="/login" replace />}
        />

        {/* 默认入口 */}
        <Route
          path="/"
          element={
            auth.token ? <Navigate to="/notes" /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
