import { getApps, initializeApp, cert, AppOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

export function initAdmin() {
  if (getApps().length === 0) {
    try {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      
      if (!projectId) {
        throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not defined');
      }
      
      // Check if we have a service account key
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          // Parse the service account key if it's a JSON string
          const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT_KEY === 'string' 
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
            : process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            
          initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
          console.log('Firebase Admin initialized with service account');
          return getFirestore();
        } catch (parseError) {
          console.error('Error parsing service account:', parseError);
          // Continue to fallback methods
        }
      }
      
      // Try application default credentials
      try {
        initializeApp({
          projectId,
          credential: admin.credential.applicationDefault()
        });
        console.log('Firebase Admin initialized with application default credentials');
        return getFirestore();
      } catch (adcError) {
        console.error('Error using application default credentials:', adcError);
      }
      
      // Last resort: initialize with just project ID
      initializeApp({
        projectId
      });
      console.log('Firebase Admin initialized with minimal configuration');
      
    } catch (error) {
      console.error('Firebase admin initialization error:', error);
      throw error; // Re-throw to make errors more visible
    }
  }
  
  return getFirestore();
}