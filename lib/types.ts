import { Timestamp } from 'firebase/firestore';

// Business Profile Interface
export interface BusinessProfile {
  id: string;
  name: string;
  category: string;
  categoryCustom?: string;
  description?: string;
  address: string;
  city?: string;
  state?: string;
  phone: string;
  website?: string;
  businessHours?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  images?: string[];
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Review Interface
export interface BusinessReview {
  id: string;
  userId: string;
  userName: string;
  businessId?: string;
  rating: number;
  comment: string;
  createdAt: Timestamp | Date;
}

// Business Search/Filter Options
export interface BusinessFilterOptions {
  category?: string;
  state?: string;
  city?: string;
  searchTerm?: string;
  sortBy?: 'rating' | 'name' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  featured?: boolean;
  page?: number;
  limit?: number;
}

// Pagination Data
export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Search Result
export interface BusinessSearchResult {
  businesses: BusinessProfile[];
  pagination: PaginationData;
} 