"use client";

import { useState, useEffect } from 'react';
import { Event } from '@/types/firebase';
import { User } from 'firebase/auth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Heart, 
  Share2, 
  CheckCircle, 
  User as UserIcon,
  ExternalLink,
  Tag
} from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';

interface EventDetailProps {
  event: Event;
  currentUser: User;
}

export default function EventDetail({ event, currentUser }: EventDetailProps) {
  const [liked, setLiked] = useState(false);
  const [attending, setAttending] = useState(false);
  const [interested, setInterested] = useState(false);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [interestedUsers, setInterestedUsers] = useState<string[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if the current user likes, is attending, or is interested in this event
    if (event && currentUser) {
      setLiked(event.likes?.includes(currentUser.uid) || false);
      setAttending(event.attendees?.includes(currentUser.uid) || false);
      setInterested(event.interested?.includes(currentUser.uid) || false);
      
      setLikes(event.likes || []);
      setAttendees(event.attendees || []);
      setInterestedUsers(event.interested || []);
      setLoading(false);
    }
  }, [event, currentUser]);

  const handleLike = async () => {
    if (!event || !currentUser) return;

    try {
      const eventRef = doc(db, 'events', event.id);
      const newLiked = !liked;
      
      // Update Firestore
      await updateDoc(eventRef, {
        likes: newLiked 
          ? arrayUnion(currentUser.uid) 
          : arrayRemove(currentUser.uid)
      });

      // Update local state
      setLiked(newLiked);
      setLikes(newLiked 
        ? [...likes, currentUser.uid] 
        : likes.filter(id => id !== currentUser.uid)
      );

      // Send notification to event creator
      if (newLiked && event.createdBy !== currentUser.uid) {
        const notificationId = uuidv4();
        const notificationRef = doc(db, 'notifications', notificationId);
        await setDoc(notificationRef, {
          id: notificationId,
          recipientId: event.createdBy,
          senderId: currentUser.uid,
          senderName: currentUser.displayName,
          senderPhotoURL: currentUser.photoURL,
          type: 'event_like',
          read: false,
          eventId: event.id,
          eventTitle: event.title,
          createdAt: new Date().toISOString(),
        });
      }

      toast({
        title: newLiked ? "Event liked!" : "Event unliked",
        description: newLiked 
          ? "This event has been added to your likes"
          : "This event has been removed from your likes",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating like status:", error);
      toast({
        title: "Error",
        description: "Could not update like status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAttendance = async () => {
    if (!event || !currentUser) return;

    try {
      const eventRef = doc(db, 'events', event.id);
      const newAttending = !attending;
      
      // Update Firestore
      await updateDoc(eventRef, {
        attendees: newAttending 
          ? arrayUnion(currentUser.uid) 
          : arrayRemove(currentUser.uid),
        // If user is now attending, remove from interested list
        ...(newAttending && interested 
          ? { interested: arrayRemove(currentUser.uid) } 
          : {})
      });

      // Update local state
      setAttending(newAttending);
      setAttendees(newAttending 
        ? [...attendees, currentUser.uid] 
        : attendees.filter(id => id !== currentUser.uid)
      );

      // If user is now attending, remove from interested
      if (newAttending && interested) {
        setInterested(false);
        setInterestedUsers(interestedUsers.filter(id => id !== currentUser.uid));
      }

      // Send notification to event creator
      if (newAttending && event.createdBy !== currentUser.uid) {
        const notificationId = uuidv4();
        const notificationRef = doc(db, 'notifications', notificationId);
        await setDoc(notificationRef, {
          id: notificationId,
          recipientId: event.createdBy,
          senderId: currentUser.uid,
          senderName: currentUser.displayName,
          senderPhotoURL: currentUser.photoURL,
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
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating attendance status:", error);
      toast({
        title: "Error",
        description: "Could not update attendance status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInterested = async () => {
    if (!event || !currentUser) return;

    try {
      const eventRef = doc(db, 'events', event.id);
      const newInterested = !interested;
      
      // Update Firestore
      await updateDoc(eventRef, {
        interested: newInterested 
          ? arrayUnion(currentUser.uid) 
          : arrayRemove(currentUser.uid),
        // If user is now interested, remove from attendees list
        ...(newInterested && attending 
          ? { attendees: arrayRemove(currentUser.uid) } 
          : {})
      });

      // Update local state
      setInterested(newInterested);
      setInterestedUsers(newInterested 
        ? [...interestedUsers, currentUser.uid] 
        : interestedUsers.filter(id => id !== currentUser.uid)
      );

      // If user is now interested, remove from attendees
      if (newInterested && attending) {
        setAttending(false);
        setAttendees(attendees.filter(id => id !== currentUser.uid));
      }

      // Send notification to event creator
      if (newInterested && event.createdBy !== currentUser.uid) {
        const notificationId = uuidv4();
        const notificationRef = doc(db, 'notifications', notificationId);
        await setDoc(notificationRef, {
          id: notificationId,
          recipientId: event.createdBy,
          senderId: currentUser.uid,
          senderName: currentUser.displayName,
          senderPhotoURL: currentUser.photoURL,
          type: 'event_interested',
          read: false,
          eventId: event.id,
          eventTitle: event.title,
          createdAt: new Date().toISOString(),
        });
      }

      toast({
        title: newInterested ? "Marked as interested!" : "No longer interested",
        description: newInterested 
          ? "You've been added to the interested list"
          : "You've been removed from the interested list",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating interest status:", error);
      toast({
        title: "Error",
        description: "Could not update interest status. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          description: "Event has been shared.",
          variant: "default",
        });
      } else {
        // Fallback to copying the URL to clipboard
        await navigator.clipboard.writeText(eventUrl);
        
        toast({
          title: "Link copied!",
          description: "Event link has been copied to clipboard.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error sharing event:", error);
      toast({
        title: "Error",
        description: "Could not share the event. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading event details...</div>;
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Event Header with Cover Image */}
      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
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
            <Calendar className="w-16 h-16 text-white opacity-50" />
          </div>
        )}
      </div>

      {/* Event Title and Quick Info */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <div className="flex flex-wrap gap-2">
            {event.category && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {event.category}
              </Badge>
            )}
            {event.isFree ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Free Event</Badge>
            ) : event.price ? (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                {typeof event.price === 'number' 
                  ? `$${event.price.toFixed(2)}` 
                  : event.price}
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={liked ? "default" : "outline"} 
            size="sm" 
            onClick={handleLike}
            className={liked ? "bg-red-500 hover:bg-red-600" : ""}
          >
            <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-white" : ""}`} />
            {likes.length > 0 ? likes.length : ''} {liked ? 'Liked' : 'Like'}
          </Button>
          
          <Button 
            variant={attending ? "default" : "outline"} 
            size="sm" 
            onClick={handleAttendance}
          >
            <CheckCircle className={`h-4 w-4 mr-1 ${attending ? "fill-white" : ""}`} />
            {attending ? 'Attending' : 'Attend'}
          </Button>
          
          <Button 
            variant={interested ? "secondary" : "outline"} 
            size="sm" 
            onClick={handleInterested}
          >
            <Calendar className="h-4 w-4 mr-1" />
            {interested ? 'Interested' : 'Interested'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Event Date, Time & Location */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-2">
            <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium">Date</p>
              <p className="text-gray-600">
                {event.startDate && format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}
                {event.endDate && event.endDate !== event.startDate && (
                  <> - {format(new Date(event.endDate), 'EEEE, MMMM d, yyyy')}</>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium">Time</p>
              <p className="text-gray-600">
                {event.startTime && format(new Date(`2000-01-01T${event.startTime}`), 'h:mm a')}
                {event.endTime && (
                  <> - {format(new Date(`2000-01-01T${event.endTime}`), 'h:mm a')}</>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-gray-600">{event.location?.address || 'Location not specified'}</p>
              {event.location?.city && event.location?.country && (
                <p className="text-gray-600">{event.location.city}, {event.location.country}</p>
              )}
              {event.location?.virtualMeetingUrl && (
                <a 
                  href={event.location.virtualMeetingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center mt-1"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Virtual Meeting Link
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Details Tabs */}
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="attendees">
            Attendees ({attendees.length})
          </TabsTrigger>
          <TabsTrigger value="interested">
            Interested ({interestedUsers.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="mt-4 space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <div className="text-gray-700 whitespace-pre-line">
              {event.description || 'No description provided.'}
            </div>
          </div>
          
          {event.organizer && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2">Organizer</h3>
              <div className="flex items-center space-x-2">
                {event.organizerPhotoURL ? (
                  <Image 
                    src={event.organizerPhotoURL} 
                    alt={event.organizer} 
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{event.organizer}</p>
                  {event.organizerEmail && (
                    <p className="text-sm text-gray-600">{event.organizerEmail}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="attendees" className="mt-4">
          {attendees.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No attendees yet. Be the first to attend!</p>
          ) : (
            <p className="text-center py-8 text-gray-500">
              {attendees.length} {attendees.length === 1 ? 'person' : 'people'} attending
            </p>
            // In a real app, you would fetch and display attendee profiles here
          )}
        </TabsContent>
        
        <TabsContent value="interested" className="mt-4">
          {interestedUsers.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No one has shown interest yet.</p>
          ) : (
            <p className="text-center py-8 text-gray-500">
              {interestedUsers.length} {interestedUsers.length === 1 ? 'person' : 'people'} interested
            </p>
            // In a real app, you would fetch and display interested user profiles here
          )}
        </TabsContent>
      </Tabs>

      {/* Additional Information */}
      {(event.website || event.contactEmail || event.contactPhone) && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Additional Information</h3>
          <Separator className="my-2" />
          <div className="space-y-2">
            {event.website && (
              <a 
                href={event.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Event Website
              </a>
            )}
            {event.contactEmail && (
              <p className="flex items-center">
                <span className="font-medium mr-2">Email:</span>
                <a href={`mailto:${event.contactEmail}`} className="text-blue-600 hover:underline">
                  {event.contactEmail}
                </a>
              </p>
            )}
            {event.contactPhone && (
              <p className="flex items-center">
                <span className="font-medium mr-2">Phone:</span>
                <a href={`tel:${event.contactPhone}`} className="text-blue-600 hover:underline">
                  {event.contactPhone}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 