"use client";

import { useState, useEffect } from 'react';
import { CATEGORIES, STATES } from '@/lib/data';
import BusinessCard from '@/components/shared/BusinessCard';
import { Search, Filter } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Business } from '@/types/firebase';

export default function BusinessDirectory() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBusinessId, setExpandedBusinessId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
    setSelectedCity('');
  };
  
  const cities = selectedState 
    ? STATES.find(state => state.abbreviation === selectedState)?.cities || []
    : [];
  
  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const businessesRef = collection(db, 'businesses');
        let q = query(businessesRef, orderBy('createdAt', 'desc'), limit(50));
        
        const querySnapshot = await getDocs(q);
        const businessList: Business[] = [];
        
        querySnapshot.forEach((doc) => {
          businessList.push({
            id: doc.id,
            ...doc.data()
          } as Business);
        });
        
        setBusinesses(businessList);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusinesses();
  }, []);
  
  const filteredBusinesses = businesses.filter(business => {
    // Filter by category
    if (selectedCategory && business.category !== selectedCategory) {
      return false;
    }
    
    // Filter by state
    if (selectedState && business.state !== selectedState) {
      return false;
    }
    
    // Filter by city
    if (selectedCity && business.city !== selectedCity) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        business.name.toLowerCase().includes(query) ||
        (business.description && business.description.toLowerCase().includes(query)) ||
        business.category.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  const toggleBusinessExpand = (businessId: string) => {
    if (expandedBusinessId === businessId) {
      setExpandedBusinessId(null);
    } else {
      setExpandedBusinessId(businessId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="font-bold text-xl mb-4">Business Directory</h2>
      
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search businesses..."
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="w-full sm:w-auto">
          <select
            value={selectedState}
            onChange={handleStateChange}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All States</option>
            {STATES.map((state) => (
              <option key={state.abbreviation} value={state.abbreviation}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="w-full sm:w-auto">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={!selectedState}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-24 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          Error loading businesses: {error}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBusinesses.length > 0 ? (
            filteredBusinesses.map((business) => (
              <div key={business.id} onClick={() => toggleBusinessExpand(business.id)}>
                <BusinessCard 
                  business={business} 
                  expanded={expandedBusinessId === business.id} 
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No businesses found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}