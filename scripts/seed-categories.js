/**
 * Seed Business Categories in Firestore
 * 
 * This script will populate the 'categories' collection in Firestore
 * with the initial set of business categories used in the profile page.
 * 
 * Run this script to ensure the Categories page displays the same
 * categories available for selection in the business profile.
 * 
 * Command: node scripts/seed-categories.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// IMPORTANT: Requires a service account key file for your Firebase project
// Download from: Firebase Console > Project Settings > Service Accounts
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Business categories matching those in the profile page
const BUSINESS_CATEGORIES = [
  {
    name: "Restaurants & Food Services",
    description: "Restaurants, cafes, bakeries, catering services, and food delivery",
    businessCount: 0
  },
  {
    name: "Retail",
    description: "Clothing stores, electronics, specialty shops, and online retail businesses",
    businessCount: 0
  },
  {
    name: "Health & Wellness",
    description: "Medical practices, fitness centers, spas, and wellness services",
    businessCount: 0
  },
  {
    name: "Home Services",
    description: "Cleaning, landscaping, home repair, and maintenance services",
    businessCount: 0
  },
  {
    name: "Automotive",
    description: "Auto repair, car dealerships, auto parts, and vehicle services",
    businessCount: 0
  },
  {
    name: "Professional Services",
    description: "Legal, accounting, consulting, and business support services",
    businessCount: 0
  },
  {
    name: "Beauty & Personal Care",
    description: "Salons, barber shops, cosmetics, and personal care services",
    businessCount: 0
  },
  {
    name: "Education & Childcare",
    description: "Schools, tutoring services, daycare centers, and educational resources",
    businessCount: 0
  },
  {
    name: "Entertainment & Recreation",
    description: "Event venues, recreational facilities, and entertainment services",
    businessCount: 0
  },
  {
    name: "Pets & Veterinary",
    description: "Pet stores, veterinary clinics, grooming, and animal care services",
    businessCount: 0
  },
  {
    name: "Travel & Hospitality",
    description: "Hotels, travel agencies, tourism services, and accommodations",
    businessCount: 0
  },
  {
    name: "Construction & Trades",
    description: "Construction companies, contractors, and skilled trade services",
    businessCount: 0
  },
  {
    name: "Events & Party Services",
    description: "Event planners, rental services, and party supply businesses",
    businessCount: 0
  },
  {
    name: "Nonprofits & Community Services",
    description: "Nonprofit organizations, community services, and social enterprises",
    businessCount: 0
  }
];

async function seedCategories() {
  console.log('Starting to seed categories...');
  
  const batch = db.batch();
  const categoriesRef = db.collection('categories');
  
  try {
    // First check if categories already exist
    const existingCategories = await categoriesRef.get();
    
    if (!existingCategories.empty) {
      console.log(`Found ${existingCategories.size} existing categories. Skipping seed.`);
      return;
    }
    
    // Add all categories to the batch
    for (const category of BUSINESS_CATEGORIES) {
      const docRef = categoriesRef.doc();
      batch.set(docRef, {
        ...category,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Commit the batch
    await batch.commit();
    console.log(`Successfully added ${BUSINESS_CATEGORIES.length} categories to Firestore.`);
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
}

// Run the seed function
seedCategories()
  .then(() => {
    console.log('Seed operation completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Seed operation failed:', error);
    process.exit(1);
  }); 