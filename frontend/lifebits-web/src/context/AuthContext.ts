import { createContext } from "react";

export interface AuthContextValue {
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  setToken: () => {},
});
