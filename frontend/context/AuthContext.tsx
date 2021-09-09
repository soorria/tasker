import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
} from "react";
import { useMe } from "../api";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { User } from "../types";

export const LOCALSTORAGE_TOKEN_KEY = "tasker:token";

export type AuthContextResult = {
  token: string | null;
  user?: User | null;
  setToken: Dispatch<SetStateAction<AuthContextResult["token"]>>;
};

export const AuthContext = createContext<AuthContextResult>(null as any);

export const AuthContextProvider: React.FC = ({ children }) => {
  const [token, setToken] = useLocalStorage<string | null>(
    LOCALSTORAGE_TOKEN_KEY,
    null
  );
  const { data: user } = useMe(!!token);

  return (
    <AuthContext.Provider value={{ token, setToken, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "'useAuthContext' must be called in a component that is a child of 'AuthContextProvider'"
    );
  }

  return ctx;
};
