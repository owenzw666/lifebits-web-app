import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Notes from "./pages/notes";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContect";

export default function App() {
  const auth=useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>

        {/* 登录页 */}
        <Route path="/login" element={<Login />} />

        {/* notes页（受保护） */}
        <Route
          path="/notes"
          element={
            auth.token ? <Notes /> : <Navigate to="/login" replace />
          }
        />

        {/* 默认入口 */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}