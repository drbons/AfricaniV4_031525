import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  getDoc, 
  doc, 
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  startAt,
  endAt 
} from 'firebase/firestore';
import { db } from './firebase';
import { BusinessProfile, BusinessFilterOptions, BusinessSearchResult, PaginationData } from './types';

/**
 * Fetch businesses with filtering, sorting, and pagination
 */
export async function fetchBusinesses(options: BusinessFilterOptions = {}): Promise<BusinessSearchResult> {
  try {
    const {
      category,
      state,
      city,
      searchTerm,
      sortBy = 'rating',
      sortDirection = 'desc',
      featured = false,
      page = 1,
      limit: pageLimit = 12
    } = options;

    let businessesRef = collection(db, 'businesses');
    let queryConstraints = [];

    // Add filters
    if (category) {
      queryConstraints.push(where('category', '==', category));
    }

    if (state) {
      queryConstraints.push(where('state', '==', state));
    }

    if (city) {
      queryConstraints.push(where('city', '==', city));
    }

    if (featured) {
      queryConstraints.push(where('isFeatured', '==', true));
    }

    // Add sorting
    if (sortBy === 'rating') {
      queryConstraints.push(orderBy('rating', sortDirection));
    } else if (sortBy === 'name') {
      queryConstraints.push(orderBy('name', sortDirection));
    } else if (sortBy === 'createdAt') {
      queryConstraints.push(orderBy('createdAt', sortDirection));
    }

    // Search by name (if no other filters are applied)
    if (searchTerm && searchTerm.trim() !== '') {
      // For Firestore, we need to use startAt and endAt for text search
      // This is a simple implementation and has limitations
      const searchTermLower = searchTerm.toLowerCase();
      queryConstraints.push(orderBy('name'));
      queryConstraints.push(startAt(searchTermLower));
      queryConstraints.push(endAt(searchTermLower + '\uf8ff'));
    }

    // Get total count first (for pagination)
    const countQuery = query(businessesRef, ...queryConstraints);
    const countSnapshot = await getDocs(countQuery);
    const totalItems = countSnapshot.size;
    const totalPages = Math.ceil(totalItems / pageLimit);

    // Add pagination
    if (page > 1 && totalItems > 0) {
      const prevPageQuery = query(
        businessesRef,
        ...queryConstraints,
        limit((page - 1) * pageLimit)
      );
      const prevPageSnapshot = await getDocs(prevPageQuery);
      const lastVisible = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
      
      if (lastVisible) {
        queryConstraints.push(startAfter(lastVisible));
      }
    }

    queryConstraints.push(limit(pageLimit));

    // Final query
    const finalQuery = query(businessesRef, ...queryConstraints);
    const snapshot = await getDocs(finalQuery);

    const businesses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BusinessProfile[];

    // Create pagination data
    const pagination: PaginationData = {
      currentPage: page,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    return { businesses, pagination };
  } catch (error) {
    console.error('Error fetching businesses:', error);
    throw error;
  }
}

/**
 * Fetch a single business by ID
 */
export async function fetchBusinessById(id: string): Promise<BusinessProfile | null> {
  try {
    const docRef = doc(db, 'businesses', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as BusinessProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching business by ID:', error);
    throw error;
  }
}

/**
 * Fetch featured businesses
 */
export async function fetchFeaturedBusinesses(limit: number = 6): Promise<BusinessProfile[]> {
  try {
    const q = query(
      collection(db, 'businesses'),
      where('isFeatured', '==', true),
      orderBy('rating', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BusinessProfile[];
  } catch (error) {
    console.error('Error fetching featured businesses:', error);
    throw error;
  }
}

/**
 * Get top rated businesses
 */
export async function fetchTopRatedBusinesses(limit: number = 6): Promise<BusinessProfile[]> {
  try {
    const q = query(
      collection(db, 'businesses'),
      orderBy('rating', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BusinessProfile[];
  } catch (error) {
    console.error('Error fetching top rated businesses:', error);
    throw error;
  }
}

/**
 * Get businesses by category
 */
export async function fetchBusinessesByCategory(category: string, limit: number = 10): Promise<BusinessProfile[]> {
  try {
    const q = query(
      collection(db, 'businesses'),
      where('category', '==', category),
      orderBy('rating', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BusinessProfile[];
  } catch (error) {
    console.error('Error fetching businesses by category:', error);
    throw error;
  }
} 