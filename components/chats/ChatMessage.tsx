"use client";

import { memo } from 'react';
import Image from 'next/image';
import { Message } from '@/types/chat';

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  showSender: boolean;
  formatMessageDate: (timestamp: any) => string;
}

/**
 * ChatMessage component for displaying individual chat messages
 * Memoized to prevent unnecessary re-renders when other messages are added
 */
function ChatMessage({ message, isOwnMessage, showSender, formatMessageDate }: ChatMessageProps) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className="flex items-end space-x-2 max-w-[80%]">
        {!isOwnMessage && (
          <div className="flex-shrink-0">
            {message.senderAvatar ? (
              <Image 
                src={message.senderAvatar} 
                alt={message.senderName || 'User'}
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <div className="h-7 w-7 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xs font-medium">
                  {message.senderName?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
        )}
        
        <div>
          {!isOwnMessage && showSender && message.senderName && (
            <p className="text-xs text-gray-500 mb-1">{message.senderName}</p>
          )}
          
          <div className={`rounded-2xl p-3 ${
            isOwnMessage 
              ? 'bg-green-500 text-white rounded-tr-none' 
              : 'bg-white border rounded-tl-none'
          }`}>
            {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
            
            {message.image && (
              <div className="mt-2">
                <Image
                  src={message.image}
                  alt="Shared image"
                  width={250}
                  height={250}
                  className="rounded-lg max-w-full object-contain"
                />
              </div>
            )}
            
            <span className={`text-xs block text-right mt-1 ${
              isOwnMessage ? 'text-green-100' : 'text-gray-500'
            }`}>
              {formatMessageDate(message.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Use React.memo to prevent unnecessary re-renders
export default memo(ChatMessage, (prevProps, nextProps) => {
  // Only re-render if the message id changes or isOwnMessage changes
  return prevProps.message.id === nextProps.message.id && 
         prevProps.isOwnMessage === nextProps.isOwnMessage;
}); 