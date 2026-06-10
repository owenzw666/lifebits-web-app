import { useContext } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import ForgotPassword from "./pages/forgotPassword";
import Login from "./pages/login";
import Notes from "./pages/notes";
import Register from "./pages/register";
import ResetPassword from "./pages/resetPassword";
import VerifyEmail from "./pages/verifyEmail";

export default function App() {
  const auth = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/notes"
          element={
            auth.isAuthenticated ? <Notes /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/"
          element={
            auth.isAuthenticated ? (
              <Navigate to="/notes" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
