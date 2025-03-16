"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  limit, 
  startAfter, 
  DocumentData,
  Timestamp,
  Query,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/types/firebase';
import EventCard from './EventCard';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDays, addMonths, addWeeks, endOfDay, endOfMonth, endOfWeek, isSameDay, startOfDay, startOfMonth, startOfTomorrow, startOfWeek } from 'date-fns';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { CalendarX } from 'lucide-react';

interface FilterState {
  category: string | null;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  isFree: boolean | null;
  distance: number | null;
  sortBy: 'newest' | 'popular' | 'upcoming';
}

interface EventsFeedProps {
  filters: FilterState;
  userLocation: { lat: number; lng: number } | null;
}

export default function EventsFeed({ filters, userLocation }: EventsFeedProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  // Function to determine date range based on filters
  const getDateRange = () => {
    const now = new Date();
    const today = startOfDay(now);

    switch (filters.dateRange) {
      case 'today':
        return {
          start: today,
          end: endOfDay(now)
        };
      case 'tomorrow':
        return {
          start: startOfTomorrow(),
          end: endOfDay(addDays(now, 1))
        };
      case 'this-week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
      case 'this-weekend':
        // Assuming weekend is Saturday and Sunday
        const saturday = new Date(now);
        saturday.setDate(now.getDate() + (6 - now.getDay()));
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        return {
          start: startOfDay(saturday),
          end: endOfDay(sunday)
        };
      case 'next-week':
        return {
          start: startOfWeek(addWeeks(now, 1)),
          end: endOfWeek(addWeeks(now, 1))
        };
      case 'this-month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      default: // 'all'
        return {
          start: today,
          end: endOfMonth(addMonths(now, 6)) // Show events up to 6 months in the future
        };
    }
  };

  // Function to build the query based on filters
  const buildQuery = (isLoadMore = false): Query<DocumentData> => {
    let q = collection(db, 'events');
    const constraints: QueryConstraint[] = [];
    
    // Only show active events
    constraints.push(where('status', '==', 'active'));
    
    // Apply category filter
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    
    // Apply date range filter
    const dateRange = getDateRange();
    constraints.push(where('date', '>=', Timestamp.fromDate(dateRange.start)));
    constraints.push(where('date', '<=', Timestamp.fromDate(dateRange.end)));
    
    // Apply sorting
    let sortField = 'date';
    if (filters.sortBy === 'popularity') sortField = 'attendeeCount';
    // Note: Distance sorting is handled client-side after fetching
    
    const sortDirection = filters.sortDirection === 'asc' ? 'asc' : 'desc';
    constraints.push(orderBy(sortField, sortDirection as 'asc' | 'desc'));
    
    // If sorting by date and direction is not specified, default to ascending (upcoming events first)
    if (filters.sortBy === 'date' && !filters.sortDirection) {
      constraints.push(orderBy('date', 'asc'));
    }
    
    // For pagination
    if (isLoadMore && lastVisible) {
      return query(q, ...constraints, startAfter(lastVisible), limit(12));
    }
    
    return query(q, ...constraints, limit(12));
  };

  // Function to fetch events
  const fetchEvents = async (isLoadMore = false) => {
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
        setEvents([]);
        setHasMore(false);
        return;
      }
      
      let newEvents = querySnapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() } as Event;
      });
      
      // Client-side filtering for search query
      if (filters.searchQuery) {
        const searchTerms = filters.searchQuery.toLowerCase().split(' ');
        newEvents = newEvents.filter(event => {
          const nameMatch = event.name.toLowerCase().includes(filters.searchQuery.toLowerCase());
          const descMatch = event.description.toLowerCase().includes(filters.searchQuery.toLowerCase());
          
          // Match any of the search terms
          const termMatch = searchTerms.some(term => 
            event.name.toLowerCase().includes(term) || 
            event.description.toLowerCase().includes(term)
          );
          
          return nameMatch || descMatch || termMatch;
        });
      }
      
      // Client-side distance filtering and sorting
      if (userLocation && event.location?.coords) {
        // Calculate distance for each event
        newEvents = newEvents.map(event => {
          if (event.location?.coords && userLocation) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              event.location.coords.latitude,
              event.location.coords.longitude
            );
            return { ...event, distance };
          }
          return event;
        });
        
        // Filter by radius
        if (filters.radius) {
          const radiusMiles = parseInt(filters.radius);
          newEvents = newEvents.filter(event => {
            return event.distance ? event.distance <= radiusMiles : true;
          });
        }
        
        // Sort by distance if requested
        if (filters.sortBy === 'distance') {
          newEvents.sort((a, b) => {
            const distA = a.distance || Number.MAX_VALUE;
            const distB = b.distance || Number.MAX_VALUE;
            return filters.sortDirection === 'asc' ? distA - distB : distB - distA;
          });
        }
      }
      
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.docs.length === 12); // If we got less than the limit, there are no more to load
      
      if (isLoadMore) {
        setEvents(prev => [...prev, ...newEvents]);
      } else {
        setEvents(newEvents);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Function to calculate distance between two points (haversine formula)
  function calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in miles
    return distance;
  }

  function deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Load events when filters change
  useEffect(() => {
    fetchEvents();
  }, [filters]);

  // Load more events
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchEvents(true);
    }
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
      <div className="text-center py-10">
        <p className="text-red-500 mb-2">{error}</p>
        <Button onClick={() => fetchEvents()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow-md">
        <h3 className="font-semibold text-lg mb-2">No events found</h3>
        <p className="text-gray-500 mb-2">No events match your search criteria.</p>
        <p className="text-gray-400">Try adjusting your filters or create a new event!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} userLocation={userLocation} />
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