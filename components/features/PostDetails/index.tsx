"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Image as ImageIcon,
  Send,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Globe2,
  Lock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Post, Comment } from '@/types/firebase';
import { cn } from '@/lib/utils';

interface PostDetailsProps {
  post: Post;
  onComment?: (comment: string) => Promise<void>;
  onLike?: () => Promise<void>;
  onShare?: () => Promise<void>;
  onBookmark?: () => Promise<void>;
}

export default function PostDetails({ 
  post, 
  onComment,
  onLike,
  onShare,
  onBookmark 
}: PostDetailsProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const commentsPerPage = 10;

  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleLike = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      await onLike?.();
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      await onBookmark?.();
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error bookmarking post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      await onShare?.();
      
      // Show share options
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post',
          text: post.content,
          url: window.location.href
        });
      } else {
        // Fallback to copy link
        await navigator.clipboard.writeText(window.location.href);
        // Show toast notification
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || loading) return;

    setLoading(true);
    try {
      await onComment?.(newComment);
      setNewComment('');
      setSelectedImage(null);
      setShowComments(true);
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCommentThread = (commentId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const loadMoreComments = () => {
    if (loading || !hasMore) return;
    setPage(prev => prev + 1);
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!showComments) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreComments();
        }
      },
      { threshold: 0.5 }
    );

    const target = document.getElementById('comments-end-marker');
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, [showComments, hasMore, loading]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Post Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative h-10 w-10 rounded-full overflow-hidden">
              {post.userAvatar ? (
                <Image
                  src={post.userAvatar}
                  alt={post.userName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {post.userName[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-medium">{post.userName}</span>
                {post.isVerified && (
                  <CheckCircle2 className="h-4 w-4 text-blue-500 ml-1" />
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <time dateTime={post.createdAt}>
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </time>
                <span className="mx-1">•</span>
                {post.isPrivate ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Globe2 className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>
          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="More options"
          >
            <MoreHorizontal className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <div className="whitespace-pre-wrap break-words text-gray-800">
          {post.content}
        </div>
        
        {post.images && post.images.length > 0 && (
          <div className={cn(
            "mt-4 grid gap-2",
            post.images.length === 1 ? "grid-cols-1" : 
            post.images.length === 2 ? "grid-cols-2" :
            post.images.length === 3 ? "grid-cols-2" :
            "grid-cols-2"
          )}>
            {post.images.map((image, index) => (
              <div 
                key={index}
                className={cn(
                  "relative rounded-lg overflow-hidden",
                  post.images.length === 3 && index === 0 ? "col-span-2" : "",
                  "aspect-video"
                )}
              >
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
      </div>

      {/* Engagement Stats */}
      <div className="px-4 py-2 border-t border-b flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{post.likes} likes</span>
          <span>{post.comments?.length || 0} comments</span>
          <span>{post.shares} shares</span>
        </div>
        {isBookmarked && (
          <span className="text-blue-500">Saved</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 flex items-center justify-between border-b">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center space-x-2 p-2 rounded-full transition-colors",
            isLiked ? "text-red-500" : "text-gray-600 hover:bg-gray-100"
          )}
          disabled={loading}
        >
          <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />
          <span>Like</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <MessageCircle className="h-6 w-6" />
          <span>Comment</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center space-x-2 p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
          disabled={loading}
        >
          <Share2 className="h-6 w-6" />
          <span>Share</span>
        </button>

        <button
          onClick={handleBookmark}
          className={cn(
            "flex items-center space-x-2 p-2 rounded-full transition-colors",
            isBookmarked ? "text-blue-500" : "text-gray-600 hover:bg-gray-100"
          )}
          disabled={loading}
        >
          <Bookmark className={cn("h-6 w-6", isBookmarked && "fill-current")} />
          <span>Save</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="p-4">
          {/* Comment Input */}
          <form onSubmit={handleSubmitComment} className="mb-4">
            <div className="flex items-start space-x-3">
              <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {user?.displayName?.[0].toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  ref={commentInputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleImageSelect}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || loading}
                    className="px-4 py-1.5 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {selectedImage && (
                  <div className="mt-2 relative">
                    <Image
                      src={URL.createObjectURL(selectedImage)}
                      alt="Selected image"
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {post.comments?.slice(0, page * commentsPerPage).map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                  {comment.userAvatar ? (
                    <Image
                      src={comment.userAvatar}
                      alt={comment.userName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {comment.userName[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <div className="font-medium">{comment.userName}</div>
                    <div className="text-gray-800">{comment.text}</div>
                  </div>
                  <div className="mt-1 flex items-center space-x-3 text-sm text-gray-500">
                    <button className="hover:text-gray-700">Like</button>
                    <button className="hover:text-gray-700">Reply</button>
                    <time dateTime={comment.createdAt}>
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </time>
                  </div>
                  
                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <>
                      <button
                        onClick={() => toggleCommentThread(comment.id)}
                        className="mt-2 flex items-center text-sm text-gray-500 hover:text-gray-700"
                      >
                        {expandedComments.has(comment.id) ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Hide replies
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show replies ({comment.replies.length})
                          </>
                        )}
                      </button>
                      
                      {expandedComments.has(comment.id) && (
                        <div className="mt-2 space-y-4 pl-8 border-l-2 border-gray-200">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex space-x-3">
                              <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                                {reply.userAvatar ? (
                                  <Image
                                    src={reply.userAvatar}
                                    alt={reply.userName}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-600 font-medium">
                                      {reply.userName[0].toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-100 rounded-lg px-3 py-2">
                                  <div className="font-medium">{reply.userName}</div>
                                  <div className="text-gray-800">{reply.text}</div>
                                </div>
                                <div className="mt-1 flex items-center space-x-3 text-sm text-gray-500">
                                  <button className="hover:text-gray-700">Like</button>
                                  <button className="hover:text-gray-700">Reply</button>
                                  <time dateTime={reply.createdAt}>
                                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                  </time>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {/* Load More Comments Marker */}
            {hasMore && (
              <div 
                id="comments-end-marker" 
                className="py-4 text-center"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}