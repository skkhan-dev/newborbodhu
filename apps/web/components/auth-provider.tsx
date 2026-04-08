"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { apiRequest } from "@/lib/api";
import {
  AuthUser,
  clearStoredAccessToken,
  persistAccessToken,
  readStoredAccessToken,
} from "@/lib/auth";

type AuthContextValue = {
  accessToken: string | null;
  user: AuthUser | null;
  isReady: boolean;
  isRefreshing: boolean;
  signIn: (accessToken: string, user?: AuthUser | null) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthMeResponse = {
  user: AuthUser;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const storedToken = readStoredAccessToken();

    async function hydrateFromStorage() {
      if (!storedToken) {
        if (!isCancelled) {
          setIsReady(true);
        }
        return;
      }

      setAccessToken(storedToken);
      setIsRefreshing(true);

      try {
        const response = await apiRequest<AuthMeResponse>("/auth/me", {
          token: storedToken,
        });

        if (!isCancelled) {
          setUser(response.user);
        }
      } catch {
        clearStoredAccessToken();

        if (!isCancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!isCancelled) {
          setIsRefreshing(false);
          setIsReady(true);
        }
      }
    }

    void hydrateFromStorage();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function refreshUser() {
    if (!accessToken) {
      setUser(null);
      setIsReady(true);
      return;
    }

    setIsRefreshing(true);

    try {
      const response = await apiRequest<AuthMeResponse>("/auth/me", {
        token: accessToken,
      });

      setUser(response.user);
    } catch (error) {
      clearStoredAccessToken();
      setAccessToken(null);
      setUser(null);
      throw error;
    } finally {
      setIsRefreshing(false);
      setIsReady(true);
    }
  }

  async function signIn(nextAccessToken: string, nextUser?: AuthUser | null) {
    persistAccessToken(nextAccessToken);
    setAccessToken(nextAccessToken);
    setIsReady(true);

    if (nextUser) {
      setUser(nextUser);
      return;
    }

    setIsRefreshing(true);

    try {
      const response = await apiRequest<AuthMeResponse>("/auth/me", {
        token: nextAccessToken,
      });

      setUser(response.user);
    } catch (error) {
      clearStoredAccessToken();
      setAccessToken(null);
      setUser(null);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }

  function signOut() {
    clearStoredAccessToken();
    setAccessToken(null);
    setUser(null);
    setIsReady(true);
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isReady,
        isRefreshing,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
