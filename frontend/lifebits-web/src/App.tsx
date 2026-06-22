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
import Account from "./pages/account";
import Privacy from "./pages/privacy";
import Terms from "./pages/terms";

export default function App() {
  const auth = useContext(AuthContext);

  if (auth.isInitializing) {
    return (
      <div className="auth-loading" role="status">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        <Route
          path="/account"
          element={
            auth.isAuthenticated ? <Account /> : <Navigate to="/login" replace />
          }
        />

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
