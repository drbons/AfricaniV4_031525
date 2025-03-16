"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { Event } from '@/types/firebase';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Heart, 
  Share2, 
  CheckCircle,
  Ticket,
  Users
} from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

interface EventCardProps {
  event: Event;
  userLocation: { lat: number; lng: number } | null;
}

export default function EventCard({ event, userLocation }: EventCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(event.likes?.includes(user?.uid || '') || false);
  const [attending, setAttending] = useState(event.attendees?.includes(user?.uid || '') || false);
  const [interested, setInterested] = useState(event.interested?.includes(user?.uid || '') || false);
  
  // Format date for display
  const formatEventDate = () => {
    if (!event.startDate) return 'Date not specified';
    
    const startDate = parseISO(event.startDate);
    const endDate = event.endDate ? parseISO(event.endDate) : null;
    
    // If it's a single day event
    if (!endDate || event.startDate === event.endDate) {
      return format(startDate, 'EEE, MMM d, yyyy');
    }
    
    // Multi-day event
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  };
  
  // Calculate distance from user if location data available
  const getDistanceText = () => {
    if (!userLocation || !event.location.coordinates) return null;
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      event.location.coordinates.latitude,
      event.location.coordinates.longitude
    );
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${Math.round(distance)}km away`;
  };
  
  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };
  
  // Handle like event
  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like this event",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const eventRef = doc(db, 'events', event.id);
      const newLiked = !liked;
      
      // Update Firestore
      await updateDoc(eventRef, {
        likes: newLiked ? arrayUnion(user.uid) : arrayRemove(user.uid)
      });
      
      // Update local state
      setLiked(newLiked);
      
      // Send notification to event creator
      if (newLiked && event.createdBy !== user.uid) {
        const notificationId = uuidv4();
        const notificationRef = doc(db, 'notifications', notificationId);
        await setDoc(notificationRef, {
          id: notificationId,
          recipientId: event.createdBy,
          senderId: user.uid,
          senderName: user.displayName,
          senderPhotoURL: user.photoURL,
          type: 'event_like',
          read: false,
          eventId: event.id,
          eventTitle: event.title,
          createdAt: new Date().toISOString(),
        });
      }
      
      toast({
        title: newLiked ? "Event liked" : "Event unliked",
        description: newLiked ? "Added to your likes" : "Removed from your likes",
      });
    } catch (error) {
      console.error("Error updating like status:", error);
      toast({
        title: "Error",
        description: "Could not update like status",
        variant: "destructive",
      });
    }
  };
  
  // Handle attendance status
  const handleAttend = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to attend this event",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const eventRef = doc(db, 'events', event.id);
      const newAttending = !attending;
      
      // Update Firestore - add to attendees and remove from interested if previously interested
      await updateDoc(eventRef, {
        attendees: newAttending ? arrayUnion(user.uid) : arrayRemove(user.uid),
        ...(newAttending && interested ? { interested: arrayRemove(user.uid) } : {})
      });
      
      // Update local state
      setAttending(newAttending);
      if (newAttending && interested) {
        setInterested(false);
      }
      
      // Send notification to event creator
      if (newAttending && event.createdBy !== user.uid) {
        const notificationId = uuidv4();
        const notificationRef = doc(db, 'notifications', notificationId);
        await setDoc(notificationRef, {
          id: notificationId,
          recipientId: event.createdBy,
          senderId: user.uid,
          senderName: user.displayName,
          senderPhotoURL: user.photoURL,
          type: 'event_attending',
          read: false,
          eventId: event.id,
          eventTitle: event.title,
          createdAt: new Date().toISOString(),
        });
      }
      
      toast({
        title: newAttending ? "You're attending!" : "You're no longer attending",
        description: newAttending 
          ? "You've been added to the attendee list" 
          : "You've been removed from the attendee list",
      });
    } catch (error) {
      console.error("Error updating attendance status:", error);
      toast({
        title: "Error",
        description: "Could not update attendance status",
        variant: "destructive",
      });
    }
  };
  
  // Handle interested status
  const handleInterested = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to mark interest in this event",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const eventRef = doc(db, 'events', event.id);
      const newInterested = !interested;
      
      // Update Firestore - add to interested and remove from attendees if previously attending
      await updateDoc(eventRef, {
        interested: newInterested ? arrayUnion(user.uid) : arrayRemove(user.uid),
        ...(newInterested && attending ? { attendees: arrayRemove(user.uid) } : {})
      });
      
      // Update local state
      setInterested(newInterested);
      if (newInterested && attending) {
        setAttending(false);
      }
      
      // Send notification to event creator
      if (newInterested && event.createdBy !== user.uid) {
        const notificationId = uuidv4();
        const notificationRef = doc(db, 'notifications', notificationId);
        await setDoc(notificationRef, {
          id: notificationId,
          recipientId: event.createdBy,
          senderId: user.uid,
          senderName: user.displayName,
          senderPhotoURL: user.photoURL,
          type: 'event_interested',
          read: false,
          eventId: event.id,
          eventTitle: event.title,
          createdAt: new Date().toISOString(),
        });
      }
      
      toast({
        title: newInterested ? "Marked as interested" : "No longer interested",
        description: newInterested 
          ? "You've been added to the interested list" 
          : "You've been removed from the interested list",
      });
    } catch (error) {
      console.error("Error updating interest status:", error);
      toast({
        title: "Error",
        description: "Could not update interest status",
        variant: "destructive",
      });
    }
  };
  
  // Handle share event
  const handleShare = async () => {
    try {
      // Create the URL for the event
      const eventUrl = `${window.location.origin}/events/${event.id}`;
      
      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: `Check out this event: ${event.title}`,
          url: eventUrl,
        });
        
        toast({
          title: "Shared successfully!",
          description: "Event has been shared",
        });
      } else {
        // Fallback to copying the URL to clipboard
        await navigator.clipboard.writeText(eventUrl);
        
        toast({
          title: "Link copied!",
          description: "Event link has been copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Error sharing event:", error);
      toast({
        title: "Error",
        description: "Could not share the event",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Link href={`/events/${event.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        {/* Event Image */}
        <div className="relative w-full h-48">
          {event.coverImage ? (
            <Image 
              src={event.coverImage} 
              alt={event.title} 
              fill 
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
              <Calendar className="h-12 w-12 text-white opacity-60" />
            </div>
          )}
          
          {/* Category Badge */}
          {event.category && (
            <Badge className="absolute top-3 left-3 bg-white/80 text-black hover:bg-white/90">
              {event.category}
            </Badge>
          )}
          
          {/* Price Badge */}
          <Badge 
            className={`absolute top-3 right-3 ${
              event.isFree 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            <Ticket className="h-3 w-3 mr-1" />
            {event.isFree ? 'Free' : event.price ? `$${event.price}` : 'Paid'}
          </Badge>
        </div>
        
        <CardContent className="pt-4">
          {/* Event Date & Location */}
          <div className="flex flex-col space-y-1 mb-2 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1.5" />
              <span>{formatEventDate()}</span>
            </div>
            
            {event.startTime && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1.5" />
                <span>
                  {event.startTime}
                  {event.endTime && ` - ${event.endTime}`}
                </span>
              </div>
            )}
            
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1.5" />
              <span>
                {event.location?.city}, {event.location?.country}
                {getDistanceText() && ` (${getDistanceText()})`}
              </span>
            </div>
          </div>
          
          {/* Event Title */}
          <h3 className="font-semibold text-lg line-clamp-2 mb-2">{event.title}</h3>
          
          {/* Event Description */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
            {event.description}
          </p>
          
          {/* Attendance Info */}
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <Users className="h-3.5 w-3.5 mr-1" />
            <span>
              {event.attendees?.length || 0} attending
              {event.interested?.length > 0 && `, ${event.interested.length} interested`}
            </span>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-0 pb-4">
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              variant={liked ? "default" : "outline"} 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLike();
              }}
              className={liked ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-white" : ""}`} />
            </Button>
            
            <Button 
              variant={attending ? "default" : "outline"} 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAttend();
              }}
            >
              <CheckCircle className={`h-4 w-4 ${attending ? "fill-white" : ""}`} />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleShare();
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Interested Button */}
          <Button 
            variant={interested ? "secondary" : "outline"} 
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleInterested();
            }}
          >
            {interested ? 'Interested' : 'Interested?'}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
} 