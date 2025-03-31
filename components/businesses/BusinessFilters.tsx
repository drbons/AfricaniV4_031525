import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { BusinessFilterOptions } from '@/lib/types';
import { STATES } from '@/lib/data';

// Business category options
const BUSINESS_CATEGORIES = [
  "Restaurants & Food Services",
  "Retail",
  "Health & Wellness",
  "Home Services",
  "Automotive",
  "Professional Services",
  "Beauty & Personal Care",
  "Education & Childcare",
  "Entertainment & Recreation",
  "Pets & Veterinary",
  "Travel & Hospitality",
  "Construction & Trades",
  "Events & Party Services", 
  "Nonprofits & Community Services",
  "Other"
];

interface BusinessFiltersProps {
  onFilterChange: (filters: BusinessFilterOptions) => void;
  initialFilters?: BusinessFilterOptions;
}

export default function BusinessFilters({ onFilterChange, initialFilters = {} }: BusinessFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
  const [category, setCategory] = useState(initialFilters.category || '');
  const [state, setState] = useState(initialFilters.state || '');
  const [city, setCity] = useState(initialFilters.city || '');
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'rating');
  const [sortDirection, setSortDirection] = useState(initialFilters.sortDirection || 'desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Get cities based on selected state
  const cities = state 
    ? STATES.find(s => s.abbreviation === state)?.cities || [] 
    : [];
  
  // Apply filters on change
  useEffect(() => {
    const filters: BusinessFilterOptions = {};
    
    if (searchTerm.trim()) filters.searchTerm = searchTerm.trim();
    if (category) filters.category = category;
    if (state) filters.state = state;
    if (city) filters.city = city;
    
    filters.sortBy = sortBy as 'rating' | 'name' | 'createdAt';
    filters.sortDirection = sortDirection as 'asc' | 'desc';
    
    onFilterChange(filters);
  }, [searchTerm, category, state, city, sortBy, sortDirection, onFilterChange]);
  
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(e.target.value);
    setCity(''); // Reset city when state changes
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setCategory('');
    setState('');
    setCity('');
    setSortBy('rating');
    setSortDirection('desc');
  };
  
  const filtersApplied = !!(searchTerm || category || state || city);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
          placeholder="Search businesses by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Filter Toggle */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        
        {filtersApplied && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-500"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </button>
        )}
      </div>
      
      {/* Filter Options */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          
          {/* State Filter */}
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select
              id="state"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm"
              value={state}
              onChange={handleStateChange}
            >
              <option value="">All States</option>
              {STATES.map((s) => (
                <option key={s.abbreviation} value={s.abbreviation}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* City Filter */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <select
              id="city"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm disabled:bg-gray-100"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!state}
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort Options */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <div className="flex gap-2">
              <select
                id="sort"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating">Rating</option>
                <option value="name">Name</option>
                <option value="createdAt">Newest</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 