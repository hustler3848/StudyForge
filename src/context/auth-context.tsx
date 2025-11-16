
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppUser } from '@/lib/types';
import { useFirebase } from '@/firebase';
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
  const { auth, firestore } = useFirebase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, `users/${firebaseUser.uid}`);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const appUser = docSnap.data() as AppUser;
          setUser(appUser);
          if (!appUser.profileComplete) {
            if (window.location.pathname !== '/onboarding') {
              router.push('/onboarding');
            }
          } else if (['/onboarding', '/signin', '/signup', '/login'].includes(window.location.pathname)) {
            router.push('/dashboard');
          }
        } else {
           // This case is for a user who exists in Firebase Auth but not Firestore.
           // This can happen if the doc creation failed on first login.
           // We'll treat them as a new user and send to onboarding.
           const newAppUser = createUserProfileFromFirebaseUser(firebaseUser);
           await setDoc(userDocRef, { ...newAppUser, createdAt: serverTimestamp() });
           setUser(newAppUser);
           router.push('/onboarding');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore, router]);


  const createUserProfileFromFirebaseUser = (firebaseUser: User): AppUser => ({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    profileComplete: false,
    // Initialize other fields as needed
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
        // New user
        const newAppUser = createUserProfileFromFirebaseUser(firebaseUser);
        await setDoc(userDocRef, { ...newAppUser, createdAt: serverTimestamp() });
        setUser(newAppUser);
        router.push('/onboarding');
      } else {
        // Existing user - the onAuthStateChanged listener will handle setting user state and routing
        const appUser = docSnap.data() as AppUser;
        setUser(appUser);
         if (!appUser.profileComplete) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
      setUser(null);
    } finally {
      // setLoading(false) is handled by the onAuthStateChanged listener
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    // No need to set loading to false here, onAuthStateChanged will do it
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
