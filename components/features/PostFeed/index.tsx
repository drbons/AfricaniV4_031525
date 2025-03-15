"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import PostDetails from '@/components/features/PostDetails';
import { Post } from '@/types/firebase';
import { Loader2 } from 'lucide-react';

interface PostFeedProps {
  type: 'personal' | 'community';
}

export default function PostFeed({ type }: PostFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);

  const fetchPosts = async (isLoadMore = false) => {
    if (!user) return;

    try {
      const postsRef = collection(db, 'posts');
      let q = query(
        postsRef,
        type === 'personal' ? where('userId', '==', user.uid) : where('city', '==', user.city),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      if (isLoadMore && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(!snapshot.empty && snapshot.docs.length === 10);

      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user, type]);

  if (!user) return null;

  if (loading && !posts.length) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-lg">
        Error loading posts: {error}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        {type === 'personal' ? 'You haven\'t created any posts yet.' : 'No posts in your area yet.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostDetails
          key={post.id}
          post={post}
          onComment={async (comment) => {
            // Handle comment
          }}
          onLike={async () => {
            // Handle like
          }}
          onShare={async () => {
            // Handle share
          }}
          onBookmark={async () => {
            // Handle bookmark
          }}
        />
      ))}
      
      {hasMore && (
        <button
          onClick={() => fetchPosts(true)}
          className="w-full py-3 text-center text-blue-500 hover:text-blue-600 font-medium"
        >
          Load More
        </button>
      )}
    </div>
  );
}