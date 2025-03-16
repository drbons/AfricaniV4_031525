"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Image as ImageIcon,
  X,
  Loader2,
  Users,
  Paperclip
} from 'lucide-react';
import { ChatThread, Message, User } from '@/types/chat';
import ChatMessage from './ChatMessage';

interface ChatWindowProps {
  thread: ChatThread;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (text: string, image?: File | null) => void;
  onStartVideoCall: () => void;
  onStartVoiceCall: () => void;
  onManageGroup: () => void;
  isMessageSending: boolean;
  onLoadMoreMessages?: () => void;
  hasMoreMessages?: boolean;
  isLoadingMessages?: boolean;
}

export default function ChatWindow({
  thread,
  messages,
  currentUserId,
  onSendMessage,
  onStartVideoCall,
  onStartVoiceCall,
  onManageGroup,
  isMessageSending,
  onLoadMoreMessages,
  hasMoreMessages,
  isLoadingMessages
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Only auto-scroll if we're already at the bottom or there's a new message from the current user
    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      const lastMessage = messages[messages.length - 1];
      const isOwnLastMessage = lastMessage && lastMessage.senderId === currentUserId;
      
      if (isAtBottom || isOwnLastMessage) {
        scrollToBottom();
      }
    }
  }, [messages, currentUserId]);

  // Memoize the formatMessageDate function to avoid recreating it on every render
  const formatMessageDate = useCallback((timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedImage) || isMessageSending) {
      return;
    }
    
    await onSendMessage(newMessage, selectedImage);
    setNewMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          {thread.type === 'group' ? (
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-green-700" />
            </div>
          ) : thread.avatar ? (
            <Image
              src={thread.avatar}
              alt={thread.name || 'User'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {thread.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          
          <div className="ml-3">
            <h3 className="font-medium">{thread.name}</h3>
            {thread.type === 'group' && (
              <p className="text-xs text-gray-500">
                {thread.participants?.length || 0} members
              </p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-1">
          <button 
            onClick={onStartVoiceCall}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            aria-label="Start voice call"
          >
            <Phone className="h-5 w-5" />
          </button>
          
          <button 
            onClick={onStartVideoCall}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            aria-label="Start video call"
          >
            <Video className="h-5 w-5" />
          </button>
          
          {thread.type === 'group' && (
            <button 
              onClick={onManageGroup}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              aria-label="Group settings"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Messages Area */}
      <div 
        className="flex-1 p-4 overflow-y-auto" 
        style={{ scrollBehavior: 'smooth' }}
        ref={messagesContainerRef}
      >
        {/* Add a load more messages button at the top */}
        {isLoadingMessages ? (
          <div className="flex justify-center py-2">
            <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : hasMoreMessages && (
          <div className="flex justify-center py-2">
            <button 
              className="px-4 py-1 text-sm text-primary rounded-full border border-primary hover:bg-primary/10"
              onClick={onLoadMoreMessages}
            >
              Load more messages
            </button>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId;
              const isGroupChat = thread.type === 'group';
              
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwnMessage={isOwnMessage}
                  showSender={isGroupChat}
                  formatMessageDate={formatMessageDate}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <div className="bg-white p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            
            {imagePreview && (
              <div className="mt-2 relative inline-block">
                <Image
                  src={imagePreview}
                  alt="Selected image"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    if (imageInputRef.current) {
                      imageInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={handleImageSelect}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <ImageIcon className="h-6 w-6" />
          </button>
          
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedImage) || isMessageSending}
            className="px-4 py-2 bg-[#00FF4C] hover:bg-green-400 text-black font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMessageSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
        
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>
    </div>
  );
} 