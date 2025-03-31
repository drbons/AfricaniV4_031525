"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

// Use the same business categories as in the profile page
const BUSINESS_CATEGORIES = [
  "Restaurants & Food Services",
  "Retail",
  "Health & Wellness",
  "Home Services",
  "Automotive",
  "Professional Services",
  "Beauty & Personal Care",
  "Education & Childcare",
  "Entertainment & Recreation",
  "Pets & Veterinary",
  "Travel & Hospitality",
  "Construction & Trades",
  "Events & Party Services", 
  "Nonprofits & Community Services",
  "Other"
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGES = 5;

// Define the schema for business profile with Zod
const businessProfileSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  category: z.string().min(1, 'Business category is required'),
  categoryCustom: z.string().optional(),
  address: z.string().min(1, 'Business address is required'),
  phone: z
    .string()
    .min(1, 'Business phone is required')
    .regex(/^[0-9\+\-\(\)\s]{10,15}$/, 'Please enter a valid phone number'),
  website: z
    .string()
    .url('Please enter a valid URL')
    .or(z.literal(''))
    .optional(),
  socialMedia: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
});

interface BusinessProfile {
  id: string;
  name: string;
  category: string;
  categoryCustom?: string;
  address: string;
  phone: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  images?: string[];
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  userId: string;
  profile: BusinessProfile | null;
}

