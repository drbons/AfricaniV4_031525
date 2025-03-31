import { useState, useEffect } from 'react';
import { Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { BusinessProfile } from '@/lib/types';
import { fetchFeaturedBusinesses } from '@/lib/firebase-api';
import BusinessCard from './BusinessCard';

export default function FeaturedBusinesses() {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadFeaturedBusinesses = async () => {
      try {
        setLoading(true);
        const featured = await fetchFeaturedBusinesses(6);
        setBusinesses(featured);
      } catch (err: any) {
        console.error('Error loading featured businesses:', err);
        setError(err.message || 'Failed to load featured businesses');
      } finally {
        setLoading(false);
      }
    };
    
    loadFeaturedBusinesses();
  }, []);
  
  if (loading) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Award className="h-6 w-6 text-yellow-500 mr-2" />
            Featured Businesses
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md h-72 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Award className="h-6 w-6 text-yellow-500 mr-2" />
            Featured Businesses
          </h2>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
          Error loading featured businesses: {error}
        </div>
      </div>
    );
  }
  
  if (businesses.length === 0) {
    return null; // Don't show section if no featured businesses
  }
  
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Award className="h-6 w-6 text-yellow-500 mr-2" />
          Featured Businesses
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>
    </div>
  );
} 