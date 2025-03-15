"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageSquare, Share2, Star, X } from 'lucide-react';
import { Post } from '@/types/firebase';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [shareCount, setShareCount] = useState(post.shares || 0);
  const [loading, setLoading] = useState(false);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleLike = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    
    try {
      const idToken = await user.getIdToken();
      
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleShare = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    
    try {
      const idToken = await user.getIdToken();
      
      const response = await fetch(`/api/posts/${post.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        setShareCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden relative">
              {post.userAvatar ? (
                <Image 
                  src={post.userAvatar} 
                  alt={post.userName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
                  {post.userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="ml-3">
              <div className="font-medium">{post.userName}</div>
              <div className="text-xs text-gray-500 flex items-center">
                {formatDate(post.createdAt)} • {post.city}, {post.state}
                {post.isPinned && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    Pinned
                  </span>
                )}
                {post.isBusinessPromotion && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    Promotion
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-3">
          {isExpanded || post.content.length <= 150 ? (
            <p className="text-gray-800">{post.content}</p>
          ) : (
            <>
              <p className="text-gray-800">{post.content.slice(0, 150)}...</p>
              <button 
                onClick={toggleExpand}
                className="text-blue-600 text-sm font-medium hover:underline mt-1"
              >
                See more
              </button>
            </>
          )}
        </div>
        
        {post.images && post.images.length > 0 && (
          <div className={`mt-3 grid ${post.images.length > 1 ? 'grid-cols-2 gap-2' : 'grid-cols-1'}`}>
            {post.images.map((image, index) => (
              <div key={index} className="aspect-video relative rounded-lg overflow-hidden">
                <Image
                  src={image}
                  alt={`Post image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex space-x-6">
            <button 
              onClick={handleLike}
              disabled={loading || liked}
              className={`flex items-center space-x-1 ${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
              <MessageSquare className="h-5 w-5" />
              <span>{post.comments ? post.comments.length : 0}</span>
            </button>
            <button 
              onClick={handleShare}
              disabled={loading}
              className="flex items-center space-x-1 text-gray-500 hover:text-green-500"
            >
              <Share2 className="h-5 w-5" />
              <span>{shareCount}</span>
            </button>
          </div>
          
          {post.isBusinessPromotion && post.businessId && (
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <Star className="h-4 w-4 text-gray-300" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}