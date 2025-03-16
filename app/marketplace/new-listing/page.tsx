"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ListingForm from '@/components/marketplace/ListingForm';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function NewListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Redirect to auth page if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Sign in required</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          You need to sign in to your account to post listings on our marketplace.
        </p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Link 
        href="/marketplace" 
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Marketplace
      </Link>
      
      <h1 className="text-2xl font-bold mb-6">Post an Item</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <ListingForm />
      </div>
    </div>
  );
} 