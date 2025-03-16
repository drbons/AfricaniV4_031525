"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EventForm from '@/components/events/EventForm';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function CreateEventPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);

  // Redirect to auth page if user is not logged in
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth');
      } else {
        setPageLoading(false);
      }
    }
  }, [user, authLoading, router]);

  if (authLoading || pageLoading) {
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
          You need to sign in to your account to create events.
        </p>
        <Link
          href="/auth"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <Link 
        href="/events" 
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Events
      </Link>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create an Event</h1>
        <p className="text-gray-600 mt-2">
          Share your upcoming events with the community
        </p>
      </div>

      <EventForm userId={user.uid} userName={user.displayName || 'Anonymous'} userPhoto={user.photoURL} />
    </div>
  );
} 