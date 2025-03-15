"use client";

import { useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Development mode flag - set to true to bypass Firebase authentication
const DEV_MODE = false;

// Mock user for development
const MOCK_USER = {
  uid: 'mock-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://picsum.photos/id/1/200',
  getIdToken: () => Promise.resolve('mock-token-123'),
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (DEV_MODE) {
      // In development mode, set the mock user after a short delay
      const timer = setTimeout(() => {
        setUser(MOCK_USER as unknown as User);
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }

    // In production mode, use Firebase authentication
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      if (DEV_MODE) {
        console.log('DEV MODE: Sign up successful', { email, userData });
        setUser(MOCK_USER as unknown as User);
        return MOCK_USER;
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name
      if (userData.fullName) {
        await updateProfile(user, {
          displayName: userData.fullName
        });
      }

      // Create user profile in Firestore
      await setDoc(doc(db, 'profiles', user.uid), {
        userId: user.uid,
        fullName: userData.fullName,
        city: userData.city,
        state: userData.state,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return user;
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (DEV_MODE) {
        console.log('DEV MODE: Sign in successful', { email });
        setUser(MOCK_USER as unknown as User);
        return MOCK_USER;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (DEV_MODE) {
        console.log('DEV MODE: Google sign in successful');
        setUser(MOCK_USER as unknown as User);
        return MOCK_USER;
      }
      
      const userCredential = await signInWithPopup(auth, googleProvider);
      return userCredential.user;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (DEV_MODE) {
        console.log('DEV MODE: Sign out successful');
        setUser(null);
        return;
      }
      
      await firebaseSignOut(auth);
      router.push('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut
  };
}