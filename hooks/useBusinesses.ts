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
import { Business } from '@/types/firebase';

interface UseBusinessesOptions {
  category?: string;
  city?: string;
  state?: string;
  limit?: number;
  isPinned?: boolean;
}

export function useBusinesses(options: UseBusinessesOptions = {}) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const limitCount = options.limit || 10;

  const fetchBusinesses = async (isLoadMore = false) => {
    setLoading(true);
    setError(null);

    try {
      const businessesRef = collection(db, 'businesses');
      let q = query(businessesRef, orderBy('createdAt', 'desc'), limit(limitCount));

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

      // If loading more, start after the last document
      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const businessList: Business[] = [];
      
      querySnapshot.forEach((doc) => {
        businessList.push({
          id: doc.id,
          ...doc.data()
        } as Business);
      });

      // Set the last document for pagination
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      
      // Check if there are more results
      setHasMore(querySnapshot.docs.length === limitCount);

      if (isLoadMore) {
        setBusinesses(prev => [...prev, ...businessList]);
      } else {
        setBusinesses(businessList);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [options.category, options.city, options.state, options.isPinned, options.limit]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchBusinesses(true);
    }
  };

  return { businesses, loading, error, hasMore, loadMore };
}