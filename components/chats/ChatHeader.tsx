"use client";

import { MessageSquare } from 'lucide-react';

export default function ChatHeader() {
  return (
    <div className="p-6 flex items-center space-x-3">
      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
        <MessageSquare className="h-5 w-5 text-green-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Chats</h1>
        <p className="text-gray-600 text-sm">Message with your community</p>
      </div>
    </div>
  );
} 