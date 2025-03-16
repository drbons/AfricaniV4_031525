import { NextResponse } from 'next/server';
import { app, auth, db } from '@/lib/firebase';
import { getApps } from 'firebase/app';
import { collection, getDocs, limit } from 'firebase/firestore';

export async function GET() {
  try {
    // Check Firebase initialization
    const isInitialized = getApps().length > 0;
    
    // Test Firestore connection
    let firestoreStatus = 'Unknown';
    let firestoreError = null;
    let collections = [];
    
    try {
      // Try to get a list of collections
      const snapshot = await getDocs(collection(db, 'posts'));
      firestoreStatus = 'Connected';
      collections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      firestoreStatus = 'Error';
      firestoreError = error instanceof Error ? error.message : String(error);
    }
    
    // Get Firebase config (without sensitive values)
    const firebaseConfig = {
      apiKeyProvided: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomainProvided: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectIdProvided: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucketProvided: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderIdProvided: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appIdProvided: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };
    
    return NextResponse.json({
      success: true,
      firebase: {
        isInitialized,
        config: firebaseConfig,
        firestore: {
          status: firestoreStatus,
          error: firestoreError,
          collections: collections.length > 0 ? `Found ${collections.length} documents` : 'No documents found'
        }
      }
    });
  } catch (error) {
    console.error('Error in test-firebase API route:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 