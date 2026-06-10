import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import {
  AUTH_EXPIRED_EVENT,
  clearStoredToken,
  getAuthProfile,
  getValidStoredToken,
  storeToken,
} from "../utils/authToken";

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [token, setToken] = useState<string | null>(() => getValidStoredToken());

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
  }, []);

  const login = useCallback((newToken: string) => {
    storeToken(newToken);
    setToken(newToken);
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "token") return;

      setToken(getValidStoredToken());
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
      window.removeEventListener("storage", handleStorage);
    };
  }, [logout]);

  const value = useMemo(
    () => {
      const profile = getAuthProfile(token);

      return {
        token,
        setToken,
        isAuthenticated: Boolean(token),
        email: profile.email,
        isEmailVerified: profile.isEmailVerified,
        login,
        logout,
      };
    },
    [login, logout, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
