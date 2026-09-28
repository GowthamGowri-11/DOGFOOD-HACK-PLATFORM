'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '@/components/ui/TopNavbar';
import { UserRole } from '@/components/ui/Sidebar';
import { AuthPromptModal, AuthActionType } from '@/components/ui/AuthPromptModal';

export interface AuthModalOptions {
  actionType?: AuthActionType;
  title?: string;
  reason?: string;
  redirectUrl?: string;
}

export interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalOptions: AuthModalOptions;
  refreshAuth: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const getCachedUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('dogfood_auth_user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const getCachedRole = (): UserRole => {
  if (typeof window === 'undefined') return 'PARTICIPANT';
  try {
    const r = localStorage.getItem('dogfood_auth_role');
    if (r && ['ADMIN', 'ORGANIZER', 'JUDGE', 'PARTICIPANT'].includes(r.toUpperCase())) {
      return r.toUpperCase() as UserRole;
    }
  } catch {}
  return 'PARTICIPANT';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getCachedUser);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentRole, setCurrentRoleState] = useState<UserRole>(getCachedRole);

  const setCurrentRole = useCallback((role: UserRole) => {
    setCurrentRoleState(role);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dogfood_auth_role', role);
      } catch {}
    }
  }, []);

  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalOptions, setAuthModalOptions] = useState<AuthModalOptions>({});

  const refreshAuth = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch('/api/v1/auth/me');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          const u: AuthUser = json.data.user;
          setCurrentUser(u);
          const r = (u.role?.toUpperCase() || 'PARTICIPANT') as UserRole;
          setCurrentRoleState(r);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('dogfood_auth_user', JSON.stringify(u));
              localStorage.setItem('dogfood_auth_role', r);
            } catch {}
          }
          return u;
        }
      }
      setCurrentUser(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('dogfood_auth_user');
          localStorage.removeItem('dogfood_auth_role');
        } catch {}
      }
      return null;
    } catch {
      // If network fails temporarily, keep cached user if present to prevent UI flashing
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const openAuthModal = useCallback((options?: AuthModalOptions) => {
    setAuthModalOptions(options || { actionType: 'general' });
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('dogfood_auth_user');
          localStorage.removeItem('dogfood_auth_role');
        } catch {}
      }
      setCurrentUser(null);
      setCurrentRoleState('PARTICIPANT');
      window.location.href = '/';
    }
  }, []);

  const isAuthenticated = !authLoading && currentUser !== null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        authLoading,
        currentRole,
        setCurrentRole,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalOptions,
        refreshAuth,
        logout,
      }}
    >
      {children}
      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        actionType={authModalOptions.actionType}
        title={authModalOptions.title}
        reason={authModalOptions.reason}
        redirectUrl={authModalOptions.redirectUrl}
        onSuccessLogin={() => {
          refreshAuth();
        }}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
