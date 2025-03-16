"use client";

import { useState, useRef, useEffect } from 'react';
import { orderBy, limit } from 'firebase/firestore';
import { Post } from '@/types/firebase';
import { formatDate, truncateText } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFirestoreQuery } from '@/hooks/useFirestoreQuery';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { MOCK_POSTS } from '@/lib/data';

export default function NationwidePosts() {
  const [useFallbackData, setUseFallbackData] = useState(false);
  const initialRenderRef = useRef(true);
  const [displayPosts, setDisplayPosts] = useState<Post[]>([]);
  
  const { 
    data: recentPosts, 
    loading, 
    error, 
    hasMore, 
    loadMore,
    refetch
  } = useFirestoreQuery<Post>({
    collectionName: 'posts',
    constraints: [orderBy('createdAt', 'desc')],
    limitCount: 5,
    enabled: !useFallbackData // Only run the query if we're not using fallback data
  });

  // Handle data changes with a stable reference
  useEffect(() => {
    // Skip the first render to prevent flickering
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    // If there's an error and we're not already using fallback data, switch to fallback data
    if (error && !useFallbackData && recentPosts.length === 0) {
      console.error('Error loading posts, switching to fallback data:', error);
      setUseFallbackData(true);
      setDisplayPosts(MOCK_POSTS.slice(0, 5));
      return;
    }

    // Update display posts only if we have real data and aren't using fallback
    if (!useFallbackData && recentPosts.length > 0) {
      setDisplayPosts(recentPosts);
    }
  }, [recentPosts, error, useFallbackData]);

  // Initialize with fallback data if needed
  useEffect(() => {
    if (useFallbackData) {
      setDisplayPosts(MOCK_POSTS.slice(0, 5));
    }
  }, [useFallbackData]);

  // Handle switching back to real data
  const handleTryAgain = () => {
    setUseFallbackData(false);
    refetch();
  };

  if (loading && displayPosts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-bold text-lg mb-3">Nationwide Updates</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between mb-1">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-bold text-lg mb-3">Nationwide Updates</h3>
      
      {useFallbackData && (
        <div className="bg-yellow-50 text-yellow-800 text-xs p-2 mb-3 rounded">
          Using demo data. 
          <button 
            onClick={handleTryAgain}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}
      
      <div className="space-y-3">
        {displayPosts.length > 0 ? (
          <>
            {displayPosts.map((post) => (
              <div key={post.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{post.userName || 'Anonymous'}</span>
                  <span className="text-xs text-gray-500">{post.city || 'Unknown'}, {post.state || 'Unknown'}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {truncateText(post.content || '', 80)}
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(post.createdAt)}
                </div>
              </div>
            ))}
            
            {!useFallbackData && hasMore && (
              <Button 
                onClick={() => loadMore()}
                variant="ghost" 
                className="w-full text-blue-600 hover:text-blue-800"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Loading...
                  </div>
                ) : 'Load More'}
              </Button>
            )}
            
            {error && !useFallbackData && (
              <div className="text-red-500 text-sm mt-2">
                Error loading more posts: {error.message}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No posts found.
          </div>
        )}
      </div>
      
      <Link href="/" className="block w-full mt-3 text-center text-blue-600 text-sm font-medium hover:underline">
        View All Updates
      </Link>
    </div>
  );
}