"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { 
  MapPin, 
  Phone, 
  Globe, 
  Building, 
  ChevronLeft, 
  Clock, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin,
  Mail,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

interface BusinessDetails {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  website: string | null;
  description: string | null;
  images: string[];
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  updatedAt: Date;
}

export default function BusinessDetailPage() {
  const { businessId } = useParams();
  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get the business from the global businesses collection
        const businessRef = doc(db, 'businesses', businessId as string);
        const businessDoc = await getDoc(businessRef);

        if (!businessDoc.exists()) {
          setError('Business not found');
          setLoading(false);
          return;
        }

        const data = businessDoc.data();
        setBusiness({
          id: businessDoc.id,
          name: data.name,
          category: data.category,
          address: data.address,
          phone: data.phone,
          website: data.website || null,
          description: data.description || null,
          images: data.images || [],
          socialMedia: data.socialMedia || {},
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      } catch (err) {
        console.error('Error fetching business details:', err);
        setError('Failed to load business details');
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchBusinessDetails();
    }
  }, [businessId]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Handle image carousel
  const nextImage = () => {
    if (business && business.images.length > 0) {
      setActiveImageIndex((activeImageIndex + 1) % business.images.length);
    }
  };

  const prevImage = () => {
    if (business && business.images.length > 0) {
      setActiveImageIndex((activeImageIndex - 1 + business.images.length) % business.images.length);
    }
  };

  // Render social media links
  const renderSocialLinks = () => {
    if (!business?.socialMedia) return null;

    return (
      <div className="flex space-x-4">
        {business.socialMedia.facebook && (
          <a 
            href={business.socialMedia.facebook} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-blue-600"
            aria-label="Facebook"
          >
            <Facebook className="h-5 w-5" />
          </a>
        )}
        {business.socialMedia.twitter && (
          <a 
            href={business.socialMedia.twitter} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-blue-400"
            aria-label="Twitter"
          >
            <Twitter className="h-5 w-5" />
          </a>
        )}
        {business.socialMedia.instagram && (
          <a 
            href={business.socialMedia.instagram} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-pink-600"
            aria-label="Instagram"
          >
            <Instagram className="h-5 w-5" />
          </a>
        )}
        {business.socialMedia.linkedin && (
          <a 
            href={business.socialMedia.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-blue-700"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-5 w-5" />
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/directory"
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to directory
      </Link>

      {loading && (
        <div className="flex justify-center my-12">
          <Loader2 className="h-12 w-12 animate-spin text-[#00FF4C]" />
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-8">
          <p className="font-medium">{error}</p>
          <p className="mt-2">
            Please try again or{' '}
            <Link href="/directory" className="underline">
              return to the directory
            </Link>
            .
          </p>
        </div>
      )}

      {!loading && business && (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Image Gallery */}
            <div className="relative bg-gray-100 h-64 md:h-96">
              {business.images && business.images.length > 0 ? (
                <>
                  <img
                    src={business.images[activeImageIndex]}
                    alt={`${business.name} - Image ${activeImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {business.images.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2"
                        aria-label="Next image"
                      >
                        <ChevronLeft className="h-6 w-6 rotate-180" />
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {business.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveImageIndex(index)}
                            className={`h-2 w-2 rounded-full ${
                              index === activeImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Building className="h-24 w-24 text-gray-300" />
                </div>
              )}
            </div>

            {/* Business Information */}
            <div className="p-6">
              <div className="mb-4">
                <span className="inline-block bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full mb-2">
                  {business.category}
                </span>
                <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Last updated: {formatDate(business.updatedAt)}</span>
                </div>
              </div>
              
              {business.description && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-2">About</h2>
                  <p className="text-gray-700">{business.description}</p>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-3">Contact Information</h2>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <span className="text-gray-700">{business.address}</span>
                    </li>
                    <li className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-700">{business.phone}</span>
                    </li>
                    {business.website && (
                      <li className="flex items-center">
                        <Globe className="h-5 w-5 text-gray-400 mr-2" />
                        <a 
                          href={business.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {business.website.replace(/^https?:\/\//, '')}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold mb-3">Social Media</h2>
                  {Object.values(business.socialMedia || {}).some(Boolean) ? (
                    <div className="mt-2">
                      {renderSocialLinks()}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No social media links provided</p>
                  )}
                </div>
              </div>
              
              {/* Image Gallery (Thumbnails) */}
              {business.images && business.images.length > 1 && (
                <div className="mt-8">
                  <h2 className="text-lg font-semibold mb-3">Image Gallery</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {business.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`relative h-16 w-16 rounded overflow-hidden ${
                          index === activeImageIndex ? 'ring-2 ring-[#00FF4C]' : ''
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${business.name} - Thumbnail ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 