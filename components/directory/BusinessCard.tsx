"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { Business } from '@/types/firebase';

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Link href={`/business/${business.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Image */}
        <div className="relative h-48 w-full">
          <Image
            src={business.imageUrl}
            alt={business.name}
            fill
            className="object-cover"
          />
          {business.featured && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded-full">
              Featured
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-1 truncate">{business.name}</h3>
          
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="truncate">{business.location}</span>
          </div>

          <div className="flex items-center mb-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className="font-medium">{business.rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-gray-500 ml-2">
              ({business.reviews} reviews)
            </span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {business.description}
          </p>

          <div className="text-sm font-medium text-blue-600">
            {business.category}
          </div>
        </div>
      </div>
    </Link>
  );
} 