export type Post = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  images: string[];
  city: string;
  state: string;
  category?: string;
  likes: number;
  comments: any[];
  shares: number;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isBusinessPromotion: boolean;
  businessId?: string;
};

export type Business = {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  hoursOfOperation: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    snapchat?: string;
    tiktok?: string;
  };
  rating: 'silver' | 'gold' | 'platinum';
  ratingScore: number;
  reviewCount: number;
  images: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  reviews?: any[];
};

export type State = {
  name: string;
  abbreviation: string;
  cities: string[];
};

export const STATES: State[] = [
  {
    name: 'Alabama',
    abbreviation: 'AL',
    cities: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville']
  },
  {
    name: 'Alaska',
    abbreviation: 'AK',
    cities: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka']
  },
  {
    name: 'Arizona',
    abbreviation: 'AZ',
    cities: ['Phoenix', 'Tucson', 'Mesa', 'Chandler']
  },
  {
    name: 'Arkansas',
    abbreviation: 'AR',
    cities: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale']
  },
  {
    name: 'California',
    abbreviation: 'CA',
    cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento']
  }
];

export const CATEGORIES = [
  'Restaurants',
  'Real Estate',
  'Medical Professionals',
  'Education',
  'Retail',
  'Services',
  'Entertainment',
  'Technology',
  'Construction',
  'Transportation',
  'Beauty',
  'For Sale'
];

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'John Doe',
    userAvatar: 'https://picsum.photos/id/1/200',
    content: 'Just opened my new restaurant in downtown Birmingham! Come check us out for authentic African cuisine.',
    images: ['https://picsum.photos/id/292/800/600', 'https://picsum.photos/id/431/800/600'],
    city: 'Birmingham',
    state: 'AL',
    likes: 24,
    comments: [],
    shares: 3,
    createdAt: '2023-05-15T14:30:00Z',
    updatedAt: '2023-05-15T14:30:00Z',
    isPinned: true,
    isBusinessPromotion: true,
    businessId: 'business1'
  }
];

export const MOCK_BUSINESSES: Business[] = [
  {
    id: 'business1',
    name: 'African Delights Restaurant',
    category: 'Restaurants',
    description: 'Authentic African cuisine in the heart of Birmingham.',
    address: '123 Main St, Birmingham, AL 35203',
    city: 'Birmingham',
    state: 'AL',
    phone: '(205) 555-1234',
    email: 'info@africandelights.com',
    hoursOfOperation: 'Mon-Sat: 11AM-10PM, Sun: 12PM-8PM',
    socialMedia: {
      facebook: 'africandelights',
      instagram: 'african_delights',
      twitter: 'africandelights'
    },
    rating: 'gold',
    ratingScore: 4.5,
    reviewCount: 127,
    images: ['https://picsum.photos/id/292/800/600', 'https://picsum.photos/id/431/800/600'],
    isPinned: true,
    createdAt: '2023-05-15T14:30:00Z',
    updatedAt: '2023-05-15T14:30:00Z',
    reviews: []
  }
];

export const NEARBY_ADDRESSES = [
  '2761 FM 78 Unit C, 1 mi away',
  '2765 FM 78 Unit A, 1.2 mi away',
  '2770 FM 78, 1.3 mi away',
  '2780 FM 78 Suite 101, 1.5 mi away',
  '2790 FM 78, 1.7 mi away',
  '2800 FM 78 Unit D, 1.9 mi away',
  '2810 FM 78, 2.1 mi away',
  '2820 FM 78 Suite 200, 2.3 mi away',
  '2830 FM 78, 2.5 mi away',
  '2840 FM 78 Unit B, 2.7 mi away'
];