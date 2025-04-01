import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { sampleBusinesses } from './sampleData';

export async function seedBusinesses() {
  try {
    // Check if businesses already exist
    const businessesRef = collection(db, 'businesses');
    const q = query(businessesRef, where('userId', '==', 'sample'));
    const existingDocs = await getDocs(q);
    
    if (!existingDocs.empty) {
      console.log('Sample businesses already exist');
      return;
    }

    // Add sample businesses
    for (const business of sampleBusinesses) {
      const docRef = doc(businessesRef, business.id);
      await setDoc(docRef, {
        ...business,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('Successfully seeded sample businesses');
  } catch (error) {
    console.error('Error seeding businesses:', error);
    throw error;
  }
} 