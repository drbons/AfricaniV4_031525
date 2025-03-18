"use client";

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  getDoc,
  doc,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Search, MapPin, Phone, Globe, Building, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface BusinessSummary {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string | null;
  thumbnail: string | null;
  category?: string; // Used for search results where category might be different
  updatedAt: Timestamp;
}

export default function DirectoryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  
  const [businesses, setBusinesses] = useState<Record<string, BusinessSummary[]>>({});
  const [businessesLoading, setBusinessesLoading] = useState<Record<string, boolean>>({});
  const [businessesError, setBusinessesError] = useState<Record<string, string | null>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BusinessSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Fetch businesses for a category when it's loaded
  useEffect(() => {
    categories.forEach(category => {
      if (!businesses[category.id] && !businessesLoading[category.id]) {
        fetchBusinessesByCategory(category.id);
      }
    });
  }, [categories, businesses, businessesLoading]);
  
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    
    try {
      // For a real app, you might have a separate categories collection
      // Here we'll dynamically build the categories by querying the subcollections
      const categoriesCollection = collection(db, 'categories');
      const categoryDocs = await getDocs(categoriesCollection);
      
      const fetchedCategories: Category[] = [];
      
      for (const categoryDoc of categoryDocs.docs) {
        const categoryId = categoryDoc.id;
        
        // Count businesses in this category
        const businessesRef = collection(db, `categories/${categoryId}/businesses`);
        const businessesSnapshot = await getDocs(query(businessesRef, limit(1)));
        
        // Get count from snapshot size or from a separate counter document
        const count = businessesSnapshot.size;
        
        // Only add categories that have businesses
        if (count > 0) {
          fetchedCategories.push({
            id: categoryId,
            name: categoryId, // Using ID as name since we don't have a separate name field
            count
          });
        }
      }
      
      setCategories(fetchedCategories.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategoriesError('Failed to load business categories');
    } finally {
      setCategoriesLoading(false);
    }
  };
  
  const fetchBusinessesByCategory = async (categoryId: string, lastDoc?: QueryDocumentSnapshot<DocumentData>) => {
    setBusinessesLoading(prev => ({ ...prev, [categoryId]: true }));
    setBusinessesError(prev => ({ ...prev, [categoryId]: null }));
    
    try {
      // Query the category subcollection
      const businessesRef = collection(db, `categories/${categoryId}/businesses`);
      let q = query(
        businessesRef,
        orderBy('name'),
        limit(10)
      );
      
      // If we have a last document, use it for pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const snapshot = await getDocs(q);
      const fetchedBusinesses: BusinessSummary[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data() as BusinessSummary;
        fetchedBusinesses.push({
          id: doc.id,
          name: data.name,
          address: data.address,
          phone: data.phone,
          website: data.website,
          thumbnail: data.thumbnail,
          updatedAt: data.updatedAt,
        });
      });
      
      setBusinesses(prev => ({
        ...prev,
        [categoryId]: prev[categoryId] 
          ? [...prev[categoryId], ...fetchedBusinesses] 
          : fetchedBusinesses
      }));
    } catch (err) {
      console.error(`Error fetching businesses for category ${categoryId}:`, err);
      setBusinessesError(prev => ({ 
        ...prev, 
        [categoryId]: `Failed to load businesses for ${categoryId}` 
      }));
    } finally {
      setBusinessesLoading(prev => ({ ...prev, [categoryId]: false }));
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    setSearchError(null);
    
    try {
      // Search in the global businesses collection
      const businessesRef = collection(db, 'businesses');
      
      // Firestore doesn't support full-text search natively,
      // so we'll implement a simple prefix search on the name field
      // For more complex search requirements, consider using Algolia or ElasticSearch
      const upperBound = searchTerm.trim() + '\uf8ff'; // '\uf8ff' is a high code point to get all values starting with searchTerm
      
      // Query by name (prefix search)
      const nameQuery = query(
        businessesRef,
        where('name', '>=', searchTerm.trim()),
        where('name', '<=', upperBound),
        limit(20)
      );
      
      const nameSnapshot = await getDocs(nameQuery);
      const nameResults: BusinessSummary[] = [];
      
      nameSnapshot.forEach(doc => {
        const data = doc.data();
        nameResults.push({
          id: doc.id,
          name: data.name,
          address: data.address,
          phone: data.phone,
          website: data.website,
          thumbnail: data.images && data.images.length > 0 ? data.images[0] : null,
          category: data.category,
          updatedAt: data.updatedAt,
        });
      });
      
      // Also search by category (for exact matches)
      const categoryQuery = query(
        businessesRef,
        where('category', '==', searchTerm.trim()),
        limit(20)
      );
      
      const categorySnapshot = await getDocs(categoryQuery);
      const categoryResults: BusinessSummary[] = [];
      
      categorySnapshot.forEach(doc => {
        // Only add if not already in the name results
        if (!nameResults.some(b => b.id === doc.id)) {
          const data = doc.data();
          categoryResults.push({
            id: doc.id,
            name: data.name,
            address: data.address,
            phone: data.phone,
            website: data.website,
            thumbnail: data.images && data.images.length > 0 ? data.images[0] : null,
            category: data.category,
            updatedAt: data.updatedAt,
          });
        }
      });
      
      // Combine and sort results
      setSearchResults([...nameResults, ...categoryResults].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Error searching businesses:', err);
      setSearchError('Failed to search businesses');
    } finally {
      setSearchLoading(false);
    }
  };
  
  const BusinessCard = ({ business }: { business: BusinessSummary }) => (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-40 bg-gray-100">
        {business.thumbnail ? (
          <img
            src={business.thumbnail}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div>
          {business.category && (
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600 mb-2 inline-block">
              {business.category}
            </span>
          )}
          <h3 className="font-semibold text-lg mb-1">{business.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-2 flex items-start">
            <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            <span>{business.address}</span>
          </p>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            <p className="truncate flex items-center">
              <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
              {business.phone}
            </p>
            {business.website && (
              <p className="truncate">
                <a 
                  href={business.website}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center"
                >
                  <Globe className="h-4 w-4 mr-1 flex-shrink-0" />
                  {business.website.replace(/^https?:\/\//, '')}
                </a>
              </p>
            )}
          </div>
          
          <div className="mt-3 text-right">
            <Link
              href={`/business/${business.id}`}
              className="text-sm font-medium text-green-600 hover:text-green-800 flex items-center justify-end"
            >
              View details <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">Business Directory</h1>
      <p className="text-gray-600 mb-8">Browse local businesses by category or search for specific businesses</p>
      
      {/* Search */}
      <div className="mb-10">
        <form onSubmit={handleSearch} className="flex w-full max-w-lg mx-auto mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by business name or category..."
            className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button 
            type="submit"
            className="bg-[#00FF4C] hover:bg-green-400 text-black font-medium px-4 py-2 rounded-r-md flex items-center"
          >
            <Search className="h-5 w-5" />
            <span className="ml-1 hidden sm:inline">Search</span>
          </button>
        </form>
        
        {searchLoading && (
          <div className="flex justify-center my-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#00FF4C]" />
          </div>
        )}
        
        {searchError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
            <p>{searchError}</p>
          </div>
        )}
        
        {!searchLoading && searchTerm && searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Search Results for "{searchTerm}"</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map(business => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </div>
        )}
        
        {!searchLoading && searchTerm && searchResults.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
            <p className="text-gray-500 mb-4">
              We couldn't find any businesses matching "{searchTerm}"
            </p>
          </div>
        )}
      </div>
      
      {/* Categories */}
      <h2 className="text-2xl font-semibold mb-6">Browse by Category</h2>
      
      {categoriesLoading && (
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#00FF4C]" />
        </div>
      )}
      
      {categoriesError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
          <p>{categoriesError}</p>
        </div>
      )}
      
      {!categoriesLoading && categories.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Building className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No categories found</h3>
          <p className="text-gray-500 mb-4">
            There are no business categories available at the moment
          </p>
        </div>
      )}
      
      {categories.map(category => (
        <div key={category.id} className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">{category.name}</h3>
            <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {category.count} {category.count === 1 ? 'business' : 'businesses'}
            </span>
          </div>
          
          {businessesLoading[category.id] && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-[#00FF4C]" />
            </div>
          )}
          
          {businessesError[category.id] && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{businessesError[category.id]}</p>
            </div>
          )}
          
          {!businessesLoading[category.id] && businesses[category.id] && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses[category.id].map(business => (
                <BusinessCard key={business.id} business={{...business, category: category.name}} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 