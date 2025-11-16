"use client";

import { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppUser } from '@/lib/types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: Partial<AppUser>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking auth state
    const checkAuthState = () => {
      setLoading(true);
      const storedUser = localStorage.getItem('studywise-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    checkAuthState();

    window.addEventListener('storage', checkAuthState);
    return () => {
      window.removeEventListener('storage', checkAuthState)
    }

  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    // This is a mock sign-in. In a real app, you would use Firebase Auth.
    const mockUser: AppUser = {
      uid: 'mock-uid-123',
      email: 'test.user@example.com',
      displayName: 'Test User',
      photoURL: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
      profileComplete: false,
    };
    localStorage.setItem('studywise-user', JSON.stringify(mockUser));
    setUser(mockUser);
    setLoading(false);
    router.push('/onboarding');
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem('studywise-user');
    setUser(null);
    setLoading(false);
    router.push('/login');
  };

  const updateUserProfile = (profileData: Partial<AppUser>) => {
    if (user) {
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('studywise-user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const value = { user, loading, signInWithGoogle, logout, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
