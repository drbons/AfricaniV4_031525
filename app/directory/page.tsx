"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Business } from '@/types/firebase';
import { seedBusinesses } from '@/lib/seedBusinesses';
import BusinessCard from '@/components/directory/BusinessCard';
import { Filter } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function BusinessDirectory() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadBusinesses() {
      try {
        setLoading(true);
        
        // First try to seed businesses if they don't exist
        await seedBusinesses();

        // Fetch all businesses
        const businessesRef = collection(db, 'businesses');
        const businessesQuery = query(businessesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(businessesQuery);
        
        const businessesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Business[];

        setBusinesses(businessesData);
        
        // Set featured businesses
        const featured = businessesData.filter(business => business.featured);
        setFeaturedBusinesses(featured);
        
        setError(null);
      } catch (err) {
        console.error('Error loading businesses:', err);
        setError('Error loading businesses. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadBusinesses();
  }, []);

  const filteredBusinesses = businesses.filter(business => 
    business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Business Directory</h1>

      {/* Featured Businesses Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <span className="mr-2">⭐</span> Featured Businesses
        </h2>
        {error ? (
          <div className="text-red-500 p-4 rounded-lg bg-red-50">{error}</div>
        ) : featuredBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBusinesses.map(business => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No featured businesses available.</p>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search businesses by name"
            className="flex-1 p-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Filter className="h-4 w-4 mr-2" />
            Show Filters
          </button>
        </div>
      </div>

      {/* All Businesses */}
      <div>
        {filteredBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map(business => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500">No businesses found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
} 