export default function BusinessProfileModal({ 
  isOpen, 
  onClose, 
  userId, 
  profile 
}: BusinessProfileModalProps) {
  const [name, setName] = useState(profile?.name || '');
  const [category, setCategory] = useState(profile?.category || '');
  const [categoryCustom, setCategoryCustom] = useState(profile?.categoryCustom || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [facebook, setFacebook] = useState(profile?.socialMedia?.facebook || '');
  const [twitter, setTwitter] = useState(profile?.socialMedia?.twitter || '');
  const [instagram, setInstagram] = useState(profile?.socialMedia?.instagram || '');
  const [images, setImages] = useState<string[]>(profile?.images || []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Close modal when escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  // Prevent scrolling of the body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  const validateForm = () => {
    let isValid = true;
    const newErrors: any = {};

    if (!name) {
      newErrors.name = 'Business name is required';
      isValid = false;
    }

    if (!category) {
      newErrors.category = 'Business category is required';
      isValid = false;
    }

    if (category === 'Other' && !categoryCustom) {
      newErrors.categoryCustom = 'Please specify your business category';
      isValid = false;
    }

    if (!address) {
      newErrors.address = 'Address is required';
      isValid = false;
    }

    if (!phone) {
      newErrors.phone = 'Business phone is required';
      isValid = false;
    }

    if (!phone.match(/^[0-9\+\-\(\)\s]{10,15}$/)) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    if (!website.match(/^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+[\w\-]+(\/[\w\-]+)*$/)) {
      newErrors.website = 'Please enter a valid URL';
      isValid = false;
    }

    if (errors.images) {
      newErrors.images = errors.images;
      isValid = false;
    }

    if (errors.form) {
      newErrors.form = errors.form;
      isValid = false;
    }

    if (isValid) {
      // Clear any existing errors
      setErrors({});
      return true;
    } else {
      // Convert new errors to a more usable format
      const formattedErrors: Record<string, string> = {};
      for (const field in newErrors) {
        formattedErrors[field] = newErrors[field];
      }
      setErrors(formattedErrors);
      return false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file types and sizes
    const invalidFiles = selectedFiles.filter(
      file => !ACCEPTED_IMAGE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE
    );
    
    if (invalidFiles.length > 0) {
      setErrors({
        ...errors,
        images: 'Some files were rejected. Please use JPG, PNG or WebP images under 5MB.'
      });
      return;
    }
    
    // Check if we would exceed the maximum number of images
    if (images.length + newImages.length + selectedFiles.length > MAX_IMAGES) {
      setErrors({
        ...errors,
        images: `You can upload a maximum of ${MAX_IMAGES} images.`
      });
      return;
    }
    
    setNewImages(prev => [...prev, ...selectedFiles]);
    
    // Clear any previous file-related errors
    if (errors.images) {
      const { images, ...remainingErrors } = errors;
      setErrors(remainingErrors);
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number, isNewImage: boolean) => {
    if (isNewImage) {
      setNewImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // Prepare image URLs array
      let imageUrls = [...images]; // Start with existing images
      
      // Upload new images if any
      if (newImages.length > 0) {
        const totalUploads = newImages.length;
        let completedUploads = 0;
        
        for (const file of newImages) {
          const fileId = uuidv4();
          const extension = file.name.split('.').pop();
          const storageRef = ref(storage, `businesses/${userId}/${fileId}.${extension}`);
          
          await uploadBytes(storageRef, file);
          const downloadUrl = await getDownloadURL(storageRef);
          imageUrls.push(downloadUrl);
          
          completedUploads++;
          setUploadProgress(Math.round((completedUploads / totalUploads) * 100));
        }
      }
      
      // Prepare the profile data
      const profileData = {
        name,
        category,
        categoryCustom: category === 'Other' ? categoryCustom : '',
        address,
        phone,
        website: website || null,
        socialMedia: {
          facebook: facebook || null,
          twitter: twitter || null,
          instagram: instagram || null,
        },
        images: imageUrls,
        updatedAt: serverTimestamp(),
        ownerId: userId, // Add owner ID reference
      };
      
      let businessId;
      
      // Add or update the profile in user's profiles collection
      if (profile) {
        // Update existing profile
        businessId = profile.id;
        await updateDoc(
          doc(db, `profiles/${userId}/businesses/${profile.id}`),
          profileData
        );
      } else {
        // Create new profile in user's collection
        const newProfileRef = doc(collection(db, `profiles/${userId}/businesses`));
        businessId = newProfileRef.id;
        await setDoc(newProfileRef, {
          ...profileData,
          id: businessId, // Ensure ID is included in the document
          createdAt: serverTimestamp(),
        });
      }
      
      // Now also store/update in the global businesses collection
      await setDoc(
        doc(db, `businesses/${businessId}`), 
        {
          ...profileData,
          id: businessId,
          createdAt: profile ? profile.createdAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
          ownerId: userId,
        },
        { merge: true } // Use merge to ensure we don't overwrite existing data
      );
      
      // Add to the category subcollection for efficient category-based queries
      await setDoc(
        doc(db, `categories/${category}/businesses/${businessId}`),
        {
          id: businessId,
          name,
          address,
          phone,
          website: website || null,
          thumbnail: imageUrls.length > 0 ? imageUrls[0] : null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      
      // Close the modal and refresh the list
      onClose(true);
    } catch (err: any) {
      console.error('Error saving business profile:', err);
      setErrors({ form: err.message || 'Failed to save business profile' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {profile ? 'Edit Business Profile' : 'Create Business Profile'}
          </h2>
          <button
            onClick={() => onClose()}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 69px)' }}>
          {errors.form && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{errors.form}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Business Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                  required
                >
                  <option value="">Select a category</option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}

                {/* Custom category field when "Other" is selected */}
                {category === 'Other' && (
                  <div className="mt-3">
                    <label htmlFor="categoryCustom" className="block text-sm font-medium text-gray-700 mb-1">
                      Specify Your Business Category
                    </label>
                    <input
                      id="categoryCustom"
                      type="text"
                      value={categoryCustom}
                      onChange={(e) => setCategoryCustom(e.target.value)}
                      className={`w-full px-3 py-2 border ${errors.categoryCustom ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                      placeholder="Enter your business category"
                      required={category === 'Other'}
                    />
                    {errors.categoryCustom && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoryCustom}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Business Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              {/* Business Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                  required
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
              
              {/* Business Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                  required
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              
              {/* Business Website (Optional) */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Website (Optional)
                </label>
                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full px-3 py-2 border ${errors.website ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                )}
              </div>
              
              {/* Social Media */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Social Media (Optional)
                </label>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="facebook" className="block text-xs text-gray-500 mb-1">
                      Facebook
                    </label>
                    <input
                      id="facebook"
                      type="text"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="twitter" className="block text-xs text-gray-500 mb-1">
                      Twitter/X
                    </label>
                    <input
                      id="twitter"
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="instagram" className="block text-xs text-gray-500 mb-1">
                      Instagram
                    </label>
                    <input
                      id="instagram"
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images (Optional)
                </label>
                <div className="border border-dashed border-gray-300 rounded-md p-4">
                  <div className="flex flex-wrap gap-3 mb-4">
                    {/* Existing images */}
                    {images.map((imageUrl, index) => (
                      <div key={`existing-${index}`} className="relative w-24 h-24 border rounded overflow-hidden group">
                        <img 
                          src={imageUrl} 
                          alt={`Business ${index + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, false)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Preview of new images */}
                    {newImages.map((file, index) => (
                      <div key={`new-${index}`} className="relative w-24 h-24 border rounded overflow-hidden group">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`New business ${index + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, true)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add image button */}
                    {images.length + newImages.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 border-2 border-gray-300 border-dashed rounded-md flex flex-col items-center justify-center text-gray-600 hover:border-green-500 hover:text-green-500"
                      >
                        <Upload className="h-6 w-6 mb-1" />
                        <span className="text-xs">Add Image</span>
                      </button>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                  
                  <p className="text-xs text-gray-500">
                    Upload up to {MAX_IMAGES} images (JPG, PNG, or WebP, max 5MB each)
                  </p>
                  
                  {errors.images && (
                    <p className="mt-1 text-sm text-red-600">{errors.images}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => onClose()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-[#00FF4C] hover:bg-green-400 text-black font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isSubmitting && (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Saving...'}
                  </>
                )}
                {!isSubmitting && (profile ? 'Update Profile' : 'Create Profile')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 