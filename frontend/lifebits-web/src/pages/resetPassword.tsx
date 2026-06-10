import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPasswordApi } from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import AccountPage from "../components/AccountPage";
import {
  accountErrorStyle,
  accountInputStyle,
  accountLinkButtonStyle,
  accountMessageStyle,
  accountPrimaryButtonStyle,
} from "../components/accountStyles";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [resetToken] = useState(() =>
    new URLSearchParams(window.location.search).get("token"),
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Keep the secret in component memory, then remove it from the address bar
    // so it is less likely to leak through history, screenshots, or analytics.
    if (resetToken) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [resetToken]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resetToken) {
      setErrorMessage("This reset link is missing its token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setErrorMessage("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await resetPasswordApi(resetToken, newPassword);
      setMessage(result.message);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Could not reset this password."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccountPage title="Choose a new password">
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          placeholder="New password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          style={accountInputStyle}
        />
        <input
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          style={accountInputStyle}
        />
        {message && <p style={accountMessageStyle}>{message}</p>}
        {errorMessage && <div style={accountErrorStyle}>{errorMessage}</div>}
        {!message && (
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...accountPrimaryButtonStyle,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        )}
      </form>
      <button
        type="button"
        style={accountLinkButtonStyle}
        onClick={() => navigate("/login")}
      >
        Back to login
      </button>
    </AccountPage>
  );
};

export default ResetPassword;
