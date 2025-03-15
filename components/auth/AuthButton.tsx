"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, UserCircle, Settings, User } from 'lucide-react';
import Image from 'next/image';

export default function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
    await signOut();
    setShowDropdown(false);
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setShowDropdown(false);
  };

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>;
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push('/auth')}
        className="flex items-center text-white hover:text-green-400 transition-colors"
      >
        <LogIn className="h-5 w-5 mr-1" />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
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
              className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}