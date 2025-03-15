import { MOCK_BUSINESSES, MOCK_POSTS, STATES } from '@/lib/data';
import PostCard from '@/components/shared/PostCard';
import BusinessCard from '@/components/shared/BusinessCard';
import PinnedBusinesses from '@/components/features/PinnedBusinesses';
import NationwidePosts from '@/components/features/NationwidePosts';

interface CityPageProps {
  params: {
    state: string;
    city: string;
  };
}

export default function CityPage({ params }: CityPageProps) {
  const stateAbbr = params.state.toUpperCase();
  const cityName = params.city.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  // Find the state info
  const stateInfo = STATES.find(state => state.abbreviation === stateAbbr);
  
  // Filter posts by state and city
  const cityPosts = MOCK_POSTS.filter(
    post => post.state === stateAbbr && post.city === cityName
  );
  
  // Filter businesses by state and city
  const cityBusinesses = MOCK_BUSINESSES.filter(
    business => business.state === stateAbbr && business.city === cityName
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="w-full lg:w-[60%]">
          <h1 className="text-2xl font-bold mb-4">
            {cityName}, {stateInfo ? stateInfo.name : stateAbbr}
          </h1>
          
          {/* Posts section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Local Posts</h2>
            
            {cityPosts.length > 0 ? (
              cityPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">No posts found for this city.</p>
              </div>
            )}
          </div>
          
          {/* Businesses section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Local Businesses</h2>
            
            {cityBusinesses.length > 0 ? (
              <div className="space-y-4">
                {cityBusinesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">No businesses found for this city.</p>
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