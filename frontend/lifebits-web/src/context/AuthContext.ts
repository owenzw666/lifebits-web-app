import { createContext } from "react";

export interface AuthContextValue {
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  setToken: () => {},
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});
