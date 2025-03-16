"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Listing } from '@/types/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Share2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatDistance, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ListingDetailProps {
  listing: Listing;
  onContactSeller?: () => void;
}

export default function ListingDetail({ listing, onContactSeller }: ListingDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();
  
  // Format date - safely handle different timestamp formats
  let createdAtDate = new Date();
  try {
    // Convert Firestore timestamp to Date if needed
    createdAtDate = listing.createdAt ? 
      (typeof listing.createdAt === 'object' && 'toDate' in listing.createdAt) ? 
        listing.createdAt.toDate() : 
        new Date(listing.createdAt) : 
      new Date();
  } catch (error) {
    console.error('Error formatting date:', error);
  }
  
  const formattedDate = format(createdAtDate, 'PP'); // Format: May 25, 2021
  const timeAgo = formatDistance(createdAtDate, new Date(), { addSuffix: true }); // Format: 2 days ago
  
  // Format price
  const formattedPrice = listing.isFree
    ? 'Free'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(listing.price || 0);
  
  // Format condition (capitalize first letter)
  const formattedCondition = listing.condition
    ? listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)
    : '';
  
  // Handle image navigation
  const handleNextImage = () => {
    if (listing.images && listing.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === listing.images!.length - 1 ? 0 : prev + 1
      );
    }
  };
  
  const handlePrevImage = () => {
    if (listing.images && listing.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? listing.images!.length - 1 : prev - 1
      );
    }
  };
  
  // Handle share
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: listing.title,
          text: `Check out this listing: ${listing.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied to clipboard",
          variant: "success"
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  // Handle contact seller
  const handleContactSeller = () => {
    if (onContactSeller) {
      onContactSeller();
    } else if (listing.contact?.email) {
      window.location.href = `mailto:${listing.contact.email}?subject=Regarding your listing: ${listing.title}`;
    } else if (listing.contact?.phone) {
      window.location.href = `tel:${listing.contact.phone}`;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Image gallery */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-[4/3] md:aspect-[16/9]">
        {listing.images && listing.images.length > 0 ? (
          <>
            <Image
              src={listing.images[currentImageIndex]}
              alt={`${listing.title} - Image ${currentImageIndex + 1}`}
              fill
              className="object-contain"
            />
            
            {listing.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10"
                  onClick={handlePrevImage}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10"
                  onClick={handleNextImage}
                >
                  <ArrowRight className="h-6 w-6" />
                </Button>
                
                <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1">
                  {listing.images.map((_, index) => (
                    <button
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No images available</p>
          </div>
        )}
        
        {/* Free badge */}
        {listing.isFree && (
          <Badge className="absolute top-3 left-3 bg-green-500 px-3 py-1 text-sm">
            Free
          </Badge>
        )}
      </div>
      
      {/* Listing details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-2xl font-bold">{listing.title}</h1>
              <div className="text-2xl font-bold text-green-600">{formattedPrice}</div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {listing.condition && (
                <Badge variant="outline" className="px-2 py-1">
                  {formattedCondition}
                </Badge>
              )}
              {listing.category && (
                <Badge variant="secondary" className="px-2 py-1">
                  {listing.category}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center text-sm text-gray-500 gap-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span title={formattedDate}>{timeAgo}</span>
              </div>
              {listing.location?.name && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{listing.location.name}</span>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <div className="text-gray-700 whitespace-pre-line">
              {listing.description}
            </div>
          </div>
          
          <Separator className="md:hidden" />
        </div>
        
        <div>
          <Card>
            <CardContent className="p-5 space-y-5">
              <div>
                <h3 className="font-semibold mb-2">Seller Information</h3>
                <div className="text-gray-700">
                  {listing.sellerName ? (
                    <div className="mb-2">{listing.sellerName}</div>
                  ) : (
                    <div className="mb-2 text-gray-500">Anonymous Seller</div>
                  )}
                  
                  {listing.contact?.phone && (
                    <div className="flex items-center mb-1 text-sm">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href={`tel:${listing.contact.phone}`} className="text-blue-600 hover:underline">
                        {listing.contact.phone}
                      </a>
                    </div>
                  )}
                  
                  {listing.contact?.email && (
                    <div className="flex items-center mb-1 text-sm">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href={`mailto:${listing.contact.email}`} className="text-blue-600 hover:underline truncate">
                        {listing.contact.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-2 space-y-3">
                <Button 
                  className="w-full bg-[#00FF4C] hover:bg-green-400 text-black font-medium"
                  onClick={handleContactSeller}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Seller
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Listing
                </Button>
              </div>
              
              <div className="pt-3 text-xs text-gray-500 flex items-start">
                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                <span>
                  Please exercise caution when making transactions. Meet in public places and verify items before purchase.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 