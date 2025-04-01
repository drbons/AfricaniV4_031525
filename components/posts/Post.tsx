'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  MapPin,
  Smile
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, arrayUnion, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';

interface PostProps {
  id: string;
  content: string;
  authorName: string;
  authorImage: string;
  location: string;
  mediaUrls: string[];
  likes: number;
  comments: number;
  shares: number;
  createdAt: any;
  hasLiked?: boolean;
}

// Simple time formatter function to replace date-fns
function formatTimeAgo(timestamp: any): string {
  if (!timestamp || !timestamp.toDate) {
    return 'Just now';
  }

  try {
    const now = new Date();
    const date = timestamp.toDate();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) {
      return 'Just now';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
    
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Some time ago';
  }
}

export default function Post({
  id,
  content,
  authorName,
  authorImage,
  location,
  mediaUrls,
  likes,
  comments,
  shares,
  createdAt,
  hasLiked = false
}: PostProps) {
  const [isLiked, setIsLiked] = useState(hasLiked);
  const [likesCount, setLikesCount] = useState(likes);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();

  const handleLike = async () => {
    if (!user) return;

    const newLikeStatus = !isLiked;
    setIsLiked(newLikeStatus);
    setLikesCount(prev => newLikeStatus ? prev + 1 : prev - 1);

    try {
      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, {
        likes: increment(newLikeStatus ? 1 : -1),
        likedBy: newLikeStatus ? arrayUnion(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Error updating like status:', error);
      // Revert UI state if the update fails
      setIsLiked(!newLikeStatus);
      setLikesCount(prev => !newLikeStatus ? prev + 1 : prev - 1);
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, {
        comments: increment(1),
        commentsList: arrayUnion({
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          userImage: user.photoURL || '/default-avatar.png',
          content: newComment,
          createdAt: Timestamp.now()
        })
      });

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = () => {
    console.log('Share clicked for post:', id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
            <Image
              src={authorImage}
              alt={authorName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="ml-3">
            <p className="font-semibold">{authorName}</p>
            <div className="flex items-center text-sm text-gray-500">
              <span>{formatTimeAgo(createdAt)}</span>
              {location && (
                <>
                  <span className="mx-1">•</span>
                  <MapPin size={14} className="mr-1" />
                  <span>{location}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 py-2">
        <p className="text-gray-800 whitespace-pre-wrap">{content}</p>
      </div>

      {/* Media */}
      {mediaUrls && mediaUrls.length > 0 && (
        <div className={`grid ${mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-1 mt-2`}>
          {mediaUrls.map((url, index) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={url}
                alt={`Post media ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{likesCount} likes</span>
          <div>
            <span className="mr-2">{comments} comments</span>
            <span>{shares} shares</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-around px-4 py-2 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center px-4 py-2 rounded-lg hover:bg-gray-50 ${
            isLiked ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Heart size={20} className={isLiked ? 'fill-current' : ''} />
          <span className="ml-2">Like</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-500"
        >
          <MessageCircle size={20} />
          <span className="ml-2">Comment</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-500"
        >
          <Share2 size={20} />
          <span className="ml-2">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 py-2 border-t border-gray-100">
          {/* Comment Input */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
              {user?.photoURL && (
                <Image
                  src={user.photoURL}
                  alt="Your avatar"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-4 py-2 pr-10 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => setNewComment(prev => prev + '😊')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Smile size={20} />
              </button>
            </div>
            <button
              onClick={handleComment}
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>

          {/* Comments List - Simple example comment */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                <Image
                  src="/default-avatar.png"
                  alt="Commenter"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg px-4 py-2">
                  <p className="font-semibold text-sm">John Doe</p>
                  <p className="text-sm">Great post! Thanks for sharing.</p>
                </div>
                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                  <button className="hover:text-gray-700">Like</button>
                  <button className="hover:text-gray-700">Reply</button>
                  <span>2h ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 