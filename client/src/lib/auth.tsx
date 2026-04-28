/**
 * AuthContext — cookie-free session management.
 *
 * The server issues a random token on login/register.
 * We store it in React state (never localStorage/sessionStorage — those are
 * blocked in sandboxed iframes). Every API call sends it as X-Session-Token.
 */
import { createContext, useContext, useState, useCallback } from "react";
import { setSessionToken, queryClient } from "@/lib/queryClient";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  bbBalance: number;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = useCallback((newUser: AuthUser, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    setSessionToken(newToken); // sync to module-level so apiRequest picks it up
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setSessionToken(null);
    queryClient.clear();
  }, []);

  const updateUser = useCallback((updated: AuthUser) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
