import { createContext } from "react";

export interface AuthContextValue {
  token: string | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  email: string | null;
  isEmailVerified: boolean;
  login: (token: string) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  isInitializing: true,
  isAuthenticated: false,
  email: null,
  isEmailVerified: false,
  login: () => {},
  logout: async () => {},
});
