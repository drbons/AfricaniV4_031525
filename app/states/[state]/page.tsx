import { MOCK_BUSINESSES, MOCK_POSTS, STATES } from '@/lib/data';
import PostCard from '@/components/shared/PostCard';
import BusinessCard from '@/components/shared/BusinessCard';
import PinnedBusinesses from '@/components/features/PinnedBusinesses';
import NationwidePosts from '@/components/features/NationwidePosts';

interface StatePageProps {
  params: {
    state: string;
  };
}

export default function StatePage({ params }: StatePageProps) {
  const stateAbbr = params.state.toUpperCase();
  
  // Find the state info
  const stateInfo = STATES.find(state => state.abbreviation === stateAbbr);
  
  // Filter posts by state
  const statePosts = MOCK_POSTS.filter(post => post.state === stateAbbr);
  
  // Filter businesses by state
  const stateBusinesses = MOCK_BUSINESSES.filter(business => business.state === stateAbbr);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="w-full lg:w-[60%]">
          <h1 className="text-2xl font-bold mb-4">
            {stateInfo ? stateInfo.name : stateAbbr} Community
          </h1>
          
          {/* Posts section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
            
            {statePosts.length > 0 ? (
              statePosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">No posts found for this state.</p>
              </div>
            )}
          </div>
          
          {/* Businesses section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Local Businesses</h2>
            
            {stateBusinesses.length > 0 ? (
              <div className="space-y-4">
                {stateBusinesses.slice(0, 5).map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">No businesses found for this state.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right sidebar */}
        <div className="w-full lg:w-[25%] space-y-6">
          <PinnedBusinesses />
          <NationwidePosts />
        </div>
      </div>
    </div>
  );
}