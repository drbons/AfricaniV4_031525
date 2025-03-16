"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import FilterSidebar from '@/components/marketplace/FilterSidebar';
import ListingsFeed from '@/components/marketplace/ListingsFeed';
import SeedMarketplace from '@/components/marketplace/SeedMarketplace';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function MarketplacePage() {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'date',
    sortDirection: 'desc'
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Function to handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Get user's location for distance calculation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Show loading state while auth state is being determined
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-500">Loading marketplace...</p>
      </div>
    );
  }

  // Prompt user to sign in if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Sign in to access the marketplace</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          You need to sign in to your account to view and post listings on our marketplace.
        </p>
        <Button 
          onClick={() => router.push('/auth')}
          className="bg-[#00FF4C] hover:bg-green-400 text-black font-medium"
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <MarketplaceHeader />
      </div>
      
      {/* Post Button (Mobile) */}
      <div className="md:hidden mb-6">
        <Link href="/marketplace/new-listing">
          <Button className="w-full bg-[#00FF4C] hover:bg-green-400 text-black font-medium">
            <PlusCircle className="h-5 w-5 mr-2" />
            Post an Item
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          {/* Seed Marketplace Component */}
          <SeedMarketplace />
          
          <FilterSidebar 
            filters={filters} 
            onFilterChange={handleFilterChange} 
          />
          
          {/* Post Button (Desktop) */}
          <div className="hidden md:block mt-6">
            <Link href="/marketplace/new-listing">
              <Button className="w-full bg-[#00FF4C] hover:bg-green-400 text-black font-medium">
                <PlusCircle className="h-5 w-5 mr-2" />
                Post an Item
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          <ListingsFeed filters={filters} userLocation={userLocation} />
        </div>
      </div>
    </div>
  );
} 