import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswordApi } from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import AccountPage from "../components/AccountPage";
import {
  accountErrorStyle,
  accountInputStyle,
  accountLinkButtonStyle,
  accountMessageStyle,
  accountPrimaryButtonStyle,
  developmentLinkStyle,
} from "../components/accountStyles";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [developmentLink, setDevelopmentLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setErrorMessage("");
    setMessage("");
    setDevelopmentLink(null);
    setIsSubmitting(true);

    try {
      const result = await forgotPasswordApi(email.trim());
      setMessage(result.message);
      setDevelopmentLink(result.developmentLink ?? null);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Could not request a password reset."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccountPage title="Reset your password">
      <p style={accountMessageStyle}>
        Enter your account email and we will send a reset link.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          maxLength={100}
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={accountInputStyle}
        />
        {message && <p style={accountMessageStyle}>{message}</p>}
        {developmentLink && (
          <a href={developmentLink} style={developmentLinkStyle}>
            Open development reset link
          </a>
        )}
        {errorMessage && <div style={accountErrorStyle}>{errorMessage}</div>}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            ...accountPrimaryButtonStyle,
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
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

export default ForgotPassword;
