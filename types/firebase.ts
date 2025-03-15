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