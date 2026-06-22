import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteAccountApi } from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import AccountPage from "../components/AccountPage";
import { AuthContext } from "../context/AuthContext";

const Account = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    await auth.logout();
    navigate("/login", { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (confirmation !== "DELETE" || isDeleting) return;

    setErrorMessage("");
    setIsDeleting(true);

    try {
      await deleteAccountApi();
      await auth.logout().catch(() => undefined);
      navigate("/login", { replace: true });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Could not delete your account. Please try again.",
        ),
      );
      setIsDeleting(false);
    }
  };

  return (
    <AccountPage title="Account">
      <div style={emailLabelStyle}>Signed in as</div>
      <div style={emailStyle}>{auth.email}</div>

      <button
        type="button"
        onClick={() => navigate("/notes")}
        style={primaryButtonStyle}
      >
        Back to map
      </button>
      <button type="button" onClick={handleLogout} style={secondaryButtonStyle}>
        Logout
      </button>

      <div style={legalLinksStyle}>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </div>

      <section style={dangerSectionStyle}>
        <h2 style={dangerTitleStyle}>Delete account</h2>
        <p style={dangerTextStyle}>
          Permanently delete your places, notes, photos, and sign-in information.
          This cannot be undone.
        </p>

        {!isDeleteOpen ? (
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            style={dangerButtonStyle}
          >
            Delete account
          </button>
        ) : (
          <div>
            <label htmlFor="delete-confirmation" style={confirmationLabelStyle}>
              Type DELETE to confirm
            </label>
            <input
              id="delete-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              style={confirmationInputStyle}
            />
            {errorMessage && (
              <div role="alert" style={errorStyle}>{errorMessage}</div>
            )}
            <div style={confirmationActionsStyle}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteOpen(false);
                  setConfirmation("");
                  setErrorMessage("");
                }}
                style={cancelButtonStyle}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmation !== "DELETE" || isDeleting}
                onClick={handleDeleteAccount}
                style={{
                  ...dangerButtonStyle,
                  opacity: confirmation !== "DELETE" || isDeleting ? 0.5 : 1,
                  cursor: isDeleting ? "wait" : "pointer",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        )}
      </section>
    </AccountPage>
  );
};

const emailLabelStyle = { color: "#6b7280", fontSize: "12px" } as const;
const emailStyle = {
  margin: "2px 0 20px",
  color: "#111827",
  overflowWrap: "anywhere",
} as const;
const primaryButtonStyle = {
  width: "100%",
  minHeight: 44,
  border: "none",
  borderRadius: 7,
  background: "#2563eb",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
} as const;
const secondaryButtonStyle = {
  ...primaryButtonStyle,
  marginTop: 8,
  border: "1px solid #d1d5db",
  background: "white",
  color: "#374151",
} as const;
const legalLinksStyle = {
  display: "flex",
  justifyContent: "center",
  gap: 16,
  marginTop: 16,
  fontSize: 13,
} as const;
const dangerSectionStyle = {
  marginTop: 28,
  paddingTop: 22,
  borderTop: "1px solid #e5e7eb",
} as const;
const dangerTitleStyle = {
  margin: "0 0 6px",
  color: "#991b1b",
  fontSize: 17,
} as const;
const dangerTextStyle = {
  margin: "0 0 14px",
  color: "#6b7280",
  fontSize: 13,
  lineHeight: 1.5,
} as const;
const dangerButtonStyle = {
  minHeight: 42,
  padding: "9px 13px",
  border: "1px solid #dc2626",
  borderRadius: 7,
  background: "#dc2626",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
} as const;
const confirmationLabelStyle = {
  display: "block",
  marginBottom: 6,
  color: "#374151",
  fontSize: 13,
  fontWeight: 650,
} as const;
const confirmationInputStyle = {
  width: "100%",
  minHeight: 42,
  boxSizing: "border-box" as const,
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 7,
  color: "#111827",
  background: "white",
  fontSize: 16,
} as const;
const confirmationActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 12,
} as const;
const cancelButtonStyle = {
  minHeight: 42,
  padding: "9px 13px",
  border: "1px solid #d1d5db",
  borderRadius: 7,
  background: "white",
  color: "#374151",
  cursor: "pointer",
} as const;
const errorStyle = {
  marginTop: 10,
  color: "#b91c1c",
  fontSize: 13,
  lineHeight: 1.4,
} as const;

export default Account;
