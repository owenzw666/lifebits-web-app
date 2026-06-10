import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = searchParams.get("token");

    if (!token) {
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
      const result = await resetPasswordApi(token, newPassword);
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
