"use client";

import { useAuth } from '@/hooks/useAuth';
import CreatePost from '@/components/features/CreatePost';
import PostFeed from '@/components/features/PostFeed';
import InviteNeighbors from '@/components/features/InviteNeighbors';
import PinnedBusinesses from '@/components/features/PinnedBusinesses';
import NationwidePosts from '@/components/features/NationwidePosts';
import ValueProposition from '@/components/features/ValueProposition';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content - Feed */}
        <div className="w-full lg:w-[60%]">
          {!user && <ValueProposition />}
          
          {user && (
            <>
              <CreatePost />
              
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-4">My Posts</h2>
                <PostFeed type="personal" />
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Community Feed</h2>
                <PostFeed type="community" />
              </div>
            </>
          )}
        </div>
        
        {/* Right sidebar */}
        <div className="w-full lg:w-[25%] space-y-6">
          <InviteNeighbors />
          <PinnedBusinesses />
          <NationwidePosts />
        </div>
      </div>
    </div>
  );
}