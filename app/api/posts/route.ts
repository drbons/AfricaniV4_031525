import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';

// Development mode flag - set to true to bypass Firebase authentication
const DEV_MODE = false;

// Mock user for development
const MOCK_USER = {
  uid: 'mock-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://picsum.photos/id/1/200',
};

// Define a Post type
interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  images: string[];
  city: string;
  state: string;
  category: string | null;
  likes: number;
  comments: any[];
  shares: number;
  isPinned: boolean;
  isBusinessPromotion: boolean;
  businessId: string | null;
  createdAt: any;
  updatedAt: any;
  [key: string]: any; // Allow for additional properties
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const city = searchParams.get('city');
  const state = searchParams.get('state');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const page = pageParam ? parseInt(pageParam) : 1;
  const limitCount = limitParam ? parseInt(limitParam) : 10;
  
  try {
    if (DEV_MODE) {
      // In development mode, return mock data from data.ts
      const { MOCK_POSTS } = await import('@/lib/data');
      
      // Apply filters if provided
      let filteredPosts = [...MOCK_POSTS];
      
      if (category) {
        filteredPosts = filteredPosts.filter(post => post.category === category);
      }
      
      if (city) {
        filteredPosts = filteredPosts.filter(post => post.city === city);
      }
      
      if (state) {
        filteredPosts = filteredPosts.filter(post => post.state === state);
      }
      
      // Paginate results
      const startIndex = (page - 1) * limitCount;
      const endIndex = startIndex + limitCount;
      const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
      
      return NextResponse.json({
        posts: paginatedPosts,
        hasMore: endIndex < filteredPosts.length,
        total: filteredPosts.length
      });
    }
    
    // Production code using Firebase
    const postsRef = collection(db, 'posts');
    let q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    
    // Apply filters if provided
    if (category) {
      q = query(q, where('category', '==', category));
    }
    
    if (city) {
      q = query(q, where('city', '==', city));
    }
    
    if (state) {
      q = query(q, where('state', '==', state));
    }
    
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      } as Post);
    });
    
    return NextResponse.json({
      posts,
      hasMore: posts.length === limitCount,
      total: posts.length
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, images, city, state, category, isBusinessPromotion, businessId } = body;
    
    // Get authorization token
    const authHeader = request.headers.get('authorization');
    
    if (DEV_MODE) {
      // In development mode, create a mock post
      console.log('DEV MODE: Creating post', body);
      
      const newPost = {
        id: `post-${Date.now()}`,
        userId: MOCK_USER.uid,
        userName: MOCK_USER.displayName,
        userAvatar: MOCK_USER.photoURL,
        content,
        images: images || [],
        city,
        state,
        category: category || null,
        likes: 0,
        comments: [],
        shares: 0,
        isPinned: false,
        isBusinessPromotion: isBusinessPromotion || false,
        businessId: businessId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return NextResponse.json({ post: newPost });
    }
    
    // Production code using Firebase
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const adminDb = initAdmin();
    const auth = getAuth();
    
    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get user profile
    const userDoc = await getDoc(doc(db, 'profiles', userId));
    const userData = userDoc.exists() ? userDoc.data() : null;
    
    // Create the post
    const postData = {
      userId,
      userName: userData?.fullName || 'Anonymous',
      userAvatar: userData?.avatarUrl || null,
      content,
      images: images || [],
      city,
      state,
      category: category || null,
      likes: 0,
      comments: [],
      shares: 0,
      isPinned: false,
      isBusinessPromotion: isBusinessPromotion || false,
      businessId: businessId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const postRef = await addDoc(collection(db, 'posts'), postData);
    
    return NextResponse.json({ 
      post: {
        id: postRef.id,
        ...postData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}