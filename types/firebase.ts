export interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  hoursOfOperation?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    snapchat?: string;
    tiktok?: string;
  };
  category: string;
  city: string;
  state: string;
  rating?: 'silver' | 'gold' | 'platinum';
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
  description?: string;
  images?: string[];
  ratingScore?: number;
  reviewCount?: number;
  isPinned: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  images?: string[];
  city: string;
  state: string;
  category?: string;
  likes: number;
  comments: Comment[];
  shares: number;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isBusinessPromotion: boolean;
  businessId?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  fullName?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
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

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  category: string;
  images?: string[];
  location?: {
    name: string;
    coords?: {
      latitude: number;
      longitude: number;
    };
  };
  contact?: {
    email?: string;
    phone?: string;
  };
  sellerId: string;
  sellerName?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  status: 'active' | 'sold' | 'pending' | 'inactive';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  startTime: string | null;
  endTime: string | null;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    virtualMeetingUrl?: string | null;
  };
  coverImage: string | null;
  isFree: boolean;
  price: string | number | null;
  organizer: string;
  organizerEmail: string | null;
  organizerPhone: string | null;
  organizerPhotoURL: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdBy: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  status: 'active' | 'cancelled' | 'completed' | 'draft';
  attendees: string[]; // Array of user IDs
  interested: string[]; // Array of user IDs
  likes: string[]; // Array of user IDs
}

export interface EventComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  imageUrl?: string;
  createdAt: any; // Firestore Timestamp
}