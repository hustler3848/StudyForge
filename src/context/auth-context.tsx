
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppUser } from '@/lib/types';
import { auth, firestore } from '@/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: Partial<AppUser>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleUser = async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const userDocRef = doc(firestore, `users/${firebaseUser.uid}`);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUser({
          uid: firebaseUser.uid,
          ...userData,
        } as AppUser);
      } else {
        // This is a new user, create their document
        const newAppUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
          photoURL: firebaseUser.photoURL,
          profileComplete: false, // Force new users to onboard
        };
        await setDoc(userDocRef, { ...newAppUser, createdAt: serverTimestamp() });
        setUser(newAppUser);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => {
      unsubscribe();
    }
  }, []);
  
  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle the rest
  };
  
  const signUpWithEmail = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle creating the Firestore user doc
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged will handle the rest
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  const updateUserProfile = async (profileData: Partial<AppUser>) => {
    if (user && auth.currentUser) {
        // Update Firebase Auth profile (for things like displayName)
        if (profileData.displayName && profileData.displayName !== auth.currentUser.displayName) {
            await updateProfile(auth.currentUser, { displayName: profileData.displayName });
        }

        // Update Firestore document
        const userDocRef = doc(firestore, `users/${user.uid}`);
        await setDoc(userDocRef, profileData, { merge: true });

        // Update local state
        setUser(prevUser => prevUser ? { ...prevUser, ...profileData } : null);
    }
  };

  const value = { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, logout, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
