"use client";

import Image from 'next/image';
import { Phone, Mail, Clock, MapPin, Facebook, Twitter, Instagram, Star } from 'lucide-react';
import { Business } from '@/types/firebase';

interface BusinessCardProps {
  business: Business;
  expanded?: boolean;
}

export default function BusinessCard({ business, expanded = false }: BusinessCardProps) {
  const renderRatingStars = () => {
    const stars: React.ReactNode[] = [];
    const starColor = business.rating === 'platinum' 
      ? 'text-blue-500' 
      : business.rating === 'gold' 
        ? 'text-yellow-500' 
        : 'text-gray-400';
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-4 w-4 ${i < Math.floor(business.ratingScore || 0) ? `${starColor} fill-current` : 'text-gray-300'}`} 
        />
      );
    }
    
    return stars;
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between">
          <h3 className="font-bold text-lg">{business.name}</h3>
          {business.isPinned && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              Pinned
            </span>
          )}
        </div>
        
        <div className="flex items-center mt-1 text-sm text-gray-500">
          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
            {business.category}
          </span>
          <span className="mx-2">•</span>
          <div className="flex items-center">
            {renderRatingStars()}
            <span className="ml-1">({business.reviewCount || 0})</span>
          </div>
        </div>
        
        {business.images && business.images.length > 0 && (
          <div className="mt-3 aspect-video relative rounded-lg overflow-hidden">
            <Image
              src={business.images[0]}
              alt={business.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <div className="mt-3">
          <p className="text-gray-700 text-sm">
            {expanded || !business.description || business.description.length <= 100 
              ? business.description 
              : business.description.slice(0, 100) + '...'}
          </p>
        </div>
        
        <div className="mt-3 space-y-1">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span>{business.address}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <span>{business.phone}</span>
          </div>
          
          {expanded && (
            <>
              {business.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{business.email}</span>
                </div>
              )}
              {business.hoursOfOperation && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{business.hoursOfOperation}</span>
                </div>
              )}
            </>
          )}
        </div>
        
        {expanded && business.socialMedia && (
          <div className="mt-3 flex space-x-3">
            {business.socialMedia.facebook && (
              <a href={`https://facebook.com/${business.socialMedia.facebook}`} className="text-blue-600">
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {business.socialMedia.twitter && (
              <a href={`https://twitter.com/${business.socialMedia.twitter}`} className="text-blue-400">
                <Twitter className="h-5 w-5" />
              </a>
            )}
            {business.socialMedia.instagram && (
              <a href={`https://instagram.com/${business.socialMedia.instagram}`} className="text-pink-600">
                <Instagram className="h-5 w-5" />
              </a>
            )}
          </div>
        )}
        
        {!expanded && (
          <button className="mt-3 text-blue-600 text-sm font-medium hover:underline">
            View Details
          </button>
        )}
      </div>
    </div>
  );
}