import { createContext, useContext, useState, type ReactNode } from "react";
import { CURRENT_USER } from "../data/mockData";
import type { User } from "../data/types";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("tamamdir_auth") === "true";
  });

  const user = isLoggedIn ? CURRENT_USER : null;

  function login(_email: string) {
    localStorage.setItem("tamamdir_auth", "true");
    setIsLoggedIn(true);
  }

  function logout() {
    localStorage.removeItem("tamamdir_auth");
    setIsLoggedIn(false);
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
