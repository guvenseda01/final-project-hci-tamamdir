import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import api from "../lib/api";
import { resolveMediaUrl } from "../lib/mediaUrl";
import type { User, UserInterest } from "../data/types";

interface ApiUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  email_verified?: boolean;
  is_verified_student?: boolean;
  department: string | null;
  year: string | null;
  bio: string | null;
  rating: number;
  review_count: number;
  completed_orders?: number;
  active_services?: number;
  interests?: UserInterest[];
}

function mapUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    department: u.department ?? "",
    year: u.year ?? "",
    bio: u.bio ?? "",
    avatar: resolveMediaUrl(u.avatar_url),
    verified: !!(u.is_verified_student ?? u.email_verified),
    rating: u.rating ?? 0,
    completedServices: u.completed_orders ?? 0,
    activeServices: u.active_services ?? 0,
    interests: u.interests ?? [],
  };
}

interface RegisterResult {
  email: string;
  expires_in_minutes?: number;
  needs_verification?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<RegisterResult>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => void;
  updateAvatar: (url: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  loading: true,
  login: async () => {},
  register: async () => ({ email: "" }),
  verifyEmail: async () => {},
  resendVerification: async () => {},
  logout: () => {},
  updateAvatar: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const data: ApiUser = await api.get("/api/auth/me");
    setUser(mapUser(data));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setLoading(false);
      return;
    }
    fetchMe()
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, [fetchMe]);

  async function login(email: string, password: string) {
    const data = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(mapUser(data.user));
  }

  async function register(name: string, email: string, password: string): Promise<RegisterResult> {
    const data = await api.post("/api/auth/register", { full_name: name, email, password });
    return {
      email: data.email ?? email,
      expires_in_minutes: data.expires_in_minutes,
      needs_verification: data.needs_verification,
    };
  }

  async function verifyEmail(email: string, code: string) {
    const data = await api.post("/api/auth/verify-email", { email, code });
    localStorage.setItem("token", data.token);
    setUser(mapUser(data.user));
  }

  async function resendVerification(email: string) {
    await api.post("/api/auth/resend-verification", { email });
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  function updateAvatar(url: string) {
    setUser((prev) => (prev ? { ...prev, avatar: resolveMediaUrl(url) } : prev));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading,
        login,
        register,
        verifyEmail,
        resendVerification,
        logout,
        updateAvatar,
        refreshUser: fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
