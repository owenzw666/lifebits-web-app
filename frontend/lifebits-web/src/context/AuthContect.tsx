import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { logoutApi, refreshSessionApi } from "../api/authApi";
import { AuthContext } from "./AuthContext";
import {
  AUTH_EXPIRED_EVENT,
  AUTH_TOKEN_CHANGED_EVENT,
  getAccessToken,
  getAuthProfile,
  setAccessToken,
} from "../utils/authToken";

interface Props {
  children: ReactNode;
}

let sessionRestorePromise: ReturnType<typeof refreshSessionApi> | null = null;

const restoreSessionOnce = () => {
  if (!sessionRestorePromise) {
    // React StrictMode mounts effects twice in development. Sharing the request
    // prevents both mounts from trying to rotate the same refresh cookie.
    sessionRestorePromise = refreshSessionApi().finally(() => {
      sessionRestorePromise = null;
    });
  }

  return sessionRestorePromise;
};

export const AuthProvider = ({ children }: Props) => {
  const [token, setTokenState] = useState<string | null>(getAccessToken);
  const [isInitializing, setIsInitializing] = useState(true);

  const login = useCallback((newToken: string) => {
    setAccessToken(newToken);
    setTokenState(newToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      setAccessToken(null);
      setTokenState(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const result = await restoreSessionOnce();

        if (isMounted) {
          login(result.token);
        }
      } catch {
        if (isMounted) {
          setAccessToken(null);
          setTokenState(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [login]);

  useEffect(() => {
    const syncToken = () => {
      setTokenState(getAccessToken());
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, syncToken);
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, syncToken);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, syncToken);
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, syncToken);
    };
  }, []);

  const value = useMemo(() => {
    const profile = getAuthProfile(token);

    return {
      token,
      isInitializing,
      isAuthenticated: Boolean(token),
      email: profile.email,
      isEmailVerified: profile.isEmailVerified,
      login,
      logout,
    };
  }, [isInitializing, login, logout, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
