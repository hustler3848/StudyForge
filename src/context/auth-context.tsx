
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
  updateUserProfile: (profileData: Partial<AppUser>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, `users/${firebaseUser.uid}`);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const appUser = docSnap.data() as AppUser;
          setUser(appUser);
           if (['/onboarding', '/signin', '/signup', '/login'].includes(window.location.pathname)) {
            router.push('/dashboard');
          }
        } else {
           // This case is primarily for when a user is already logged in to Google
           // but doesn't have a profile in our app yet. signInWithGoogle handles the
           // main new user creation flow.
           const newAppUser = createUserProfileFromFirebaseUser(firebaseUser);
           await setDoc(userDocRef, { ...newAppUser, createdAt: serverTimestamp(), uid: firebaseUser.uid });
           setUser(newAppUser);
           router.push('/dashboard');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);


  const createUserProfileFromFirebaseUser = (firebaseUser: User): AppUser => ({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    profileComplete: true, // Set to true to bypass onboarding
  });
  
  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const userDocRef = doc(firestore, `users/${firebaseUser.uid}`);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        const newAppUser = createUserProfileFromFirebaseUser(firebaseUser);
        // Important: create the user doc *before* routing
        await setDoc(userDocRef, { ...newAppUser, createdAt: serverTimestamp(), uid: firebaseUser.uid });
        setUser(newAppUser);
      } else {
        // If doc exists, the onAuthStateChanged listener will handle setting the user
      }
       router.push('/dashboard');
    } catch (error) {
      console.error("Error during sign-in:", error);
      setUser(null);
      setLoading(false);
    } 
    // finally block removed as onAuthStateChanged handles the final loading state
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    router.push('/signin');
  };

  const updateUserProfile = async (profileData: Partial<AppUser>) => {
    if (auth.currentUser) {
      const userDocRef = doc(firestore, `users/${auth.currentUser.uid}`);
      await setDoc(userDocRef, profileData, { merge: true });
      setUser(prevUser => prevUser ? { ...prevUser, ...profileData } : null);
    }
  };

  const value = { user, loading, signInWithGoogle, logout, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
