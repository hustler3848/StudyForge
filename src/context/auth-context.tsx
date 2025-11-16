
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
          setUser(docSnap.data() as AppUser);
        } else {
           // This case is for a brand new user.
           // We create their profile here.
           const newAppUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              profileComplete: true, // Bypass onboarding
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
      await signInWithPopup(auth, provider);
      // After signInWithPopup resolves, the onAuthStateChanged listener above
      // will handle fetching/creating the user document and setting the user state.
      // We can now safely route to the dashboard.
      router.push('/dashboard');
    } catch (error) {
      console.error("Error during sign-in:", error);
      setUser(null);
      setLoading(false);
    } 
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null); // Clear user state immediately
    router.push('/signin'); // Redirect to sign-in page
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
