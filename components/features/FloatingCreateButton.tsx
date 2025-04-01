'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import CreatePostModal from '@/components/posts/CreatePostModal';

export default function FloatingCreateButton() {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsCreatePostOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg z-50 transition-transform hover:scale-110"
        aria-label="Create post"
      >
        <Plus size={24} className="text-white" />
      </button>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />
    </>
  );
} 