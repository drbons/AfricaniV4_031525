"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fetchBusinesses } from '@/lib/firebase-api';
import { BusinessProfile, BusinessFilterOptions, PaginationData } from '@/lib/types';
import { Building, AlertCircle } from 'lucide-react';
import BusinessCard from '@/components/businesses/BusinessCard';
import BusinessFilters from '@/components/businesses/BusinessFilters';
import BusinessPagination from '@/components/businesses/BusinessPagination';
import FeaturedBusinesses from '@/components/businesses/FeaturedBusinesses';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function BusinessDirectoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BusinessFilterOptions>({});
  
  // Extract URL parameters
  useEffect(() => {
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
    const category = searchParams.get('category') || '';
    const state = searchParams.get('state') || '';
    const city = searchParams.get('city') || '';
    const searchTerm = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') as 'rating' | 'name' | 'createdAt' || 'rating';
    const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc';
    
    setFilters({
      page,
      category,
      state,
      city,
      searchTerm,
      sortBy,
      sortDirection
    });
  }, [searchParams]);
  
  // Load businesses based on filters
  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchBusinesses(filters);
        setBusinesses(result.businesses);
        setPagination(result.pagination);
      } catch (err: any) {
        console.error('Error fetching businesses:', err);
        setError(err.message || 'Failed to load businesses');
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      loadBusinesses();
    }
  }, [filters, authLoading]);
  
  // Update URL with filters
  const updateUrlWithFilters = (newFilters: BusinessFilterOptions) => {
    const params = new URLSearchParams();
    
    if (newFilters.page && newFilters.page > 1) {
      params.set('page', newFilters.page.toString());
    }
    
    if (newFilters.category) {
      params.set('category', newFilters.category);
    }
    
    if (newFilters.state) {
      params.set('state', newFilters.state);
    }
    
    if (newFilters.city) {
      params.set('city', newFilters.city);
    }
    
    if (newFilters.searchTerm) {
      params.set('search', newFilters.searchTerm);
    }
    
    if (newFilters.sortBy && newFilters.sortBy !== 'rating') {
      params.set('sortBy', newFilters.sortBy);
    }
    
    if (newFilters.sortDirection && newFilters.sortDirection !== 'desc') {
      params.set('sortDirection', newFilters.sortDirection);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(url);
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: BusinessFilterOptions) => {
    const updatedFilters = { ...newFilters, page: 1 }; // Reset to first page on filter change
    updateUrlWithFilters(updatedFilters);
  };
  
  // Handle page changes
  const handlePageChange = (page: number) => {
    updateUrlWithFilters({ ...filters, page });
  };
  
  // If not authenticated
  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Business Directory</h1>
          <p className="text-gray-600 mb-6">Please sign in to explore our business directory.</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-[#00FF4C] hover:bg-green-400 text-black font-bold py-2 px-4 rounded"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-8">Business Directory</h1>
      
      {/* Featured Businesses */}
      {filters.page === 1 && !filters.category && !filters.searchTerm && (
        <FeaturedBusinesses />
      )}
      
      {/* Filters */}
      <BusinessFilters
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />
      
      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-6 my-8">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Error loading businesses</h3>
          </div>
          <p>{error}</p>
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300 my-8">
          <Building className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No businesses found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your filters or search criteria.
          </p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Showing {businesses.length} of {pagination.totalItems} businesses
              {filters.category ? ` in ${filters.category}` : ''}
              {filters.city ? ` in ${filters.city}` : ''}
              {filters.state ? (filters.city ? `, ${filters.state}` : ` in ${filters.state}`) : ''}
              {filters.searchTerm ? ` matching "${filters.searchTerm}"` : ''}
            </p>
          </div>
          
          {/* Business Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
          
          {/* Pagination */}
          <BusinessPagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
} 