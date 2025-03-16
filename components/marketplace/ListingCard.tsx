"use client";

import { Listing } from '@/types/firebase';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { firestoreUtils } from '@/lib/firebase';

// Function to calculate distance between two points (haversine formula)
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

interface ListingCardProps {
  listing: Listing;
  userLocation?: { lat: number; lng: number } | null;
}

export default function ListingCard({ listing, userLocation }: ListingCardProps) {
  // Format the created date - safely handle different timestamp formats
  let createdDate = 'Recently';
  try {
    // Convert Firestore timestamp to Date if needed
    const date = listing.createdAt ? 
      (typeof listing.createdAt === 'object' && 'toDate' in listing.createdAt) ? 
        listing.createdAt.toDate() : 
        new Date(listing.createdAt) : 
      new Date();
    
    createdDate = formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
  }

  // Calculate distance if user location is available
  const distance = userLocation && listing.location?.coords ? 
    calculateDistance(
      userLocation.lat, 
      userLocation.lng, 
      listing.location.coords.latitude, 
      listing.location.coords.longitude
    ) : null;

  // Format the price
  const formattedPrice = listing.isFree ? 
    'Free' : 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(listing.price || 0);

  // Format the condition to capitalize first letter
  const formattedCondition = listing.condition ? 
    listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1) : 
    '';

  return (
    <Link href={`/marketplace/listing/${listing.id}`} className="block h-full">
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow duration-200 flex flex-col">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          {listing.images && listing.images.length > 0 ? (
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200">
              <span className="text-gray-400">No image</span>
            </div>
          )}
          
          {listing.isFree && (
            <Badge className="absolute top-2 left-2 bg-green-500">
              Free
            </Badge>
          )}
        </div>
        
        <CardContent className="flex-grow flex flex-col p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{listing.title}</h3>
          
          <div className="flex items-center justify-between mb-2">
            {!listing.isFree && (
              <span className="font-bold text-lg text-green-600">{formattedPrice}</span>
            )}
            {listing.condition && (
              <Badge variant="outline" className="text-xs">
                {formattedCondition}
              </Badge>
            )}
          </div>
          
          <p className="text-gray-600 line-clamp-2 text-sm mb-2 flex-grow">{listing.description}</p>
          
          {listing.location && (
            <div className="flex items-center text-gray-500 text-xs mt-auto">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">{listing.location.name || 'Unknown location'}</span>
              {distance !== null && (
                <span className="ml-1">
                  ({Math.round(distance * 10) / 10} km away)
                </span>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t px-4 py-2 text-xs text-gray-500 flex justify-between">
          <span>{createdDate}</span>
          {listing.sellerName && (
            <span className="flex items-center">
              <Star className="h-3 w-3 mr-1 text-yellow-500" />
              {listing.sellerName}
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
} 