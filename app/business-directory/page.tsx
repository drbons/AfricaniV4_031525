import BusinessDirectory from '@/components/features/BusinessDirectory';
import PinnedBusinesses from '@/components/features/PinnedBusinesses';
import NationwidePosts from '@/components/features/NationwidePosts';

export default function BusinessDirectoryPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content - Business Directory */}
        <div className="w-full lg:w-[60%]">
          <h1 className="text-2xl font-bold mb-4">Business Directory</h1>
          <BusinessDirectory />
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