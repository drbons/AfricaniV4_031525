"use client";

import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Books',
  'Vehicles',
  'Home Goods',
  'Sports & Outdoors',
  'Toys & Games',
  'Musical Instruments',
  'Office Supplies',
  'Art & Crafts',
  'Other'
];

const CONDITIONS = [
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor'
];

interface FilterSidebarProps {
  filters: {
    category: string;
    condition: string;
    minPrice: string;
    maxPrice: string;
    sortBy: string;
    sortDirection: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);
  
  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    if (window.innerWidth < 768) {
      setShowFilters(false);
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      category: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'date',
      sortDirection: 'desc'
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <>
      {/* Mobile filter toggle */}
      <div className="md:hidden mb-4">
        <Button 
          onClick={() => setShowFilters(!showFilters)}
          variant="outline" 
          className="w-full flex items-center justify-center"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Filters */}
      <div className={`bg-white rounded-lg shadow-md p-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg flex items-center">
            <SlidersHorizontal className="h-5 w-5 mr-2" />
            Filters
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearFilters}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear All
          </Button>
        </div>

        <div className="space-y-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium block mb-2">Category</label>
            <Select
              value={localFilters.category || "all"}
              onValueChange={(value) => handleFilterChange('category', value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="text-sm font-medium block mb-2">Condition</label>
            <Select
              value={localFilters.condition || "all"}
              onValueChange={(value) => handleFilterChange('condition', value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Condition</SelectItem>
                {CONDITIONS.map((condition) => (
                  <SelectItem key={condition} value={condition.toLowerCase()}>
                    {condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="text-sm font-medium block mb-2">Price Range</label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                className="w-1/2"
                value={localFilters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <span>to</span>
              <Input
                type="number"
                placeholder="Max"
                className="w-1/2"
                value={localFilters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Sort By Filter */}
          <div>
            <label className="text-sm font-medium block mb-2">Sort By</label>
            <Select
              value={localFilters.sortBy}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Date Posted" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Posted</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Direction Filter */}
          <div>
            <label className="text-sm font-medium block mb-2">Sort Direction</label>
            <Select
              value={localFilters.sortDirection}
              onValueChange={(value) => handleFilterChange('sortDirection', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Descending" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apply Button */}
          <Button 
            onClick={handleApplyFilters}
            className="w-full bg-[#00FF4C] hover:bg-green-400 text-black font-medium"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  );
} 