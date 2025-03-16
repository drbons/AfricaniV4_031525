// Seed script for marketplace listings
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} = require('firebase/firestore');

// Initialize Firebase (replace with your config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample users
const users = [
  {
    id: 'user1',
    name: 'John Smith',
    email: 'john.smith@example.com'
  },
  {
    id: 'user2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com'
  },
  {
    id: 'user3',
    name: 'Michael Williams',
    email: 'michael.williams@example.com'
  }
];

// Sample listings
const sampleListings = [
  // User 1 Listings
  {
    title: 'iPhone 13 Pro - Excellent Condition',
    description: 'Selling my iPhone 13 Pro (128GB) in excellent condition. Comes with original box, charger, and a case. Battery health at 92%. No scratches or dents.',
    price: 699,
    isFree: false,
    condition: 'good',
    category: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1592286927505-1def25115558?q=80&w=1000&auto=format&fit=crop'
    ],
    location: {
      name: 'Atlanta, GA',
      coords: {
        latitude: 33.749,
        longitude: -84.388
      }
    },
    contact: {
      email: 'john.smith@example.com',
      phone: '404-555-1234'
    },
    sellerId: 'user1',
    sellerName: 'John Smith',
    status: 'active'
  },
  {
    title: 'Leather Sofa - Like New',
    description: 'Beautiful brown leather sofa in like-new condition. Only used in a smoke-free, pet-free home for 6 months. Moving and need to sell quickly.',
    price: 850,
    isFree: false,
    condition: 'like-new',
    category: 'furniture',
    images: [
      'https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1000&auto=format&fit=crop'
    ],
    location: {
      name: 'Atlanta, GA',
      coords: {
        latitude: 33.749,
        longitude: -84.388
      }
    },
    contact: {
      email: 'john.smith@example.com',
      phone: '404-555-1234'
    },
    sellerId: 'user1',
    sellerName: 'John Smith',
    status: 'active'
  },
  
  // User 2 Listings
  {
    title: 'Mountain Bike - Trek X-Caliber 8',
    description: 'Trek X-Caliber 8 mountain bike, size medium. Great condition with recent tune-up. Hydraulic disc brakes, 29" wheels. Perfect for trails and casual riding.',
    price: 650,
    isFree: false,
    condition: 'good',
    category: 'sports & outdoors',
    images: [
      'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1000&auto=format&fit=crop'
    ],
    location: {
      name: 'Marietta, GA',
      coords: {
        latitude: 33.952,
        longitude: -84.549
      }
    },
    contact: {
      email: 'sarah.johnson@example.com',
      phone: '770-555-6789'
    },
    sellerId: 'user2',
    sellerName: 'Sarah Johnson',
    status: 'active'
  },
  {
    title: 'Free Books - Fiction Collection',
    description: 'Giving away my collection of fiction books. Includes novels by Stephen King, James Patterson, and John Grisham. All in good condition. Must pick up.',
    price: 0,
    isFree: true,
    condition: 'good',
    category: 'books',
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000&auto=format&fit=crop'
    ],
    location: {
      name: 'Marietta, GA',
      coords: {
        latitude: 33.952,
        longitude: -84.549
      }
    },
    contact: {
      email: 'sarah.johnson@example.com',
      phone: '770-555-6789'
    },
    sellerId: 'user2',
    sellerName: 'Sarah Johnson',
    status: 'active'
  },
  
  // User 3 Listings
  {
    title: 'Acoustic Guitar - Martin DX1AE',
    description: 'Martin DX1AE acoustic-electric guitar. Solid Sitka spruce top with HPL mahogany back and sides. Fishman electronics. Includes hard case and accessories.',
    price: 499,
    isFree: false,
    condition: 'good',
    category: 'musical instruments',
    images: [
      'https://images.unsplash.com/photo-1550291652-6ea9114a47b1?q=80&w=1000&auto=format&fit=crop'
    ],
    location: {
      name: 'Decatur, GA',
      coords: {
        latitude: 33.774,
        longitude: -84.296
      }
    },
    contact: {
      email: 'michael.williams@example.com',
      phone: '404-555-9876'
    },
    sellerId: 'user3',
    sellerName: 'Michael Williams',
    status: 'active'
  },
  {
    title: 'Gaming PC - High-End Custom Build',
    description: 'Custom gaming PC with RTX 3080, AMD Ryzen 9 5900X, 32GB RAM, 1TB NVMe SSD, 2TB HDD. Liquid cooling, RGB lighting. Perfect for gaming and content creation.',
    price: 1800,
    isFree: false,
    condition: 'like-new',
    category: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=1000&auto=format&fit=crop'
    ],
    location: {
      name: 'Decatur, GA',
      coords: {
        latitude: 33.774,
        longitude: -84.296
      }
    },
    contact: {
      email: 'michael.williams@example.com',
      phone: '404-555-9876'
    },
    sellerId: 'user3',
    sellerName: 'Michael Williams',
    status: 'active'
  },
  {
    title: 'Vintage Record Player',
    description: 'Beautiful vintage record player from the 1970s. Fully functional and recently serviced. Great sound quality and a perfect decorative piece.',
    price: 225,
    isFree: false,
    condition: 'fair',
    category: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1593078166039-c9878df5c520?q=80&w=1000&auto=format&fit=crop'
    ],
    location: {
      name: 'Decatur, GA',
      coords: {
        latitude: 33.774,
        longitude: -84.296
      }
    },
    contact: {
      email: 'michael.williams@example.com',
      phone: '404-555-9876'
    },
    sellerId: 'user3',
    sellerName: 'Michael Williams',
    status: 'active'
  }
];

// Function to add listings to Firestore
async function seedMarketplace() {
  try {
    console.log('Starting to seed marketplace...');
    
    for (const listing of sampleListings) {
      // Add timestamp fields
      const listingWithTimestamp = {
        ...listing,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'listings'), listingWithTimestamp);
      console.log(`Added listing: ${listing.title} with ID: ${docRef.id}`);
    }
    
    console.log('Marketplace seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding marketplace:', error);
  }
}

// Run the seed function
seedMarketplace(); 