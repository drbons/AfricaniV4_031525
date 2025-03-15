"use client";

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '@/types/firebase';
import { formatDate, truncateText } from '@/lib/utils';
import Link from 'next/link';

export default function NationwidePosts() {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const posts: Post[] = [];
        
        querySnapshot.forEach((doc) => {
          posts.push({
            id: doc.id,
            ...doc.data()
          } as Post);
        });
        
        setRecentPosts(posts);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentPosts();
  }, []);

  if (loading) {
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

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-bold text-lg mb-3">Nationwide Updates</h3>
        <div className="text-red-500">Error loading posts: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-bold text-lg mb-3">Nationwide Updates</h3>
      
      <div className="space-y-3">
        {recentPosts.length > 0 ? (
          recentPosts.map((post) => (
            <div key={post.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{post.userName}</span>
                <span className="text-xs text-gray-500">{post.city}, {post.state}</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">
                {truncateText(post.content, 80)}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {formatDate(post.createdAt)}
              </div>
            </div>
          ))
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