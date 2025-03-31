"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  MessageSquare,
  Calendar,
  Heart,
  Users,
  Check,
  Trash2,
  Filter,
  SortDesc,
  Loader2,
  X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  userId: string;
  type: 'event' | 'chat' | 'interaction';
  message: string;
  read: boolean;
  createdAt: any;
  data: {
    sourceId?: string;
    sourceType?: string;
    sourceUserId?: string;
    sourceUserName?: string;
    sourceUserAvatar?: string;
    targetId?: string;
    targetType?: string;
    metadata?: any;
  };
}

type NotificationType = 'event' | 'chat' | 'interaction';
type NotificationStatus = 'all' | 'unread' | 'read';
type SortOrder = 'newest' | 'oldest';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<NotificationStatus>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    console.log('[Notifications Page] Auth state:', { user: !!user, authLoading });
    
    // Don't redirect during initial loading
    if (authLoading) {
      console.log('[Notifications Page] Auth still loading, waiting...');
      return;
    }

    // Only redirect if we're sure the user is not authenticated
    if (!user && !authLoading) {
      console.log('[Notifications Page] User not authenticated, redirecting to auth page');
      router.push('/auth');
      return;
    }

    // If we have a user, fetch notifications
    if (user) {
      console.log('[Notifications Page] User authenticated, fetching notifications');
      
      try {
        // Subscribe to notifications
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log('[Notifications Page] Snapshot received with', snapshot.docs.length, 'notifications');
          const notificationsList: Notification[] = [];
          snapshot.forEach((doc) => {
            notificationsList.push({
              id: doc.id,
              ...doc.data()
            } as Notification);
          });
          setNotifications(notificationsList);
          setLoading(false);
        }, (err) => {
          console.error('[Notifications Page] Error fetching notifications:', err);
          setError('Failed to load notifications');
          setLoading(false);
        });

        return () => {
          console.log('[Notifications Page] Cleaning up notification listener');
          unsubscribe();
        };
      } catch (err) {
        console.error('[Notifications Page] Error setting up notifications query:', err);
        setError('An error occurred while setting up notifications');
        setLoading(false);
      }
    }
  }, [user, authLoading, router]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'chat':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'interaction':
        return <Heart className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications
        .filter(n => !n.read)
        .forEach(notification => {
          const notificationRef = doc(db, 'notifications', notification.id);
          batch.update(notificationRef, { read: true });
        });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all notifications?')) return;
    
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      notifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.delete(notificationRef);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredNotifications = notifications
    .filter(notification => {
      if (selectedType !== 'all' && notification.type !== selectedType) return false;
      if (selectedStatus === 'unread' && notification.read) return false;
      if (selectedStatus === 'read' && !notification.read) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt.toDate()).getTime();
      const dateB = new Date(b.createdAt.toDate()).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
  // Show loading while authentication is in progress
  if (authLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-600">Checking authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  // Return null only if we're sure the user is not authenticated
  if (!user && !authLoading) return null;
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="ml-3 bg-[#00FF4C] text-black px-2 py-0.5 rounded-full text-sm font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark all as read
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as NotificationType | 'all')}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Types</option>
              <option value="event">Events</option>
              <option value="chat">Chats</option>
              <option value="interaction">Interactions</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as NotificationStatus)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

            <button
              onClick={() => setSortOrder(order => order === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
            >
              <SortDesc className={`h-4 w-4 mr-1 ${sortOrder === 'oldest' ? 'transform rotate-180' : ''}`} />
              {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            {error}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">You&apos;re all caught up!</p>
            <p className="text-gray-400 text-sm">No notifications to display.</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 hover:bg-gray-50 transition-colors",
                  !notification.read && "bg-green-50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.data.sourceUserAvatar ? (
                        <div className="relative h-10 w-10 rounded-full overflow-hidden">
                          <Image
                            src={notification.data.sourceUserAvatar}
                            alt={notification.data.sourceUserName || ''}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm text-gray-900",
                        !notification.read && "font-medium"
                      )}>
                        {notification.message}
                      </p>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <span>{formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}</span>
                        <span className="mx-1">•</span>
                        <span className="capitalize">{notification.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {notification.data.targetId && (
                  <div className="mt-2 ml-13">
                    <Link
                      href={`/${notification.data.targetType}/${notification.data.targetId}`}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
                    >
                      View {notification.data.targetType}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 