"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  userName: string;
  userAvatar?: string;
  createdAt: any;
  mediaUrls?: string[];
}

export default function MyPostsSidebar() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyPosts = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        
        // Using the exact same query as mentioned in the error message
        const postsRef = collection(db, 'posts');
        const q = query(
          postsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );

        const snapshot = await getDocs(q);
        
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        })) as Post[];
        
        setPosts(fetchedPosts);
      } catch (err: any) {
        console.error('Error fetching my posts:', err);
        setError(err.message || 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyPosts();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="mb-8 p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Posts</h2>
        <Link href="/profile" className="text-sm font-medium text-green-600 hover:text-green-800">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Unable to load your posts.</p>
          <p className="text-xs text-gray-400 mt-1">Please try again later.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">You haven't created any posts yet.</p>
          <Link href="/" className="text-xs text-green-600 hover:text-green-800 mt-2 inline-block">
            Create your first post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="border-b pb-3 last:border-0">
              <div className="flex items-center mb-2">
                <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2">
                  <Image 
                    src={post.userAvatar || '/default-avatar.png'} 
                    alt={post.userName || 'User'} 
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{post.userName || 'Anonymous'}</p>
                  <p className="text-xs text-gray-500">
                    {post.createdAt ? formatDistanceToNow(post.createdAt, { addSuffix: true }) : 'Recently'}
                  </p>
                </div>
              </div>
              <p className="text-sm line-clamp-2">{post.content}</p>
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="mt-2">
                  <div className="relative h-20 w-full rounded-md overflow-hidden">
                    <Image 
                      src={post.mediaUrls[0]} 
                      alt="Post media" 
                      fill
                      className="object-cover"
                    />
                    {post.mediaUrls.length > 1 && (
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
                        +{post.mediaUrls.length - 1}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <Link 
                href={`/posts/${post.id}`} 
                className="text-xs text-green-600 hover:text-green-800 mt-2 inline-block"
              >
                View post
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 