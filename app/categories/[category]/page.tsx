import CategoryBusinessList from '@/components/features/BusinessDirectory/CategoryBusinessList';
import PinnedBusinesses from '@/components/features/PinnedBusinesses';
import NationwidePosts from '@/components/features/NationwidePosts';
import { CATEGORIES } from '@/lib/data';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export function generateStaticParams() {
  return CATEGORIES.map(category => ({
    category: category.toLowerCase().replace(/\s+/g, '-')
  }));
}

export default function CategoryPage({ params }: CategoryPageProps) {
  // Convert URL-friendly category back to display format
  const categoryParam = params.category.replace(/-/g, ' ');
  
  // Find the matching category (case-insensitive)
  const category = CATEGORIES.find(
    cat => cat.toLowerCase() === categoryParam.toLowerCase()
  ) || categoryParam;
  
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content - Category Businesses */}
        <div className="w-full lg:w-[60%]">
          <h1 className="text-2xl font-bold mb-4">{category}</h1>
          <CategoryBusinessList category={category} />
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