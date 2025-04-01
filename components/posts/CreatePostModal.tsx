'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User } from '@/types/user';
import { 
  X, 
  Image as ImageIcon, 
  Smile, 
  AtSign, 
  MapPin, 
  Hash,
  Paperclip,
  Video
} from 'lucide-react';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Simple emoji array for basic emoji functionality
const simpleEmojis = ['😊', '👍', '❤️', '🎉', '🔥', '😂', '🥰', '😎', '🙌', '👏'];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 500;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setContent(text);
      setCharCount(text.length);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    
    // Create preview URLs
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const addEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) return;
    
    setIsLoading(true);
    try {
      // Upload files if any
      const mediaUrls = [];
      for (const file of files) {
        const storageRef = ref(storage, `posts/${user?.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        mediaUrls.push(url);
      }

      // Create post document
      const postData = {
        content,
        userId: user?.uid,
        userName: userProfile?.displayName || 'Anonymous',
        userAvatar: userProfile?.photoURL || '/default-avatar.png',
        location: userProfile?.location || '',
        mediaUrls,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'posts'), postData);
      
      // Reset form and close modal
      setContent('');
      setFiles([]);
      setPreviews([]);
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Create Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center mb-6">
          <Image
            src={userProfile?.photoURL || '/default-avatar.png'}
            alt="Profile"
            width={48}
            height={48}
            className="rounded-full"
          />
          <div className="ml-3">
            <p className="font-semibold">{userProfile?.displayName || 'Anonymous'}</p>
            {userProfile?.location && (
              <p className="text-sm text-gray-500 flex items-center">
                <MapPin size={14} className="mr-1" />
                {userProfile.location}
              </p>
            )}
          </div>
        </div>

        {/* Post Content */}
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={handleContentChange}
          className="w-full min-h-[150px] p-4 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        
        {/* Character Counter */}
        <div className="text-sm text-gray-500 mb-4">
          {charCount}/{MAX_CHARS} characters
        </div>

        {/* Media Previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative">
                <Image
                  src={preview}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="rounded-lg object-cover"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-b py-4 mb-4">
          <div className="flex space-x-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/*,video/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-gray-700 flex items-center"
            >
              <ImageIcon size={20} className="mr-1" />
              Photo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-gray-700 flex items-center"
            >
              <Video size={20} className="mr-1" />
              Video
            </button>
            <button
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="text-gray-500 hover:text-gray-700 flex items-center"
            >
              <Smile size={20} className="mr-1" />
              Emoji
            </button>
            <button className="text-gray-500 hover:text-gray-700 flex items-center">
              <AtSign size={20} className="mr-1" />
              Tag People
            </button>
            <button className="text-gray-500 hover:text-gray-700 flex items-center">
              <Hash size={20} className="mr-1" />
              Tag Event
            </button>
          </div>
        </div>

        {/* Simple Emoji Picker */}
        {isEmojiPickerOpen && (
          <div className="absolute bg-white border border-gray-200 rounded-lg p-2 shadow-lg z-10">
            <div className="flex flex-wrap gap-2">
              {simpleEmojis.map((emoji) => (
                <button 
                  key={emoji} 
                  onClick={() => addEmoji(emoji)}
                  className="text-2xl hover:bg-gray-100 p-1 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || (!content.trim() && files.length === 0)}
          className={`w-full py-3 rounded-lg font-medium text-white ${
            isLoading || (!content.trim() && files.length === 0)
              ? 'bg-gray-300'
              : 'bg-green-600 hover:bg-green-700'
          } transition-colors flex items-center justify-center`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Posting...
            </>
          ) : (
            'Post'
          )}
        </button>
      </div>
    </div>
  );
} 