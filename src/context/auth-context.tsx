
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppUser } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
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
  const { auth, firestore, isUserLoading } = useFirebase();

  useEffect(() => {
    if (isUserLoading) {
      setLoading(true);
      return;
    }
    if (!auth.currentUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const userDocRef = doc(firestore, `users/${auth.currentUser.uid}`);
    getDoc(userDocRef).then(docSnap => {
      if (docSnap.exists()) {
        const appUser = docSnap.data() as AppUser;
        setUser(appUser);
        if (!appUser.profileComplete) {
          router.push('/onboarding');
        } else {
           if (window.location.pathname === '/onboarding' || window.location.pathname === '/signin' || window.location.pathname === '/signup') {
            router.push('/dashboard');
          }
        }
      } else {
        // This case is handled by signInWithGoogle on first login
        // but as a fallback, we can create a profile here too.
        const newUser = createUserProfileFromFirebaseUser(auth.currentUser!);
        setDoc(doc(firestore, `users/${auth.currentUser!.uid}`), newUser);
        setUser(newUser);
        router.push('/onboarding');
      }
      setLoading(false);
    }).catch(error => {
      console.error("Error fetching user document:", error);
      setLoading(false);
    });

  }, [isUserLoading, auth.currentUser, router, firestore]);

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
        // Existing user
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
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setLoading(false);
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
