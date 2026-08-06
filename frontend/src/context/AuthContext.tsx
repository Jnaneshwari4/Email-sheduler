import {
  createContext,
  useCallback,
  useEffect,
  type JSX,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import toast from "react-hot-toast";
import { fetchProfile, loginWithGoogleToken, logoutRequest } from "../api/auth.api";
import type { AuthUser } from "../types/auth";
import { clearAccessToken, getAccessToken, setAccessToken } from "../utils/storage";

type AuthContextValue = {
  user: AuthUser | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  loginWithToken: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      const token = getAccessToken();

      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const profile = await fetchProfile();
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar
        });
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    void initialize();
  }, []);

  const loginWithToken = useCallback(async (idToken: string) => {
    const result = await loginWithGoogleToken(idToken);
    setAccessToken(result.accessToken);
    setUser(result.user);
    toast.success("Logged in successfully");
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Keep logout resilient even if server request fails.
    } finally {
      clearAccessToken();
      setUser(null);
      toast.success("Logged out");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isInitializing,
      isAuthenticated: Boolean(user),
      loginWithToken,
      logout
    }),
    [isInitializing, loginWithToken, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
