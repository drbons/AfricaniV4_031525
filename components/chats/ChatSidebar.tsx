"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Search, Users, Plus, Check } from 'lucide-react';
import { ChatThread, User } from '@/types/chat';

interface ChatSidebarProps {
  threads: ChatThread[];
  selectedThreadId: string | null;
  onSelectThread: (thread: ChatThread) => void;
  onCreateGroup: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
}

export default function ChatSidebar({
  threads,
  selectedThreadId,
  onSelectThread,
  onCreateGroup,
  searchQuery,
  onSearchChange,
  isLoading
}: ChatSidebarProps) {
  const [showSearch, setShowSearch] = useState(false);

  const filteredThreads = searchQuery
    ? threads.filter(thread => 
        thread.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : threads;

  return (
    <div className="w-full md:w-80 border-r flex flex-col h-full bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <button
            onClick={onCreateGroup}
            className="p-2 bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
            aria-label="Create new group"
          >
            <Users className="h-5 w-5" />
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
          />
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No conversations found</p>
            {searchQuery && <p className="text-sm mt-1">Try a different search term</p>}
          </div>
        ) : (
          <div className="divide-y">
            {filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread)}
                className={`w-full flex items-center p-4 hover:bg-gray-50 transition-colors ${
                  selectedThreadId === thread.id ? 'bg-green-50' : ''
                }`}
              >
                <div className="relative">
                  {thread.type === 'group' ? (
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-700" />
                    </div>
                  ) : thread.avatar ? (
                    <Image
                      src={thread.avatar}
                      alt={thread.name || 'User'}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-bold">
                        {thread.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  {thread.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {thread.unreadCount}
                    </div>
                  )}
                </div>

                <div className="ml-3 flex-1 text-left">
                  <div className="flex justify-between items-start">
                    <span className="font-medium truncate max-w-[120px]">
                      {thread.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {thread.lastMessageTime ? new Date(thread.lastMessageTime.toDate()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : ''}
                    </span>
                  </div>
                  <p className={`text-sm truncate max-w-[160px] ${thread.unreadCount > 0 ? 'font-medium' : 'text-gray-500'}`}>
                    {thread.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 