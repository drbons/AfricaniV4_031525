"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/types/firebase';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EventDetail from '@/components/events/EventDetail';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface EventPageProps {
  params: {
    id: string;
  };
}

export default function EventPage({ params }: EventPageProps) {
  const { id } = params;
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect to auth page if user is not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Fetch the event data
  useEffect(() => {
    if (!id || !user) return;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() } as Event);
        } else {
          setError('Event not found');
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, user]);

  if (authLoading) {
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
          You need to sign in to your account to view events.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <Link 
        href="/events" 
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Events
      </Link>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading event details...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-2">{error}</h2>
          <p className="text-gray-600 mb-4">The event you&apos;re looking for might have been removed or is no longer available.</p>
          <Link 
            href="/events" 
            className="text-blue-600 hover:underline"
          >
            Return to Events
          </Link>
        </div>
      ) : !event ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you&apos;re looking for might have been removed or is no longer available.</p>
          <Link 
            href="/events" 
            className="text-blue-600 hover:underline"
          >
            Return to Events
          </Link>
        </div>
      ) : (
        <EventDetail event={event} currentUser={user} />
      )}
    </div>
  );
} 