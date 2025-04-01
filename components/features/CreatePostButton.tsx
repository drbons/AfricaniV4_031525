"use client";

import { useState, useRef } from 'react';
import { X, Image, MapPin, Loader2 } from 'lucide-react';
import { STATES } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import NextImage from 'next/image';

export default function CreatePostButton() {
  const { user } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
    setSelectedCity('');
  };
  
  const cities = selectedState 
    ? STATES.find(state => state.abbreviation === selectedState)?.cities || []
    : [];
  
  const handleImageSelect = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
      setUploadProgress(0);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    try {
      // Check if user is authenticated and storage is configured properly
      if (!user?.uid) {
        throw new Error('User authentication required for uploads.');
      }
      
      // Verify Storage is properly initialized
      if (!storage || typeof storage.ref !== 'function') {
        console.error('Firebase Storage not properly initialized:', storage);
        throw new Error('Storage service unavailable.');
      }
      
      // Create a reference to the file location
      const storageRef = ref(storage, `posts/${user.uid}/${fileName}`);
      
      // Start upload progress updates
      setUploadProgress(10);
      
      // Simulate progress steps while waiting for upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Don't exceed 90% until we know the upload is complete
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);
      
      // Perform the upload
      console.log('Uploading file to Firebase Storage:', {
        fileName,
        storageRef,
        fileSize: file.size,
        fileType: file.type
      });
      
      const snapshot = await uploadBytes(storageRef, file);
      clearInterval(progressInterval);
      setUploadProgress(95);
      
      // Get download URL
      console.log('Upload successful, getting download URL');
      const downloadURL = await getDownloadURL(snapshot.ref);
      setUploadProgress(100);
      
      console.log('Download URL obtained:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error.message || 'Failed to upload image. Please try again.';
      throw new Error(`Image upload failed: ${errorMessage}`);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth');
      return;
    }

    // Validate that we have content or an image
    if (!postContent.trim() && !selectedImage) {
      setError('Please add some text or an image to your post');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Upload image if selected
      let imageUrl = null;
      if (selectedImage) {
        try {
          imageUrl = await uploadImage(selectedImage);
        } catch (uploadError: any) {
          // Handle image upload error but continue with post creation if there's text content
          if (!postContent.trim()) {
            throw uploadError; // Re-throw if post depends entirely on the image
          }
          setError(`Warning: ${uploadError.message}. Your post text will still be saved.`);
        }
      }
      
      // Get the current user's ID token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('Authentication required. Please sign in again.');
      }
      
      // Create post in Firestore
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          content: postContent,
          city: selectedCity,
          state: selectedState,
          imageUrl: imageUrl
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }
      
      // Reset form and close modal
      setPostContent('');
      setSelectedState('');
      setSelectedCity('');
      setSelectedImage(null);
      setImagePreview(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setIsModalOpen(false);
      
    } catch (err: any) {
      console.error('Post creation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
  
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed right-6 bottom-6 bg-[#00FF4C] hover:bg-green-400 text-black font-bold w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors z-50"
        aria-label="Create new post"
      >
        <span className="text-2xl">+</span>
      </button>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Create Post</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[120px]"
                />
              </div>
              
              {/* Image preview */}
              {imagePreview && (
                <div className="mb-4 relative">
                  <NextImage
                    src={imagePreview}
                    alt="Selected image"
                    width={300}
                    height={200}
                    className="rounded-lg max-w-full"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      if (imageInputRef.current) {
                        imageInputRef.current.value = '';
                      }
                      if (imagePreview) {
                        URL.revokeObjectURL(imagePreview);
                      }
                    }}
                    className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Location
                </label>
                <div className="flex space-x-2">
                  <select
                    value={selectedState}
                    onChange={handleStateChange}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select State</option>
                    {STATES.map((state) => (
                      <option key={state.abbreviation} value={state.abbreviation}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={!selectedState}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleImageSelect}
                  className="flex items-center text-gray-600 hover:text-gray-800"
                  aria-label="Add image"
                  disabled={loading}
                >
                  <Image className="h-5 w-5 mr-1" />
                  <span>Add Image</span>
                </button>
                
                {/* Hidden file input */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                
                <button
                  type="submit"
                  disabled={loading || (!postContent.trim() && !selectedImage)}
                  className="px-4 py-2 bg-[#00FF4C] hover:bg-green-400 text-black font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    'Post'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}