'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  QueryConstraint, 
  DocumentData, 
  QueryDocumentSnapshot,
  Query
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UseFirestoreQueryOptions {
  collectionName: string;
  constraints?: QueryConstraint[];
  limitCount?: number;
  enabled?: boolean;
}

interface UseFirestoreQueryResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for Firestore data fetching with pagination
 * @param options - Query options
 * @returns Query result with data, loading state, error, and pagination controls
 */
export function useFirestoreQuery<T = DocumentData>({
  collectionName,
  constraints = [],
  limitCount = 10,
  enabled = true
}: UseFirestoreQueryOptions): UseFirestoreQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Create the base query
  const createQuery = useCallback((lastDocument?: QueryDocumentSnapshot<DocumentData> | null): Query<DocumentData> => {
    let baseQuery = query(
      collection(db, collectionName),
      ...constraints,
      limit(limitCount)
    );

    // Add pagination if we have a last document
    if (lastDocument) {
      baseQuery = query(
        collection(db, collectionName),
        ...constraints,
        startAfter(lastDocument),
        limit(limitCount)
      );
    }

    return baseQuery;
  }, [collectionName, constraints, limitCount]);

  // Fetch data function
  const fetchData = useCallback(async (isLoadMore = false): Promise<void> => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const q = createQuery(isLoadMore ? lastDoc : null);
      const querySnapshot = await getDocs(q);

      // Check if we have more data
      setHasMore(querySnapshot.docs.length === limitCount);

      // Save the last document for pagination
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      if (lastVisible) {
        setLastDoc(lastVisible);
      }

      // Process the data
      const newData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      // Update the data state
      if (isLoadMore) {
        setData(prevData => [...prevData, ...newData]);
      } else {
        setData(newData);
      }
    } catch (err) {
      console.error('Error fetching Firestore data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  }, [enabled, createQuery, lastDoc, limitCount]);

  // Initial data fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Load more function
  const loadMore = useCallback(async (): Promise<void> => {
    if (hasMore && !loading && lastDoc) {
      await fetchData(true);
    }
  }, [hasMore, loading, lastDoc, fetchData]);

  // Refetch function
  const refetch = useCallback(async (): Promise<void> => {
    setLastDoc(null);
    setHasMore(true);
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refetch
  };
} 