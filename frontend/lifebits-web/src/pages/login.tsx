import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  googleLoginApi,
  loginApi,
  resendVerificationApi,
} from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import { AuthContext } from "../context/AuthContext";
import { loadGoogleIdentity } from "../utils/googleIdentity";

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5",
    padding: "20px",
    boxSizing: "border-box" as const,
  },
  card: {
    width: "min(360px, 100%)",
    padding: "24px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column" as const,
    boxSizing: "border-box" as const,
  },
  title: {
    textAlign: "center" as const,
    marginBottom: "20px",
  },
  input: {
    minHeight: "42px",
    marginBottom: "12px",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  button: {
    minHeight: "44px",
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    background: "#4CAF50",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 650,
  },
  divider: {
    margin: "16px 0",
    textAlign: "center" as const,
    color: "#6b7280",
    fontSize: "13px",
  },
  link: {
    marginTop: "12px",
    textAlign: "center" as const,
    fontSize: "14px",
  },
};

const Login = () => {
  // Keep email/password login as a fallback even after OAuth is added.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleSubmittingRef = useRef(false);

  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as
    | string
    | undefined;
  const canResendVerification =
    errorMessage === "Verify your email before signing in." &&
    email.trim().length > 0;

  useEffect(() => {
    let isActive = true;
    const buttonElement = googleButtonRef.current;

    if (!googleClientId || !buttonElement) return;

    const initializeGoogle = async () => {
      try {
        await loadGoogleIdentity();

        if (!isActive || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: (response) => {
            if (!response.credential || googleSubmittingRef.current) return;

            googleSubmittingRef.current = true;
            setErrorMessage("");
            setSuccessMessage("");
            setIsGoogleSubmitting(true);

            void googleLoginApi({ idToken: response.credential })
              .then((result) => {
                auth.login(result.token);
                navigate("/notes");
              })
              .catch((error) => {
                if (isActive) {
                  setErrorMessage(
                    getApiErrorMessage(
                      error,
                      "Could not sign in with Google. Please try again.",
                    ),
                  );
                }
              })
              .finally(() => {
                googleSubmittingRef.current = false;
                if (isActive) setIsGoogleSubmitting(false);
              });
          },
        });

        buttonElement.replaceChildren();
        window.google.accounts.id.renderButton(buttonElement, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: Math.floor(buttonElement.clientWidth),
        });
      } catch {
        if (isActive) {
          setErrorMessage("Google sign-in is temporarily unavailable.");
        }
      }
    };

    void initializeGoogle();

    return () => {
      isActive = false;
      buttonElement.replaceChildren();
      window.google?.accounts.id.cancel();
    };
  }, [auth, googleClientId, navigate]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const result = await loginApi({
        email: email.trim(),
        password,
      });

      auth.login(result.token);
      navigate("/notes");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Could not log in. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (isResendingVerification || !email.trim()) return;

    setErrorMessage("");
    setSuccessMessage("");
    setIsResendingVerification(true);

    try {
      // This helps users recover when account creation succeeded but the
      // original verification email was delayed, lost, or timed out.
      const result = await resendVerificationApi(email.trim());
      setSuccessMessage(result.message);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Could not resend the verification email. Please try again.",
        ),
      );
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleLogin} autoComplete="on">
        <h2 style={styles.title}>Login</h2>

        <div
          ref={googleButtonRef}
          aria-busy={isGoogleSubmitting}
          style={googleButtonContainerStyle}
        />

        <div style={styles.divider}>or use email</div>

        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          required
          maxLength={100}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSuccessMessage("");
          }}
        />

        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder="Password"
          autoComplete="current-password"
          required
          maxLength={128}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setSuccessMessage("");
          }}
        />

        {errorMessage && (
          <div role="alert" style={errorStyle}>
            {errorMessage}
          </div>
        )}

        {canResendVerification && (
          <button
            type="button"
            disabled={isResendingVerification}
            onClick={handleResendVerification}
            style={{
              ...resendVerificationButtonStyle,
              cursor: isResendingVerification ? "wait" : "pointer",
              opacity: isResendingVerification ? 0.72 : 1,
            }}
          >
            {isResendingVerification
              ? "Sending verification email..."
              : "Resend verification email"}
          </button>
        )}

        {successMessage && (
          <div role="status" style={successStyle}>
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            ...styles.button,
            cursor: isSubmitting ? "wait" : "pointer",
            opacity: isSubmitting ? 0.72 : 1,
          }}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          style={forgotPasswordButtonStyle}
        >
          Forgot password?
        </button>

        <p style={styles.link}>
          Don't have an account?{" "}
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
        <div style={legalLinksStyle}>
          <a href="/privacy" style={{ color: "#4b5563" }}>Privacy</a>
          <span aria-hidden="true">|</span>
          <a href="/terms" style={{ color: "#4b5563" }}>Terms</a>
        </div>
      </form>
    </div>
  );
};

const errorStyle = {
  marginBottom: "12px",
  color: "#b91c1c",
  fontSize: "13px",
  lineHeight: 1.4,
} as const;

const googleButtonContainerStyle = {
  width: "100%",
  minHeight: "44px",
  marginTop: "4px",
  overflow: "hidden",
} as const;

const successStyle = {
  marginBottom: "12px",
  color: "#166534",
  fontSize: "13px",
  lineHeight: 1.4,
} as const;

const resendVerificationButtonStyle = {
  minHeight: "40px",
  marginBottom: "12px",
  padding: "9px",
  borderRadius: "6px",
  border: "1px solid #2563eb",
  background: "#ffffff",
  color: "#2563eb",
  fontWeight: 650,
} as const;

const forgotPasswordButtonStyle = {
  minHeight: "36px",
  marginTop: "8px",
  border: "none",
  background: "transparent",
  color: "#2563eb",
  cursor: "pointer",
  fontSize: "14px",
} as const;

const legalLinksStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "8px",
  marginTop: "8px",
  color: "#9ca3af",
  fontSize: "12px",
} as const;

export default Login;
