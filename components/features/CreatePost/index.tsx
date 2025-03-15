"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { 
  Image as ImageIcon, 
  X, 
  Loader2, 
  Globe2, 
  MapPin 
} from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export default function CreatePost() {
  const { user } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    router.push('/auth');
    return null;
  }

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
    const storageRef = ref(storage, `posts/${user.uid}/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;

    setLoading(true);
    setError(null);

    try {
      let imageUrl = null;
      
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const postData = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: user.photoURL,
        content: content.trim(),
        images: imageUrl ? [imageUrl] : [],
        city: user.city || '',
        state: user.state || '',
        likes: 0,
        comments: [],
        shares: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPinned: false,
        isBusinessPromotion: false
      };

      await addDoc(collection(db, 'posts'), postData);

      // Reset form
      setContent('');
      setSelectedImage(null);
      setImagePreview(null);
      setUploadProgress(0);
      
      // Clean up object URL
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      
      // Reset file input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      
      // Refresh feed
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex space-x-3">
          <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || 'User'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {user.displayName?.[0].toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={3}
            />
            
            {imagePreview && (
              <div className="mt-2 relative">
                <Image
                  src={imagePreview}
                  alt="Selected image"
                  width={300}
                  height={200}
                  className="rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    setUploadProgress(0);
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
            
            {error && (
              <div className="mt-2 text-sm text-red-500">
                {error}
              </div>
            )}
            
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleImageSelect}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={loading}
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{user.city}, {user.state}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Globe2 className="h-4 w-4 mr-1" />
                  <span>Public</span>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={(!content.trim() && !selectedImage) || loading}
                className="px-4 py-2 bg-[#00FF4C] hover:bg-green-400 text-black font-bold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </div>
        
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </form>
    </div>
  );
}