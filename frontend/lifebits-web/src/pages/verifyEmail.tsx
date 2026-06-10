import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmailApi } from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import AccountPage from "../components/AccountPage";
import {
  accountErrorStyle,
  accountLinkButtonStyle,
  accountMessageStyle,
} from "../components/accountStyles";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [message, setMessage] = useState(
    token ? "Verifying your email..." : "",
  );
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "This verification link is missing its token.",
  );
  const [isComplete, setIsComplete] = useState(!token);

  useEffect(() => {
    if (!token) return;

    verifyEmailApi(token)
      .then((result) => {
        setMessage(result.message);
      })
      .catch((error) => {
        setMessage("");
        setErrorMessage(
          getApiErrorMessage(error, "Could not verify this email address."),
        );
      })
      .finally(() => setIsComplete(true));
  }, [token]);

  return (
    <AccountPage title="Verify email">
      {message && <p style={accountMessageStyle}>{message}</p>}
      {errorMessage && <div style={accountErrorStyle}>{errorMessage}</div>}
      {isComplete && (
        <button
          type="button"
          style={accountLinkButtonStyle}
          onClick={() => navigate("/login")}
        >
          Continue to login
        </button>
      )}
    </AccountPage>
  );
};

export default VerifyEmail;
