import { Star, MapPin, Phone, Globe, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { BusinessProfile } from '@/lib/types';

interface BusinessCardProps {
  business: BusinessProfile;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Fallback image if the main image fails to load
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Format the display category
  const displayCategory = 
    business.category === 'Other' && business.categoryCustom
      ? business.categoryCustom
      : business.category;
  
  // Helper to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full">
      {/* Image or Fallback */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {business.images && business.images.length > 0 && !imageError ? (
          <img
            src={business.images[0]}
            alt={business.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-gray-400 flex flex-col items-center">
              <span className="text-4xl mb-2">{business.name.charAt(0)}</span>
              <span className="text-sm">{business.name}</span>
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-2 right-2">
          <span className="inline-block bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {truncateText(displayCategory, 20)}
          </span>
        </div>
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        {/* Business Info */}
        <div className="mb-2">
          <h3 className="font-bold text-lg mb-1 truncate">{business.name}</h3>
          
          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(business.rating || 0)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              {business.rating?.toFixed(1) || 'No ratings'} 
              {business.reviewCount ? ` (${business.reviewCount})` : ''}
            </span>
          </div>
          
          {/* Location */}
          {(business.city || business.state) && (
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <MapPin className="h-3.5 w-3.5 mr-1 shrink-0" />
              <span className="truncate">
                {[business.city, business.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          
          {/* Phone */}
          {business.phone && (
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <Phone className="h-3.5 w-3.5 mr-1 shrink-0" />
              <span className="truncate">{business.phone}</span>
            </div>
          )}
          
          {/* Website */}
          {business.website && (
            <div className="flex items-center text-sm text-blue-600 mb-1">
              <Globe className="h-3.5 w-3.5 mr-1 shrink-0" />
              <a 
                href={business.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="truncate hover:underline"
              >
                {business.website.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </div>
          )}
        </div>
        
        {/* Description */}
        {business.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {business.description}
          </p>
        )}
        
        {/* Business Hours - Collapsed by default */}
        {business.businessHours && (
          <div className="text-xs text-gray-500 mb-4">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span className="truncate">{business.businessHours}</span>
            </div>
          </div>
        )}
        
        {/* View Details Button */}
        <div className="mt-auto pt-2">
          <Link 
            href={`/directory/business/${business.id}`} 
            className="w-full flex items-center justify-center bg-black hover:bg-gray-800 text-white py-2 px-4 rounded transition-colors"
          >
            <span>View Details</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
} 