import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  Auth,
  connectAuthEmulator
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { 
  getStorage, 
  FirebaseStorage,
  connectStorageEmulator,
  ref
} from 'firebase/storage';

// Determine if we're in development mode
const isDev = process.env.NODE_ENV === 'development';
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Logging function for development mode only
const logFirebase = (message: string, data?: any) => {
  if (isDev) {
    console.log(`[Firebase] ${message}`, data || '');
  }
};

// Log Firebase config for debugging (without sensitive values)
logFirebase('Config loaded', {
  apiKeyProvided: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomainProvided: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectIdProvided: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucketProvided: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderIdProvided: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appIdProvided: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID
});

// Initialize Firebase with error handling
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;

try {
  // Initialize Firebase app 
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  logFirebase('Firebase app initialized');
  
  // Initialize Auth
  auth = getAuth(app);
  logFirebase('Firebase Auth initialized');
  
  // Initialize Firestore with performance settings
  if (typeof window !== 'undefined') {
    // Only use persistence and caching on the client side
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    logFirebase('Firestore initialized with persistence');

    // Enable offline persistence with multi-tab support
    enableMultiTabIndexedDbPersistence(db)
      .then(() => logFirebase('Firestore multi-tab persistence enabled'))
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, only enable caching
          logFirebase('Firestore persistence unavailable in multiple tabs');
        } else if (err.code === 'unimplemented') {
          // Browser doesn't support persistence
          logFirebase('Firestore persistence not supported in this browser');
        }
      });
  } else {
    // On server-side, just initialize Firestore normally
    db = getFirestore(app);
    logFirebase('Firestore initialized (server-side)');
  }
  
  // Initialize Storage
  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    logFirebase('Storage bucket not configured', {
      error: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable is missing'
    });
  }
  
  storage = getStorage(app);
  
  // Verify storage was initialized correctly
  try {
    const testRef = ref(storage, 'test');
    logFirebase('Firebase Storage initialized and working', {
      testRef: !!testRef,
      storageBucket: storage.app.options.storageBucket
    });
  } catch (storageError) {
    console.error('[Firebase] Storage initialization issue:', storageError);
  }
  
  // Initialize Google Auth Provider
  googleProvider = new GoogleAuthProvider();
  logFirebase('Google Auth Provider initialized');
  
  // Connect to emulators if in development and emulators are enabled
  if (isDev && useEmulators) {
    // Use localhost for emulators
    logFirebase('Connecting to Firebase emulators');
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  }
  
  logFirebase('Initialized successfully');
} catch (error) {
  console.error('[Firebase] Error initializing:', error);
  
  // Provide more specific error messaging
  if (typeof window !== 'undefined') {
    // Only log this in the browser
    console.error('[Firebase] Check your environment variables and Firebase configuration');
    console.error('[Firebase] Current config:', {
      apiKeyExists: !!firebaseConfig.apiKey,
      authDomainExists: !!firebaseConfig.authDomain,
      projectIdExists: !!firebaseConfig.projectId,
      storageBucketExists: !!firebaseConfig.storageBucket,
      messagingSenderIdExists: !!firebaseConfig.messagingSenderId,
      appIdExists: !!firebaseConfig.appId
    });
  }

  // Fallback to empty objects if Firebase fails to initialize
  // This prevents the app from crashing completely
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
  googleProvider = {} as GoogleAuthProvider;
}

export { app, auth, db, storage, googleProvider };

// Helper functions for optimized Firestore operations
export const firestoreUtils = {
  /**
   * Converts Firestore timestamp to JavaScript Date
   */
  timestampToDate: (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp;
    try {
      return timestamp.toDate();
    } catch (e) {
      console.error('[Firebase] Error converting timestamp:', e);
      return null;
    }
  },
  
  /**
   * Creates a cache key for memoizing Firestore results
   */
  createCacheKey: (collectionPath: string, query?: any): string => {
    return `${collectionPath}:${JSON.stringify(query || {})}`;
  }
};