"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, startAfter, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import PostDetails from '@/components/features/PostDetails';
import { Post } from '@/types/firebase';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  const fetchPosts = async (isLoadMore = false) => {
    if (!user) return;

    try {
      const postsRef = collection(db, 'posts');
      let q;

      if (type === 'personal') {
        q = query(
          postsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      } else {
        // Community posts - we don't use user.city if it's undefined
        q = query(
          postsRef,
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      }

      if (isLoadMore && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setHasMore(false);
        if (!isLoadMore) {
          setPosts([]);
        }
        return;
      }
      
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);

      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user, type]);

  const handleLike = async (postId: string) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likeCount: increment(1)
      });

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, likeCount: (post.likeCount || 0) + 1 }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleComment = async (postId: string, comment: string) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentCount: increment(1)
      });

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                commentCount: (post.commentCount || 0) + 1,
                comments: [...(post.comments || []), comment]
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error commenting on post:', error);
      throw error;
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        shareCount: increment(1)
      });

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, shareCount: (post.shareCount || 0) + 1 }
            : post
        )
      );
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  };

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
          onComment={(comment) => handleComment(post.id, comment)}
          onLike={() => handleLike(post.id)}
          onShare={() => handleShare(post.id)}
          onBookmark={() => {
            // Handle bookmark
            console.log('Bookmark post:', post.id);
          }}
        />
      ))}

      {hasMore && (
        <button
          onClick={() => fetchPosts(true)}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md font-medium text-gray-600 transition-colors"
        >
          Load More
        </button>
      )}
    </div>
  );
}