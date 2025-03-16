"use client";

import { useEffect, useState, useRef } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Business } from '@/types/firebase';
import Link from 'next/link';
import { MOCK_BUSINESSES } from '@/lib/data';

export default function PinnedBusinesses() {
  const [pinnedBusinesses, setPinnedBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallbackData, setUseFallbackData] = useState(false);
  const isMountedRef = useRef(true);
  const fetchAttemptedRef = useRef(false);

  useEffect(() => {
    // Set up cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchPinnedBusinesses = async () => {
      // Skip if we've already attempted to fetch and are using fallback data
      if (useFallbackData && fetchAttemptedRef.current) {
        return;
      }
      
      fetchAttemptedRef.current = true;
      
      if (useFallbackData) {
        // Use mock data if we're in fallback mode
        if (isMountedRef.current) {
          setPinnedBusinesses(MOCK_BUSINESSES.filter(b => b.rating === 'platinum').slice(0, 3));
          setLoading(false);
        }
        return;
      }
      
      try {
        const q = query(
          collection(db, 'businesses'),
          where('isPinned', '==', true),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        
        const querySnapshot = await getDocs(q);
        const businesses: Business[] = [];
        
        querySnapshot.forEach((doc) => {
          businesses.push({
            id: doc.id,
            ...doc.data()
          } as Business);
        });
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setPinnedBusinesses(businesses);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching pinned businesses:', err);
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setError(err.message);
          // Switch to fallback data if there's an error
          setUseFallbackData(true);
          setPinnedBusinesses(MOCK_BUSINESSES.filter(b => b.rating === 'platinum').slice(0, 3));
        }
      } finally {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };
    
    fetchPinnedBusinesses();
  }, [useFallbackData]);

  const handleTryAgain = () => {
    setLoading(true);
    setUseFallbackData(false);
    fetchAttemptedRef.current = false;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-bold text-lg mb-3">Pinned Businesses</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="font-bold text-lg mb-3">Pinned Businesses</h3>
      
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
        {pinnedBusinesses.length > 0 ? (
          pinnedBusinesses.map((business) => (
            <div key={business.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <h4 className="font-medium">{business.name}</h4>
              <p className="text-sm text-gray-600">{business.category} • {business.city}, {business.state}</p>
              <div className="flex items-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg 
                    key={i} 
                    className={`h-4 w-4 ${i < Math.floor(business.ratingScore || 0) ? 'text-yellow-500' : 'text-gray-300'} fill-current`}
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
                <span className="ml-1 text-xs text-gray-500">({business.reviewCount || 0})</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            No pinned businesses found.
          </div>
        )}
      </div>
      
      <Link href="/business-directory" className="block w-full mt-3 text-center text-blue-600 text-sm font-medium hover:underline">
        View All Pinned Businesses
      </Link>
    </div>
  );
}