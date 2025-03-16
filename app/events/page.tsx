"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EventsHeader from '@/components/events/EventsHeader';
import EventsFeed from '@/components/events/EventsFeed';
import FilterSidebar from '@/components/events/FilterSidebar';

// Filter state interface
interface FilterState {
  category: string | null;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  isFree: boolean | null;
  distance: number | null;
  sortBy: 'newest' | 'popular' | 'upcoming';
}

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('all');
  // Filter state for events
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    startDate: null,
    endDate: null,
    location: null,
    isFree: null,
    distance: null,
    sortBy: 'upcoming',
  });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Get user's location for nearby events if they grant permission
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        // Handle error or permission denied
        (error) => {
          console.log("Geolocation error or permission denied:", error);
          // Default location can be set here if needed
        }
      );
    }
  }, []);

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update filters based on tab
    if (value === 'nearby') {
      setFilters(prev => ({
        ...prev,
        distance: 50, // 50km radius for nearby events
        sortBy: 'upcoming',
      }));
    } else if (value === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setFilters(prev => ({
        ...prev,
        startDate: today,
        endDate: tomorrow,
        sortBy: 'upcoming',
      }));
    } else if (value === 'weekend') {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
      
      // Calculate days until next weekend (Friday-Sunday)
      const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 + 7 - dayOfWeek;
      const daysUntilMonday = dayOfWeek <= 0 ? 1 : 8 - dayOfWeek;
      
      const fridayDate = new Date(today);
      fridayDate.setDate(today.getDate() + daysUntilFriday);
      fridayDate.setHours(0, 0, 0, 0);
      
      const mondayDate = new Date(today);
      mondayDate.setDate(today.getDate() + daysUntilMonday);
      mondayDate.setHours(0, 0, 0, 0);
      
      setFilters(prev => ({
        ...prev,
        startDate: fridayDate,
        endDate: mondayDate,
        sortBy: 'upcoming',
      }));
    } else if (value === 'free') {
      setFilters(prev => ({
        ...prev,
        isFree: true,
        sortBy: 'upcoming',
      }));
    } else {
      // Reset filters for "all" tab
      setFilters({
        category: null,
        startDate: null,
        endDate: null,
        location: null,
        isFree: null,
        distance: null,
        sortBy: 'upcoming',
      });
    }
  };

  // Handle filter changes from sidebar
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Sign in required</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          You need to sign in to your account to view events.
        </p>
        <Link
          href="/auth"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <EventsHeader />
      
      <div className="flex justify-between items-center mb-6 mt-8">
        <h2 className="text-2xl font-bold">Discover Events</h2>
        <Button 
          onClick={() => router.push('/events/create')}
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-5 w-5" />
          Post Event
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="mb-8">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="weekend">Weekend</TabsTrigger>
          <TabsTrigger value="free">Free</TabsTrigger>
          <TabsTrigger value="nearby">Nearby</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar for filters */}
        <div className="w-full md:w-1/4">
          <FilterSidebar 
            filters={filters} 
            onChange={handleFilterChange} 
          />
        </div>
        
        {/* Main content - Events feed */}
        <div className="w-full md:w-3/4">
          <EventsFeed 
            filters={filters}
            userLocation={userLocation}
          />
        </div>
      </div>
    </div>
  );
}