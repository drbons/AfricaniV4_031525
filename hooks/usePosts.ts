import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '@/types/firebase';

interface UsePostsOptions {
  category?: string;
  city?: string;
  state?: string;
  limit?: number;
  isPinned?: boolean;
  isBusinessPromotion?: boolean;
}

export function usePosts(options: UsePostsOptions = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const limitCount = options.limit || 10;

  const fetchPosts = async (isLoadMore = false) => {
    setLoading(true);
    setError(null);

    try {
      const postsRef = collection(db, 'posts');
      let q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));

      // Apply filters
      if (options.category) {
        q = query(q, where('category', '==', options.category));
      }
      
      if (options.city) {
        q = query(q, where('city', '==', options.city));
      }
      
      if (options.state) {
        q = query(q, where('state', '==', options.state));
      }
      
      if (options.isPinned !== undefined) {
        q = query(q, where('isPinned', '==', options.isPinned));
      }
      
      if (options.isBusinessPromotion !== undefined) {
        q = query(q, where('isBusinessPromotion', '==', options.isBusinessPromotion));
      }

      // If loading more, start after the last document
      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const postList: Post[] = [];
      
      querySnapshot.forEach((doc) => {
        postList.push({
          id: doc.id,
          ...doc.data()
        } as Post);
      });

      // Set the last document for pagination
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      
      // Check if there are more results
      setHasMore(querySnapshot.docs.length === limitCount);

      if (isLoadMore) {
        setPosts(prev => [...prev, ...postList]);
      } else {
        setPosts(postList);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [options.category, options.city, options.state, options.isPinned, options.isBusinessPromotion, options.limit]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(true);
    }
  };

  return { posts, loading, error, hasMore, loadMore };
}