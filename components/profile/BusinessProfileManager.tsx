"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, PlusCircle, Edit, Trash2, Building, MoreVertical, AlertCircle, Globe, Facebook, Twitter, Instagram } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc,
  Timestamp
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { deleteObject, ref } from 'firebase/storage';
import BusinessProfileModal from './BusinessProfileModal';

interface BusinessProfile {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  images?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface BusinessProfileManagerProps {
  userId: string;
}

export default function BusinessProfileManager({ userId }: BusinessProfileManagerProps) {
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BusinessProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch business profiles
  const fetchBusinessProfiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, `profiles/${userId}/businesses`),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedProfiles: BusinessProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedProfiles.push({
          id: doc.id,
          ...doc.data()
        } as BusinessProfile);
      });
      
      setProfiles(fetchedProfiles);
    } catch (err: any) {
      console.error('Error fetching business profiles:', err);
      setError('Failed to load business profiles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessProfiles();
  }, [userId]);

  const handleOpenModal = (profile: BusinessProfile | null = null) => {
    setEditingProfile(profile);
    setIsModalOpen(true);
  };

  const handleCloseModal = (shouldRefresh: boolean = false) => {
    setIsModalOpen(false);
    setEditingProfile(null);
    
    if (shouldRefresh) {
      fetchBusinessProfiles();
    }
  };

  const handleDeleteProfile = async (profile: BusinessProfile) => {
    if (!window.confirm(`Are you sure you want to delete the profile for "${profile.name}"? This action cannot be undone.`)) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Delete images from storage if they exist
      if (profile.images && profile.images.length > 0) {
        for (const imageUrl of profile.images) {
          try {
            // Extract the storage path from the URL
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1].split('?')[0];
            const storagePath = `businesses/${userId}/${fileName}`;
            
            // Delete the image
            const imageRef = ref(storage, storagePath);
            await deleteObject(imageRef);
          } catch (err) {
            console.error('Error deleting image:', err);
            // Continue with other deletions even if one fails
          }
        }
      }
      
      // Delete from user's collection
      await deleteDoc(doc(db, `profiles/${userId}/businesses/${profile.id}`));
      
      // Delete from global businesses collection
      await deleteDoc(doc(db, `businesses/${profile.id}`));
      
      // Delete from category subcollection
      if (profile.category) {
        await deleteDoc(doc(db, `categories/${profile.category}/businesses/${profile.id}`));
      }
      
      // Update the local state
      setProfiles(prev => prev.filter(p => p.id !== profile.id));
      
    } catch (err: any) {
      console.error('Error deleting business profile:', err);
      setError('Failed to delete business profile. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Business Profiles</h2>
        <button
          onClick={() => handleOpenModal()}
          disabled={isDeleting}
          className="flex items-center gap-2 px-4 py-2 bg-[#00FF4C] text-black font-medium rounded-md hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Create Business Profile</span>
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#00FF4C]" />
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          {profiles.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No business profiles yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first business profile to showcase your business to customers.
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00FF4C] text-black font-medium rounded-md hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <PlusCircle className="h-5 w-5" />
                <span>Create Profile</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative h-40 bg-gray-100">
                    {profile.images && profile.images.length > 0 ? (
                      <img
                        src={profile.images[0]}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600 mb-2 inline-block">
                          {profile.category}
                        </span>
                        <h3 className="font-semibold text-lg mb-1">{profile.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                          {profile.address}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleOpenModal(profile)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                          title="Edit profile"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(profile)}
                          className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full"
                          title="Delete profile"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        <p className="truncate">{profile.phone}</p>
                        {profile.website && (
                          <p className="truncate">
                            <a 
                              href={profile.website}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1"
                            >
                              <Globe className="h-3 w-3" />
                              {profile.website.replace(/^https?:\/\//, '')}
                            </a>
                          </p>
                        )}
                        
                        {/* Social Media Links */}
                        {profile.socialMedia && (
                          <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-gray-100">
                            {profile.socialMedia.facebook && (
                              <a 
                                href={profile.socialMedia.facebook.startsWith('http') 
                                  ? profile.socialMedia.facebook 
                                  : `https://facebook.com/${profile.socialMedia.facebook}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                title="Facebook"
                              >
                                <Facebook className="h-4 w-4 mr-1" />
                                <span className="truncate max-w-[80px]">
                                  {profile.socialMedia.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, '@')}
                                </span>
                              </a>
                            )}
                            
                            {profile.socialMedia.twitter && (
                              <a 
                                href={profile.socialMedia.twitter.startsWith('http') 
                                  ? profile.socialMedia.twitter 
                                  : `https://twitter.com/${profile.socialMedia.twitter}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-400 hover:text-blue-600 text-sm"
                                title="Twitter/X"
                              >
                                <Twitter className="h-4 w-4 mr-1" />
                                <span className="truncate max-w-[80px]">
                                  {profile.socialMedia.twitter.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, '@')}
                                </span>
                              </a>
                            )}
                            
                            {profile.socialMedia.instagram && (
                              <a 
                                href={profile.socialMedia.instagram.startsWith('http') 
                                  ? profile.socialMedia.instagram 
                                  : `https://instagram.com/${profile.socialMedia.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-pink-600 hover:text-pink-800 text-sm"
                                title="Instagram"
                              >
                                <Instagram className="h-4 w-4 mr-1" />
                                <span className="truncate max-w-[80px]">
                                  {profile.socialMedia.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@')}
                                </span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {isModalOpen && (
        <BusinessProfileModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          userId={userId}
          profile={editingProfile}
        />
      )}
    </div>
  );
} 