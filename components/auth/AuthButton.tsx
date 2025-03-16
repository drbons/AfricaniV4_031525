"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, UserCircle, Settings, User } from 'lucide-react';
import Image from 'next/image';

export default function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debug user state
  useEffect(() => {
    console.log('[AuthButton] User state:', user ? { 
      uid: user.uid, 
      email: user.email, 
      displayName: user.displayName 
    } : 'No user');
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple sign-out attempts
    
    console.log('[AuthButton] Signing out');
    setIsSigningOut(true);
    
    try {
      await signOut();
      console.log('[AuthButton] Sign out successful');
      setShowDropdown(false);
      
      // Use a hard redirect to clear all state and prevent flickering
      window.location.href = '/auth';
    } catch (error) {
      console.error('[AuthButton] Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  const handleProfileClick = () => {
    console.log('[AuthButton] Navigating to profile page');
    router.push('/profile');
    setShowDropdown(false);
  };

  // Show a loading state if we're in the process of signing out
  if (isSigningOut) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>;
  }

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>;
  }

  if (!user) {
    console.log('[AuthButton] No user, showing sign in button');
    return (
      <button
        onClick={() => {
          console.log('[AuthButton] Sign in button clicked, navigating to auth page');
          router.push('/auth');
        }}
        className="flex items-center text-white hover:text-green-400 transition-colors"
      >
        <LogIn className="h-5 w-5 mr-1" />
        <span>Sign In</span>
      </button>
    );
  }

  console.log('[AuthButton] User authenticated, showing user menu');
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          console.log('[AuthButton] User menu clicked, toggling dropdown');
          setShowDropdown(!showDropdown);
        }}
        className="flex items-center text-white hover:text-green-400 transition-colors"
      >
        {user.photoURL ? (
          <div className="h-8 w-8 rounded-full overflow-hidden mr-2 border-2 border-green-400">
            <Image 
              src={user.photoURL} 
              alt={user.displayName || user.email || 'User'} 
              width={32} 
              height={32}
            />
          </div>
        ) : (
          <UserCircle className="h-6 w-6 mr-1" />
        )}
        <span className="max-w-[120px] truncate">
          {user.displayName || user.email?.split('@')[0] || 'User'}
        </span>
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={handleProfileClick}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </button>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}