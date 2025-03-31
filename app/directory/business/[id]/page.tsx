"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fetchBusinessById } from '@/lib/firebase-api';
import { BusinessProfile } from '@/lib/types';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  Star, 
  Facebook, 
  Twitter, 
  Instagram, 
  ChevronLeft, 
  ChevronRight,
  Building,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function BusinessDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const businessId = Array.isArray(id) ? id[0] : id;
  
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchBusinessById(businessId);
        setBusiness(result);
      } catch (err: any) {
        console.error('Error fetching business details:', err);
        setError(err.message || 'Failed to load business details');
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading && user) {
      fetchBusinessDetails();
    }
  }, [businessId, authLoading, user]);
  
  // Not authenticated
  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Business Details</h1>
          <p className="text-gray-600 mb-6">Please sign in to view business details.</p>
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
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }
  
  if (error || !business) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-6 my-8">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Error loading business details</h3>
          </div>
          <p>{error || 'Business not found'}</p>
          <div className="mt-4">
            <Link 
              href="/directory"
              className="inline-flex items-center text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Format display category
  const displayCategory = 
    business.category === 'Other' && business.categoryCustom
      ? business.categoryCustom
      : business.category;
  
  // Navigate to previous image
  const prevImage = () => {
    if (!business.images || business.images.length <= 1) return;
    setActiveImageIndex((current) => {
      return current === 0 ? business.images!.length - 1 : current - 1;
    });
  };
  
  // Navigate to next image
  const nextImage = () => {
    if (!business.images || business.images.length <= 1) return;
    setActiveImageIndex((current) => {
      return current === business.images!.length - 1 ? 0 : current + 1;
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back Button */}
      <div className="mb-4">
        <Link 
          href="/directory"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Directory
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Business Images */}
        <div className="relative bg-gray-100 h-64 md:h-96 overflow-hidden">
          {business.images && business.images.length > 0 ? (
            <>
              <img
                src={business.images[activeImageIndex]}
                alt={business.name}
                className="w-full h-full object-cover"
              />
              
              {business.images.length > 1 && (
                <>
                  {/* Image Navigation */}
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                    {business.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`h-2 w-2 rounded-full ${
                          index === activeImageIndex ? 'bg-white' : 'bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400 flex flex-col items-center">
                <Building className="h-16 w-16 mb-2" />
                <span className="text-xl">{business.name}</span>
              </div>
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-4 right-4">
            <span className="inline-block bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              {displayCategory}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          {/* Business Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{business.name}</h1>
            
            {/* Rating */}
            {business.rating !== undefined && (
              <div className="flex items-center mb-3">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(business.rating || 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-600">
                  {business.rating.toFixed(1)}
                  {business.reviewCount ? ` (${business.reviewCount} reviews)` : ''}
                </span>
              </div>
            )}
            
            {/* Address */}
            {business.address && (
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="h-5 w-5 mr-2 text-gray-500 shrink-0" />
                <span>{business.address}</span>
              </div>
            )}
            
            {/* Phone */}
            {business.phone && (
              <div className="flex items-center text-gray-600 mb-2">
                <Phone className="h-5 w-5 mr-2 text-gray-500 shrink-0" />
                <span>{business.phone}</span>
              </div>
            )}
            
            {/* Website */}
            {business.website && (
              <div className="flex items-center text-blue-600 mb-2">
                <Globe className="h-5 w-5 mr-2 text-gray-500 shrink-0" />
                <a 
                  href={business.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {business.website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </div>
            )}
            
            {/* Business Hours */}
            {business.businessHours && (
              <div className="flex items-center text-gray-600 mb-2">
                <Clock className="h-5 w-5 mr-2 text-gray-500 shrink-0" />
                <span>{business.businessHours}</span>
              </div>
            )}
          </div>
          
          {/* Description */}
          {business.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">About</h2>
              <p className="text-gray-700">{business.description}</p>
            </div>
          )}
          
          {/* Social Media */}
          {business.socialMedia && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Connect</h2>
              <div className="flex space-x-4">
                {business.socialMedia.facebook && (
                  <a
                    href={business.socialMedia.facebook.startsWith('http') 
                      ? business.socialMedia.facebook 
                      : `https://facebook.com/${business.socialMedia.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                
                {business.socialMedia.twitter && (
                  <a
                    href={business.socialMedia.twitter.startsWith('http') 
                      ? business.socialMedia.twitter 
                      : `https://twitter.com/${business.socialMedia.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-400 text-white rounded-full hover:bg-blue-500"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                
                {business.socialMedia.instagram && (
                  <a
                    href={business.socialMedia.instagram.startsWith('http') 
                      ? business.socialMedia.instagram 
                      : `https://instagram.com/${business.socialMedia.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-pink-600 text-white rounded-full hover:bg-pink-700"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 