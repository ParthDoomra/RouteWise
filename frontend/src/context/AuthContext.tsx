import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'manager' | 'driver';

export interface AuthState {
  token: string | null;
  role: UserRole | null;
  displayName: string | null;
  userId: number | null;
}

export interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  login: (token: string, role: UserRole, displayName: string, userId: number) => void;
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'routewise_auth';
const TOKEN_STORAGE_KEY = 'routewise_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token && (parsed?.role === 'manager' || parsed?.role === 'driver')) {
          return {
            token: parsed.token,
            role: parsed.role,
            displayName: parsed.displayName || (parsed.role === 'manager' ? 'Operations Manager' : 'Driver'),
            userId: parsed.userId ?? null,
          };
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
    return {
      token: null,
      role: null,
      displayName: null,
      userId: null,
    };
  });

  const login = (token: string, role: UserRole, displayName: string, userId: number) => {
    const newSession: AuthState = {
      token,
      role,
      displayName,
      userId,
    };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // Ignore localStorage errors
    }
    setAuthState(newSession);
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
    setAuthState({
      token: null,
      role: null,
      displayName: null,
      userId: null,
    });
  };

  // Sync state if storage changes across tabs or windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        if (!e.newValue) {
          setAuthState({ token: null, role: null, displayName: null, userId: null });
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            setAuthState({
              token: parsed.token ?? null,
              role: parsed.role ?? null,
              displayName: parsed.displayName ?? null,
              userId: parsed.userId ?? null,
            });
          } catch {
            // Ignore parse errors
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        isAuthenticated: !!authState.token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
