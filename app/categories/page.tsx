"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface Category {
  id: string;
  name: string;
  description: string;
  businessCount: number;
}

export default function CategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const categoriesRef = collection(db, 'categories');
        const q = query(categoriesRef, orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedCategories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Category));
        
        // If we have categories, also fetch business counts
        if (fetchedCategories.length > 0) {
          try {
            // Get all business profiles to count by category
            const profilesRef = collection(db, 'profiles');
            const profilesQuery = query(profilesRef, where('role', '==', 'business'));
            const profilesSnapshot = await getDocs(profilesQuery);
            
            // Create a counter for each category
            const categoryCounts = {};
            
            // Count businesses in each category
            profilesSnapshot.forEach(doc => {
              const businessData = doc.data();
              if (businessData.businessCategory) {
                const category = businessData.businessCategory;
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                
                // Also count custom categories under "Other"
                if (category === 'Other' && businessData.businessCategoryCustom) {
                  categoryCounts['Other'] = (categoryCounts['Other'] || 0) + 1;
                }
              }
            });
            
            // Get all businesses from the businesses collection for more accurate counts
            const businessesRef = collection(db, 'businesses');
            const businessesSnapshot = await getDocs(businessesRef);
            
            // Count businesses in each category
            businessesSnapshot.forEach(doc => {
              const businessData = doc.data();
              if (businessData.category) {
                const category = businessData.category;
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
              }
            });
            
            // Update the business counts in the fetched categories
            const updatedCategories = fetchedCategories.map(category => ({
              ...category,
              businessCount: categoryCounts[category.name] || 0
            }));
            
            setCategories(updatedCategories);
          } catch (err) {
            console.error('Error counting businesses by category:', err);
            // Still set the categories even if the count fails
            setCategories(fetchedCategories);
          }
        } else {
          setCategories(fetchedCategories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchCategories();
    }
  }, [authLoading]);

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <h1 className="text-2xl font-bold mb-4">Business Categories</h1>
        <p className="text-gray-600 mb-6">Please sign in to explore business categories.</p>
        <Button onClick={() => router.push('/auth/signin')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Business Categories</h1>
          <p className="text-gray-600">Explore our comprehensive business categories</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => router.push('/directory')}
            className="bg-[#00FF4C] hover:bg-green-400 text-black"
          >
            View Full Business Directory
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search categories..."
          className="max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-8 px-4">
          <div className="bg-slate-50 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Error Loading Categories</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-8 px-4">
          <div className="bg-slate-50 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Categories Found</h3>
            <p className="text-gray-500">Try a different search term or check back later.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <span className="font-medium">{category.businessCount || 0}</span> businesses in this category
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/directory?category=${encodeURIComponent(category.name)}`)}
                >
                  View Businesses
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 