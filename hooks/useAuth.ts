"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

// Use environment variable for development mode - set to false by default
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true' ? true : false;

// Mock user for development
const MOCK_USER = {
  uid: 'mock-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://picsum.photos/id/1/200',
  getIdToken: () => Promise.resolve('mock-token-123'),
};

// Cookie settings
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const authCheckPerformed = useRef(false);
  const redirectInProgress = useRef(false);
  
  // Helper function to update user state and set cookies
  const updateUserState = useCallback(async (currentUser: User | null) => {
    setUser(currentUser);
    
    if (currentUser) {
      // User is signed in - set cookies
      try {
        const token = await currentUser.getIdToken(true); // Force refresh token
        
        // Set cookies for middleware to detect
        Cookies.set('firebaseToken', token, COOKIE_OPTIONS);
        Cookies.set('firebaseAuth', 'true', COOKIE_OPTIONS);
        
        // For server-side compatibility
        Cookies.set('__session', JSON.stringify({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        }), COOKIE_OPTIONS);
        
        // Clear any redirect prevention cookies
        Cookies.remove('lastRedirectTime');
        
        setIsAuthenticated(true);
        logAuthState('Set auth cookies successfully');
      } catch (err) {
        console.error('Error setting auth cookies:', err);
        setIsAuthenticated(false);
      }
    } else {
      // User is signed out - clear cookies
      Cookies.remove('firebaseToken');
      Cookies.remove('firebaseAuth');
      Cookies.remove('__session');
      Cookies.remove('lastRedirectTime'); // Clear navigation control cookie
      
      setIsAuthenticated(false);
      logAuthState('Cleared auth cookies');
    }
  }, []);
  
  // Development helper for logging auth state
  const logAuthState = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Auth] ${message}`, data || '');
    }
  };

  // Handle redirect after authentication
  const handleAuthRedirect = useCallback(() => {
    if (redirectInProgress.current) return;
    
    try {
      redirectInProgress.current = true;
      
      // Check if there's a redirect cookie
      const redirectPath = Cookies.get('redirectAfterLogin');
      
      if (redirectPath && redirectPath !== '/auth') {
        logAuthState(`Redirecting to saved path: ${redirectPath}`);
        Cookies.remove('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        logAuthState('Redirecting to home page');
        router.push('/');
      }
      
      // Force a refresh to ensure the middleware picks up the new auth state
      router.refresh();
      
      // Reset redirect flag after a delay
      setTimeout(() => {
        redirectInProgress.current = false;
      }, 1000);
    } catch (err) {
      console.error('Error during redirect:', err);
      redirectInProgress.current = false;
    }
  }, [router]);

  // Set up auth state listener
  useEffect(() => {
    logAuthState('Setting up auth state listener');
    
    if (DEV_MODE) {
      // In dev mode, simulate auth with the mock user
      updateUserState(MOCK_USER as unknown as User);
      setLoading(false);
      logAuthState('DEV MODE: Using mock user');
      return () => {};
    }
    
    // Enable local persistence
    setPersistence(auth, browserLocalPersistence)
      .then(() => logAuthState('Firebase persistence set to browserLocalPersistence'))
      .catch(err => console.error('Error setting persistence:', err));
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      logAuthState('Auth state changed', { 
        isAuthenticated: !!currentUser,
        userId: currentUser?.uid
      });
      
      // Update user state and cookies
      await updateUserState(currentUser);
      
      // Mark auth check as performed
      authCheckPerformed.current = true;
      setLoading(false);
    });
    
    // Clean up the listener
    return () => unsubscribe();
  }, [updateUserState]);
  
  // Force cookie refresh on client-side navigation
  useEffect(() => {
    const refreshTokens = async () => {
      if (user && authCheckPerformed.current) {
        logAuthState('Refreshing auth token/cookies on navigation');
        try {
          const token = await user.getIdToken(true);
          Cookies.set('firebaseToken', token, COOKIE_OPTIONS);
          logAuthState('Token refreshed successfully');
        } catch (err) {
          console.error('Error refreshing token:', err);
        }
      }
    };
    
    refreshTokens();
  }, [router, user]);

  const signUp = async (
    email: string, 
    password: string, 
    userData?: { 
      fullName?: string;
      city?: string;
      state?: string;
      businessDetails?: {
        name: string;
        address: string;
        phone: string;
        hours: string;
      };
    }
  ): Promise<User> => {
    setError(null);
    try {
      logAuthState('Attempting sign up', { email });
      
      if (DEV_MODE) {
        console.log('DEV MODE: Sign up successful', { email });
        await updateUserState(MOCK_USER as unknown as User);
        logAuthState('DEV MODE sign up successful');
        
        // Handle redirect
        setTimeout(handleAuthRedirect, 500);
        
        return MOCK_USER as unknown as User;
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      logAuthState('Sign up successful', { uid: userCredential.user.uid });
      
      // Update user profile if name is provided
      if (userData?.fullName) {
        await updateProfile(userCredential.user, {
          displayName: userData.fullName
        });
        logAuthState('Updated user profile with display name', { name: userData.fullName });
      }
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      logAuthState('Sent email verification');
      
      // Create user profile document in Firestore
      await setDoc(doc(db, 'profiles', userCredential.user.uid), {
        userId: userCredential.user.uid,
        email,
        fullName: userData?.fullName || '',
        city: userData?.city || '',
        state: userData?.state || '',
        businessDetails: userData?.businessDetails || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      logAuthState('Created user profile document');
      
      // Ensure cookies are set
      await updateUserState(userCredential.user);
      
      // Handle redirect
      setTimeout(handleAuthRedirect, 500);
      
      return userCredential.user;
    } catch (error: any) {
      console.error('Error signing up:', error);
      setError(error.message);
      logAuthState('Sign up error', error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    setError(null);
    try {
      logAuthState('Attempting sign in', { email });
      
      if (DEV_MODE) {
        console.log('DEV MODE: Sign in successful', { email });
        await updateUserState(MOCK_USER as unknown as User);
        logAuthState('DEV MODE sign in successful');
        
        // Handle redirect
        setTimeout(handleAuthRedirect, 500);
        
        return MOCK_USER as unknown as User;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      logAuthState('Sign in successful', { uid: userCredential.user.uid, email: userCredential.user.email });
      
      // Ensure cookies are set immediately
      await updateUserState(userCredential.user);
      
      // Handle redirect
      setTimeout(handleAuthRedirect, 500);
      
      return userCredential.user;
    } catch (error: any) {
      console.error('Error signing in:', error);
      setError(error.message);
      logAuthState('Sign in error', error.message);
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<User> => {
    setError(null);
    try {
      logAuthState('Attempting Google sign in');
      
      if (DEV_MODE) {
        console.log('DEV MODE: Google sign in successful');
        await updateUserState(MOCK_USER as unknown as User);
        logAuthState('DEV MODE Google sign in successful');
        
        // Handle redirect
        setTimeout(handleAuthRedirect, 500);
        
        return MOCK_USER as unknown as User;
      }
      
      const userCredential = await signInWithPopup(auth, googleProvider);
      logAuthState('Google sign in successful', { uid: userCredential.user.uid, email: userCredential.user.email });
      
      // Ensure cookies are set immediately
      await updateUserState(userCredential.user);
      
      // Check if this is a new user and create profile if needed
      const userDoc = await getDoc(doc(db, 'profiles', userCredential.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'profiles', userCredential.user.uid), {
          userId: userCredential.user.uid,
          email: userCredential.user.email,
          fullName: userCredential.user.displayName || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        logAuthState('Created new user profile for Google sign in');
      }
      
      // Handle redirect
      setTimeout(handleAuthRedirect, 500);
      
      return userCredential.user;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setError(error.message);
      logAuthState('Google sign in error', error.message);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    setError(null);
    try {
      logAuthState('Attempting sign out');
      
      if (DEV_MODE) {
        console.log('DEV MODE: Sign out successful');
        await updateUserState(null);
        logAuthState('DEV MODE sign out successful');
        
        // Navigate to auth page
        router.push('/auth');
        return;
      }
      
      await firebaseSignOut(auth);
      
      // Ensure cookies are cleared immediately
      await updateUserState(null);
      
      logAuthState('Sign out successful');
      
      // Navigate to auth page after ensuring cookies are cleared
      router.push('/auth');
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError(error.message);
      logAuthState('Sign out error', error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setError(null);
    try {
      logAuthState('Attempting password reset', { email });
      
      if (DEV_MODE) {
        console.log('DEV MODE: Password reset email sent to', email);
        logAuthState('DEV MODE password reset successful');
        return;
      }
      
      await sendPasswordResetEmail(auth, email);
      logAuthState('Password reset email sent');
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      setError(error.message);
      logAuthState('Password reset error', error.message);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword
  };
}