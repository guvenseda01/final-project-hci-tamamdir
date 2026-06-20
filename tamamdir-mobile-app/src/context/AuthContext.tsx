import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import api from "../lib/api";
import type { User } from "../data/types";

interface ApiUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_verified: 0 | 1;
  department: string | null;
  bio: string | null;
  rating: number;
  review_count: number;
}

function mapUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    department: u.department ?? "",
    year: "",
    avatar: u.avatar_url ?? "",
    verified: u.is_verified === 1,
    rating: u.rating ?? 0,
    completedServices: 0,
    activeServices: 0,
  };
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateAvatar: (dataUrl: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateAvatar: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const data: ApiUser = await api.get('/api/auth/me');
    setUser(mapUser(data));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    fetchMe()
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, [fetchMe]);

  async function login(email: string, password: string) {
    const data = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    const mapped = mapUser(data.user);
    const savedAvatar = localStorage.getItem('avatar');
    setUser(savedAvatar ? { ...mapped, avatar: savedAvatar } : mapped);
  }

  async function register(name: string, email: string, password: string) {
    await api.post('/api/auth/register', { full_name: name, email, password });
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('avatar');
    setUser(null);
  }

  function updateAvatar(dataUrl: string) {
    localStorage.setItem('avatar', dataUrl);
    setUser((prev) => prev ? { ...prev, avatar: dataUrl } : prev);
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, login, register, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
