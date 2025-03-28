"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, getDocs, limit, startAfter, DocumentData, QueryDocumentSnapshot, Query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Listing } from '@/types/marketplace';
import ListingCard from './ListingCard';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListingsFeedProps {
  filters: {
    category: string;
    condition: string;
    minPrice: string;
    maxPrice: string;
    sortBy: string;
    sortDirection: string;
  };
  userLocation?: { lat: number; lng: number } | null;
}

export default function ListingsFeed({ filters, userLocation }: ListingsFeedProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Function to build the query based on filters
  const buildQuery = (isLoadMore = false) => {
    const listingsRef = collection(db, 'listings');
    let constraints: any[] = [];
    
    // Always filter for active listings
    constraints.push(where('status', '==', 'active'));
    
    // Apply category filter if specified
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    
    // Apply condition filter if specified
    if (filters.condition) {
      constraints.push(where('condition', '==', filters.condition));
    }
    
    // Apply sorting
    let sortField = 'createdAt';
    if (filters.sortBy === 'price') sortField = 'price';
    if (filters.sortBy === 'title') sortField = 'title';
    
    const sortDirection = filters.sortDirection === 'asc' ? 'asc' : 'desc';
    constraints.push(orderBy(sortField, sortDirection as 'asc' | 'desc'));
    
    // For pagination
    if (isLoadMore && lastVisible) {
      return query(listingsRef, ...constraints, startAfter(lastVisible), limit(10));
    }
    
    return query(listingsRef, ...constraints, limit(10));
  };

  // Function to fetch listings
  const fetchListings = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      
      const q = buildQuery(isLoadMore);
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty && !isLoadMore) {
        setListings([]);
        setHasMore(false);
        return;
      }
      
      const newListings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Process the listing data to ensure it's in the correct format
        return { 
          id: doc.id, 
          ...data,
          // Ensure createdAt and updatedAt are properly handled
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Listing;
      });
      
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.docs.length === 10); // If we got less than the limit, there are no more to load
      
      if (isLoadMore) {
        setListings(prev => [...prev, ...newListings]);
      } else {
        setListings(newListings);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to load listings. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Apply price filters client-side to avoid complex Firestore queries
  const applyPriceFilters = (listings: Listing[]) => {
    let filtered = [...listings];
    
    const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : 0;
    const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
    
    if (minPrice > 0 || (maxPrice && maxPrice < Infinity)) {
      filtered = filtered.filter(listing => {
        const price = listing.price || 0;
        return price >= minPrice && price <= maxPrice;
      });
    }
    
    return filtered;
  };

  // Load listings when filters change
  useEffect(() => {
    fetchListings();
  }, [filters.category, filters.condition, filters.sortBy, filters.sortDirection]);

  // Load more listings
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchListings(true);
    }
  };

  // Handle retry
  const handleRetry = () => {
    fetchListings();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <div className="bg-slate-50 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No listings available</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later for new listings.</p>
        </div>
      </div>
    );
  }

  // Apply price filters client-side
  const filteredListings = applyPriceFilters(listings);

  if (filteredListings.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <div className="bg-slate-50 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No listings found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later for new listings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} userLocation={userLocation} />
        ))}
      </div>
      
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button 
            onClick={handleLoadMore} 
            disabled={loadingMore}
            variant="outline"
            className="px-6"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
} 