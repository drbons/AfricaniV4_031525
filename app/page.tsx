"use client";

import { useAuth } from '@/hooks/useAuth';
import CreatePost from '@/components/features/CreatePost';
import PostFeed from '@/components/features/PostFeed';
import InviteNeighbors from '@/components/features/InviteNeighbors';
import PinnedBusinesses from '@/components/features/PinnedBusinesses';
import NationwidePosts from '@/components/features/NationwidePosts';
import ValueProposition from '@/components/features/ValueProposition';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Link from 'next/link';

export default function Home() {
  const { user, loading, error } = useAuth();

  console.log('[HomePage] Rendering with auth state:', { 
    isAuthenticated: !!user, 
    loading, 
    hasError: !!error,
    userId: user?.uid
  });

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </div>
    );
  }

  // Show error state if there's an authentication error
  if (error) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <h2 className="text-lg font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      {/* Debug info - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p><strong>Debug:</strong> {user ? `Authenticated as ${user.email}` : 'Not authenticated'}</p>
          <Link href="/test-auth" className="text-blue-600 hover:underline">View Auth Test Page</Link>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content - Feed */}
        <div className="w-full lg:w-[60%]">
          {!user && <ValueProposition />}
          
          {user && (
            <>
              <CreatePost />
              
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-4">My Posts</h2>
                <PostFeed type="personal" />
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Community Feed</h2>
                <PostFeed type="community" />
              </div>
            </>
          )}
        </div>
        
        {/* Right sidebar */}
        <div className="w-full lg:w-[25%] space-y-6">
          <InviteNeighbors />
          <PinnedBusinesses />
          <NationwidePosts />
        </div>
      </div>
    </div>
  );
}