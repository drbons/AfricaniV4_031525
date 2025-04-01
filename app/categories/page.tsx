"use client";

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Business } from '@/types/firebase';
import { seedBusinesses } from '@/lib/seedBusinesses';
import BusinessCard from '@/components/directory/BusinessCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Link from 'next/link';

export default function CategoriesPage() {
  const [businessesByCategory, setBusinessesByCategory] = useState<Record<string, Business[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

        // Group businesses by category
        const grouped = businessesData.reduce((acc, business) => {
          const category = business.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(business);
          return acc;
        }, {} as Record<string, Business[]>);

        setBusinessesByCategory(grouped);
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

  // Filter categories and businesses based on search term
  const filteredCategories = Object.entries(businessesByCategory)
    .filter(([category, businesses]) => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return category.toLowerCase().includes(lowerSearchTerm) ||
        businesses.some(business => 
          business.name.toLowerCase().includes(lowerSearchTerm) ||
          business.description.toLowerCase().includes(lowerSearchTerm)
        );
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Business Categories</h1>
        <Link 
          href="/directory"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Businesses
        </Link>
      </div>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search categories or businesses..."
          className="w-full p-2 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error ? (
        <div className="text-red-500 p-4 rounded-lg bg-red-50">{error}</div>
      ) : filteredCategories.length > 0 ? (
        <div className="space-y-12">
          {filteredCategories.map(([category, businesses]) => (
            <div key={category}>
              <h2 className="text-2xl font-semibold mb-6">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map(business => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-500">No categories or businesses found</p>
          <p className="text-gray-400 text-sm">Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
} 