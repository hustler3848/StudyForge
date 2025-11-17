
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppUser } from '@/lib/types';
import { auth, firestore } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: Partial<AppUser>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userDocRef = doc(firestore, `users/${firebaseUser.uid}`);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUser(docSnap.data() as AppUser);
        } else {
           // This case is for a brand new user.
           const newAppUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              profileComplete: true, // Bypass onboarding as requested
           };
           await setDoc(userDocRef, { ...newAppUser, createdAt: serverTimestamp() });
           setUser(newAppUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle the rest.
      // After it runs, the AuthGuard will redirect to the dashboard.
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      // Let the onAuthStateChanged listener handle setting user to null
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  const updateUserProfile = async (profileData: Partial<AppUser>) => {
    if (user) {
      const userDocRef = doc(firestore, `users/${user.uid}`);
      await setDoc(userDocRef, profileData, { merge: true });
      setUser(prevUser => prevUser ? { ...prevUser, ...profileData } : null);
    }
  };

  const value = { user, loading, signInWithGoogle, logout, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
