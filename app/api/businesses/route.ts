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

// Define a Business type
interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string | null;
  hoursOfOperation: string | null;
  socialMedia: Record<string, string> | null;
  category: string;
  city: string;
  state: string;
  description: string | null;
  images: string[];
  rating: string;
  ratingScore: number;
  reviewCount: number;
  reviews: any[];
  isPinned: boolean;
  userId: string;
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
  const lastDocId = searchParams.get('lastDocId');

  try {
    const businessesRef = collection(db, 'businesses');
    let q = query(businessesRef, orderBy('createdAt', 'desc'), limit(limitCount));

    // Apply filters
    if (category) {
      q = query(q, where('category', '==', category));
    }
    
    if (city) {
      q = query(q, where('city', '==', city));
    }
    
    if (state) {
      q = query(q, where('state', '==', state));
    }

    // If pagination is requested
    if (lastDocId) {
      // Get the last document
      const lastDocRef = doc(db, 'businesses', lastDocId);
      const lastDocSnap = await getDoc(lastDocRef);
      
      if (lastDocSnap.exists()) {
        q = query(q, startAfter(lastDocSnap));
      }
    }

    const querySnapshot = await getDocs(q);
    const businesses: Business[] = [];
    
    querySnapshot.forEach((doc) => {
      businesses.push({
        id: doc.id,
        ...doc.data()
      } as Business);
    });

    // Get the last document for pagination
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const lastId = lastVisible ? lastVisible.id : null;

    return NextResponse.json({ 
      businesses,
      page,
      limit: limitCount,
      lastDocId: lastId,
      hasMore: querySnapshot.docs.length === limitCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin if not already initialized
    initAdmin();
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'address', 'phone', 'category', 'city', 'state'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Create the business document
    const businessData = {
      name: body.name,
      address: body.address,
      phone: body.phone,
      email: body.email || null,
      hoursOfOperation: body.hoursOfOperation || null,
      socialMedia: body.socialMedia || null,
      category: body.category,
      city: body.city,
      state: body.state,
      description: body.description || null,
      images: body.images || [],
      rating: body.rating || 'silver',
      ratingScore: body.ratingScore || 0,
      reviewCount: body.reviewCount || 0,
      reviews: [],
      isPinned: body.isPinned || false,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'businesses'), businessData);

    return NextResponse.json({ 
      business: {
        id: docRef.id,
        ...businessData
      }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}