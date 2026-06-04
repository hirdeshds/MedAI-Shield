import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const USER_KEY = "medai-shield-user";
const TOKEN_KEY = "medai-shield-token";

export type LoginRole = "doctor" | "analyst" | "admin";

export interface AuthUser {
  username: string;
  role: LoginRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const credentials: Record<string, { password: string; role: LoginRole }> = {
  "dr-sharma": { password: "doctor123", role: "doctor" },
  "analyst-priya": { password: "analyst123", role: "analyst" },
  admin: { password: "admin123", role: "admin" },
};

function readStoredUser() {
  const storedUser = window.localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedUser) as Partial<AuthUser>;
    if (
      typeof parsed.username === "string" &&
      ["doctor", "analyst", "admin"].includes(String(parsed.role))
    ) {
      return parsed as AuthUser;
    }
    window.localStorage.removeItem(USER_KEY);
    return null;
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const login = useCallback(
    async (username: string, password: string) => {
      const normalizedUsername = username.trim().toLowerCase();
      const account = credentials[normalizedUsername];

      if (!account || account.password !== password) {
        throw new Error("Invalid username or password.");
      }

      const sessionUser = {
        username: normalizedUsername,
        role: account.role,
      };

      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
    },
    [],
  );

  const logout = useCallback(async () => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

export { TOKEN_KEY, USER_KEY };
