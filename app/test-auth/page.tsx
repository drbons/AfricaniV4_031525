'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function TestAuthPage() {
  const { user, loading, error } = useAuth();
  const [authState, setAuthState] = useState<string>('Checking authentication...');

  useEffect(() => {
    if (loading) {
      setAuthState('Loading authentication state...');
    } else if (error) {
      setAuthState(`Authentication error: ${error}`);
    } else if (user) {
      setAuthState(`Authenticated as: ${user.email} (${user.uid})`);
      console.log('User object:', user);
    } else {
      setAuthState('Not authenticated');
    }
  }, [user, loading, error]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
        
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Authentication State:</h2>
          <p className={`${user ? 'text-green-600' : 'text-red-600'} font-medium`}>
            {authState}
          </p>
        </div>
        
        {user && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">User Details:</h2>
            <ul className="space-y-2">
              <li><strong>UID:</strong> {user.uid}</li>
              <li><strong>Email:</strong> {user.email}</li>
              <li><strong>Display Name:</strong> {user.displayName || 'Not set'}</li>
              <li><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</li>
              <li><strong>Photo URL:</strong> {user.photoURL || 'Not set'}</li>
            </ul>
          </div>
        )}
        
        <div className="flex space-x-4">
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Home
          </Link>
          
          <Link 
            href="/auth"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Go to Auth Page
          </Link>
        </div>
      </div>
    </div>
  );
} 