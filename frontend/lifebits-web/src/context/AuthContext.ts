import { createContext } from "react";

export interface AuthContextValue {
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  isAuthenticated: boolean;
  email: string | null;
  isEmailVerified: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  setToken: () => {},
  isAuthenticated: false,
  email: null,
  isEmailVerified: false,
  login: () => {},
  logout: () => {},
});
