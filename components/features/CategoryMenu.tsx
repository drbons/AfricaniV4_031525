"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { STATES, CATEGORIES } from '@/lib/data';

export default function CategoryMenu() {
  const [isStatesOpen, setIsStatesOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const router = useRouter();
  
  const handleCategoryClick = (category: string) => {
    // Convert category name to URL-friendly format
    const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
    router.push(`/categories/${categorySlug}`);
    setIsCategoriesOpen(false);
  };
  
  return (
    <div className="bg-white border-b border-gray-200 py-2">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide">
          <div className="relative">
            <button
              onClick={() => setIsStatesOpen(!isStatesOpen)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              50 States
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
            
            {isStatesOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-md shadow-lg z-10 max-h-96 overflow-y-auto">
                <div className="p-2 grid grid-cols-2 gap-1">
                  {STATES.map((state) => (
                    <Link
                      key={state.abbreviation}
                      href={`/states/${state.abbreviation}`}
                      className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsStatesOpen(false)}
                    >
                      {state.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Nationwide Categories
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
            
            {isCategoriesOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-md shadow-lg z-10">
                <div className="p-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryClick(category)}
                      className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Link 
            href="/categories/real-estate" 
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md whitespace-nowrap"
          >
            Real Estate
          </Link>
          
          <Link 
            href="/categories/medical-professionals" 
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md whitespace-nowrap"
          >
            Med Profs
          </Link>
          
          <Link 
            href="/categories/colleges" 
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md whitespace-nowrap"
          >
            Colleges
          </Link>
          
          <Link 
            href="/categories/scholarships" 
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md whitespace-nowrap"
          >
            Scholarships
          </Link>
          
          <Link 
            href="/categories/restaurants" 
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md whitespace-nowrap"
          >
            Restaurants
          </Link>
          
          <Link 
            href="/categories/beauty" 
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md whitespace-nowrap"
          >
            Beauty
          </Link>
          
          <Link 
            href="/categories/for-sale" 
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md whitespace-nowrap"
          >
            For Sale
          </Link>
        </div>
      </div>
    </div>
  );
}