/**
 * Seed Sample Businesses in Firestore
 * 
 * This script will populate the businesses collection with sample data for
 * each category (3 businesses per category).
 * 
 * Run this script to provide initial data for the Business Directory feature.
 * 
 * Command: node scripts/seed-businesses.js
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

// Generate a random rating between 3 and 5 stars with .5 intervals
function generateRandomRating() {
  const ratings = [3, 3.5, 4, 4.5, 5];
  return ratings[Math.floor(Math.random() * ratings.length)];
}

// Generate random number of reviews between 5 and 50
function generateRandomReviewCount() {
  return Math.floor(Math.random() * 46) + 5;
}

// Generate a random description based on the category
function generateDescription(category, businessName) {
  const descriptions = {
    "Restaurants & Food Services": [
      `${businessName} offers a diverse menu of authentic cuisines made with locally-sourced ingredients. Join us for a memorable dining experience in a welcoming atmosphere.`,
      `At ${businessName}, we pride ourselves on delivering exceptional flavors and service. Our talented chefs create innovative dishes that celebrate both tradition and creativity.`,
      `${businessName} is a family-owned establishment serving hearty, homestyle meals. We've been part of the community for over 15 years, creating delicious memories.`
    ],
    "Retail": [
      `${businessName} provides high-quality products at competitive prices. Our carefully curated selection ensures customers find exactly what they need.`,
      `Discover unique items at ${businessName}, where we focus on sustainable, ethically-sourced merchandise. Shop with confidence knowing your purchase makes a difference.`,
      `${businessName} offers the latest trends and timeless classics. Our knowledgeable staff provides personalized service to help you find perfect items for any occasion.`
    ],
    "Health & Wellness": [
      `At ${businessName}, we take a holistic approach to wellness. Our certified practitioners create personalized plans to support your health journey.`,
      `${businessName} combines traditional wisdom with modern techniques to provide comprehensive health services. Your well-being is our primary focus.`,
      `${businessName} is dedicated to helping clients achieve optimal health. Our evidence-based approaches and compassionate care set us apart.`
    ],
    "Home Services": [
      `${businessName} delivers reliable, professional home maintenance solutions. Our skilled technicians treat your home with respect and attention to detail.`,
      `Trust ${businessName} for all your home service needs. We provide prompt, affordable, and quality workmanship with a 100% satisfaction guarantee.`,
      `${businessName} specializes in efficient home solutions. Our experienced team ensures your home functions perfectly, giving you peace of mind.`
    ],
    "Automotive": [
      `${businessName} provides expert automotive care with state-of-the-art diagnostic equipment. Our certified technicians keep your vehicle running at peak performance.`,
      `At ${businessName}, we combine technical expertise with honest customer service. Your vehicle deserves the best care, and that's exactly what we deliver.`,
      `${businessName} offers comprehensive automotive solutions at competitive prices. From routine maintenance to complex repairs, we handle it all with precision.`
    ],
    "Professional Services": [
      `${businessName} delivers tailored professional solutions to help your business thrive. Our experienced team provides strategic guidance and practical implementation.`,
      `At ${businessName}, we pride ourselves on attention to detail and commitment to excellence. Our professional expertise translates into tangible results for clients.`,
      `${businessName} combines industry knowledge with innovative approaches. We build long-term relationships based on trust, integrity, and consistent results.`
    ],
    "Beauty & Personal Care": [
      `${businessName} provides personalized beauty treatments in a relaxing environment. Our skilled professionals help you look and feel your absolute best.`,
      `Experience transformation at ${businessName}, where we blend artistry with expertise. Our comprehensive services cater to your unique beauty needs.`,
      `${businessName} is committed to enhancing your natural beauty. We use premium products and advanced techniques to deliver exceptional results.`
    ],
    "Education & Childcare": [
      `${businessName} creates a nurturing environment where children thrive. Our curriculum balances academic learning with creative exploration and social development.`,
      `At ${businessName}, we believe in empowering young minds. Our dedicated educators provide personalized attention to help each child reach their potential.`,
      `${businessName} offers a supportive community for growth and learning. We partner with families to create positive educational experiences and lasting memories.`
    ],
    "Entertainment & Recreation": [
      `${businessName} provides unforgettable entertainment experiences for all ages. Our diverse offerings ensure there's something for everyone to enjoy.`,
      `At ${businessName}, we create moments of joy and excitement. Join us for activities that stimulate the mind, energize the body, and lift the spirit.`,
      `${businessName} specializes in creating memorable recreational experiences. We combine fun with safety to deliver premium entertainment options.`
    ],
    "Pets & Veterinary": [
      `${businessName} offers compassionate care for your beloved pets. Our experienced team treats each animal with kindness, respect, and medical expertise.`,
      `At ${businessName}, we understand that pets are family. Our comprehensive services ensure your companions receive the highest standard of care.`,
      `${businessName} combines modern veterinary medicine with genuine compassion. We're dedicated to supporting the health and happiness of your pets throughout their lives.`
    ],
    "Travel & Hospitality": [
      `${businessName} creates extraordinary travel experiences tailored to your preferences. Let us handle the details while you enjoy the journey.`,
      `Experience exceptional service with ${businessName}. We combine luxury accommodations with authentic local experiences for truly memorable travels.`,
      `${businessName} specializes in seamless travel arrangements and unforgettable stays. Our attention to detail ensures your comfort and satisfaction.`
    ],
    "Construction & Trades": [
      `${businessName} delivers quality craftsmanship on every project. Our skilled team combines traditional techniques with modern innovation for superior results.`,
      `At ${businessName}, we build with integrity and precision. From concept to completion, we maintain the highest standards in materials and workmanship.`,
      `${businessName} brings your construction vision to life. Our experienced professionals manage projects efficiently, ensuring timely completion and excellent quality.`
    ],
    "Events & Party Services": [
      `${businessName} transforms ordinary gatherings into extraordinary events. Our creative team manages every detail to create seamless, memorable celebrations.`,
      `At ${businessName}, we believe every event should be special. We combine your vision with our expertise to create personalized celebrations.`,
      `${businessName} specializes in creating magical event experiences. From intimate gatherings to grand celebrations, we ensure every moment is perfect.`
    ],
    "Nonprofits & Community Services": [
      `${businessName} is dedicated to making a positive impact in our community. Our programs address critical needs while fostering dignity and empowerment.`,
      `At ${businessName}, we believe in the power of community. Our initiatives bring people together to create meaningful change and lasting solutions.`,
      `${businessName} works tirelessly to support those in need. Through collaboration and compassion, we strive to build a stronger, more inclusive community.`
    ],
    "Other": [
      `${businessName} provides specialized services tailored to your unique needs. Our innovative approaches and dedicated team ensure exceptional results.`,
      `At ${businessName}, we pride ourselves on thinking outside the box. Our customized solutions address complex challenges with creativity and expertise.`,
      `${businessName} combines industry knowledge with personalized service. We're committed to exceeding expectations and delivering outstanding value.`
    ]
  };

  const categoryDescriptions = descriptions[category] || descriptions["Other"];
  return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
}

// States and cities data for sample businesses
const locations = [
  { state: "NY", cities: ["New York City", "Buffalo", "Rochester", "Syracuse", "Albany"] },
  { state: "CA", cities: ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "Oakland"] },
  { state: "TX", cities: ["Houston", "Austin", "Dallas", "San Antonio", "Fort Worth"] },
  { state: "FL", cities: ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee"] },
  { state: "IL", cities: ["Chicago", "Springfield", "Peoria", "Naperville", "Rockford"] },
  { state: "GA", cities: ["Atlanta", "Savannah", "Augusta", "Columbus", "Macon"] }
];

// Social media handles
function generateSocialMedia() {
  const usesSocial = Math.random() > 0.3; // 70% chance to have social media
  
  if (!usesSocial) return {};
  
  return {
    facebook: Math.random() > 0.4 ? "businesspage" : "",
    twitter: Math.random() > 0.5 ? "businesshandle" : "",
    instagram: Math.random() > 0.3 ? "businessprofile" : ""
  };
}

// Sample business hours
const businessHours = [
  "Mon-Fri: 9AM-5PM, Sat: 10AM-3PM",
  "Mon-Sat: 8AM-8PM, Sun: 10AM-6PM",
  "Mon-Thu: 10AM-7PM, Fri-Sat: 10AM-9PM, Sun: 12PM-5PM",
  "Mon-Fri: 7AM-7PM, Weekends: 9AM-5PM",
  "Open Daily: 11AM-11PM",
  "Mon-Fri: 8:30AM-6:30PM, Closed Weekends"
];

// Sample business names for each category
const businessNamesByCategory = {
  "Restaurants & Food Services": [
    "Savory Plate Bistro", "Green Harvest Kitchen", "Urban Spice House", 
    "Coastal Flavors", "Sweet Maple Café", "The Hungry Scholar",
    "Fusion Bites", "Heritage Table", "Seasoned Soul"
  ],
  "Retail": [
    "Urban Threads Apparel", "Gadget Galaxy", "Eco Essentials", 
    "Timeless Treasures", "Modern Market", "Style Spectrum",
    "Homestead Goods", "The Curated Collection", "Artisan Avenue"
  ],
  "Health & Wellness": [
    "Vitality Wellness Center", "Serenity Spa & Health", "Balanced Body Clinic", 
    "Revive Holistic Health", "Mindful Movement Studio", "Harmony Healing Center",
    "Pure Life Wellness", "Radiant Health Collective", "Tranquil Touch Therapy"
  ],
  "Home Services": [
    "Premier Property Solutions", "Reliable Home Repairs", "Spotless Spaces Cleaning", 
    "Evergreen Lawn Care", "Complete Home Maintenance", "Modern Home Solutions",
    "Precision Plumbing", "Elite Electrical Services", "Total Home Comfort"
  ],
  "Automotive": [
    "Precision Auto Care", "Reliable Rides Repair", "Elite Engine Works", 
    "Swift Auto Solutions", "Master Mechanics", "Drive Right Auto Care",
    "Auto Excellence", "Trusted Transmission Experts", "Premium Auto Service"
  ],
  "Professional Services": [
    "Strategic Solutions Consulting", "Apex Accounting Services", "Clarity Legal Advisors", 
    "Innovative Business Solutions", "Precision Tax Professionals", "Forward Focus Consulting",
    "Excel Marketing Group", "Creative Design Collective", "Digital Solutions Agency"
  ],
  "Beauty & Personal Care": [
    "Elegant Expressions Salon", "Radiant Glow Skincare", "Transformations Hair Studio", 
    "Pure Beauty Collective", "Serene Day Spa", "Modern Image Salon",
    "Natural Essence Beauty", "The Style Studio", "Beauty & Balance Spa"
  ],
  "Education & Childcare": [
    "Bright Beginnings Learning Center", "Knowledge Tree Academy", "Creative Minds Childcare", 
    "Little Scholars Preschool", "Growing Futures Education", "Discovery Kids Daycare",
    "Stepping Stones Learning", "Young Explorers Academy", "Smart Start Education"
  ],
  "Entertainment & Recreation": [
    "Adventure Zone Family Fun", "Elite Escape Rooms", "Rhythm & Beats Music Center", 
    "Ultimate Gaming Lounge", "Active Life Fitness Club", "The Comedy Spot",
    "Dreamscape Virtual Reality", "Classic Cinema House", "Outdoor Adventure Tours"
  ],
  "Pets & Veterinary": [
    "Loving Care Animal Hospital", "Happy Tails Pet Resort", "Gentle Paws Veterinary", 
    "Furry Friends Pet Shop", "Premium Pet Care", "Complete Companion Animal Clinic",
    "Pawsitive Pet Training", "Healthy Hounds & Cats", "The Pet Wellness Center"
  ],
  "Travel & Hospitality": [
    "Wanderlust Travel Agency", "Comfort Inn & Suites", "Dream Destination Vacations", 
    "Global Getaways", "Luxury Stay Hotels", "Journey Experts Travel",
    "Restful Retreats Lodging", "Explore World Tours", "Premier Travel Solutions"
  ],
  "Construction & Trades": [
    "Solid Foundation Builders", "Precision Craft Construction", "Elite Electrical Services", 
    "Master Plumbing Solutions", "Quality Custom Homes", "Reliable Roofing Experts",
    "Pro Painting Services", "Complete Carpentry", "Innovative Improvements"
  ],
  "Events & Party Services": [
    "Memorable Moments Event Planning", "Celebration Specialists", "Perfect Day Weddings", 
    "Elite Entertainment Services", "Festive Occasions", "Dream Day Coordinators",
    "Stellar Event Production", "The Party Planners", "Gala & Gathering Experts"
  ],
  "Nonprofits & Community Services": [
    "Helping Hands Foundation", "Community Care Coalition", "Youth Empowerment Center", 
    "Hope & Healing Services", "Neighborhood Support Network", "The Outreach Initiative",
    "Better Tomorrow Society", "United Community Action", "Compassion Connection"
  ],
  "Other": [
    "Innovative Tech Solutions", "Green Earth Recycling", "Urban Farming Collective", 
    "Creative Studios Workshop", "Heritage Preservation Society", "Specialty Craft Supplies",
    "Custom Fabrication Works", "Unique Import Emporium", "Expert Translation Services"
  ]
};

// Generate phone numbers
function generatePhoneNumber() {
  return `(${Math.floor(Math.random() * 800) + 200}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

// Generate addresses
function generateAddress(city, state) {
  const streetNumber = Math.floor(Math.random() * 9000) + 1000;
  const streets = [
    "Main Street", "Oak Avenue", "Maple Drive", "Washington Boulevard", 
    "Park Road", "Cedar Lane", "Pine Street", "River Road", "Highland Avenue",
    "Elm Street", "Market Street", "Broadway", "Lake Drive", "Sunset Boulevard"
  ];
  const street = streets[Math.floor(Math.random() * streets.length)];
  
  return `${streetNumber} ${street}, ${city}, ${state}`;
}

// Generate a collection of sample reviews
function generateReviews(count) {
  const reviews = [];
  const reviewTexts = [
    "Great service and friendly staff!",
    "Exceeded my expectations. Definitely recommend!",
    "Very professional and high-quality work.",
    "Good experience overall. Would use their services again.",
    "Excellent value for the price. Very satisfied customer.",
    "Prompt service and attention to detail.",
    "The staff was knowledgeable and helpful.",
    "Outstanding quality and customer service.",
    "A bit pricey but worth every penny for the quality.",
    "Very responsive and accommodating to my needs.",
    "Consistently good service over multiple visits.",
    "Fantastic experience from start to finish!",
    "They really go above and beyond for their customers.",
    "Professional, efficient, and friendly service.",
    "Highly skilled team that delivers excellent results."
  ];
  
  const names = [
    "John S.", "Maria T.", "Robert J.", "Sarah L.", "David W.", 
    "Lisa M.", "Michael B.", "Emily C.", "James P.", "Jessica R.",
    "Daniel K.", "Amanda G.", "Thomas H.", "Samantha D.", "Kevin F.",
    "Nicole W.", "Christopher L.", "Michelle S.", "Brian T.", "Jennifer M."
  ];
  
  for (let i = 0; i < count; i++) {
    const rating = Math.floor(Math.random() * 3) + 3; // Ratings from 3-5
    const reviewText = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() - Math.floor(Math.random() * 365)); // Random date within last year
    
    reviews.push({
      id: `review${i + 1}`,
      userId: `user${Math.floor(Math.random() * 1000)}`,
      userName: name,
      rating: rating,
      comment: reviewText,
      createdAt: reviewDate
    });
  }
  
  return reviews;
}

// Sample business image URLs (you would have real URLs in a production environment)
const sampleImagesByCategory = {
  "Restaurants & Food Services": [
    "https://firebasestorage.googleapis.com/restaurants/sample1.jpg",
    "https://firebasestorage.googleapis.com/restaurants/sample2.jpg",
    "https://firebasestorage.googleapis.com/restaurants/sample3.jpg"
  ],
  "Retail": [
    "https://firebasestorage.googleapis.com/retail/sample1.jpg",
    "https://firebasestorage.googleapis.com/retail/sample2.jpg",
    "https://firebasestorage.googleapis.com/retail/sample3.jpg"
  ],
  // Add similar URLs for each category...
  "Other": [
    "https://firebasestorage.googleapis.com/other/sample1.jpg",
    "https://firebasestorage.googleapis.com/other/sample2.jpg",
    "https://firebasestorage.googleapis.com/other/sample3.jpg"
  ]
};

// Create sample business data
function createSampleBusinesses() {
  const businesses = [];
  const categories = Object.keys(businessNamesByCategory);
  
  categories.forEach(category => {
    const categoryBusinessNames = businessNamesByCategory[category];
    
    // Create 3 businesses per category
    for (let i = 0; i < 3; i++) {
      const businessName = categoryBusinessNames[i];
      const locationIndex = Math.floor(Math.random() * locations.length);
      const location = locations[locationIndex];
      const cityIndex = Math.floor(Math.random() * location.cities.length);
      const city = location.cities[cityIndex];
      const state = location.state;
      
      const rating = generateRandomRating();
      const reviewCount = generateRandomReviewCount();
      const reviews = generateReviews(reviewCount);
      
      // Calculate average rating from the reviews
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const calculatedRating = (totalRating / reviews.length).toFixed(1);
      
      const business = {
        id: `business-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${i + 1}`,
        name: businessName,
        category: category,
        categoryCustom: category === "Other" ? "Specialized Services" : "",
        description: generateDescription(category, businessName),
        address: generateAddress(city, state),
        city: city,
        state: state,
        phone: generatePhoneNumber(),
        website: Math.random() > 0.3 ? `https://www.${businessName.toLowerCase().replace(/\s+/g, '')}.com` : null,
        businessHours: businessHours[Math.floor(Math.random() * businessHours.length)],
        socialMedia: generateSocialMedia(),
        rating: parseFloat(calculatedRating),
        reviewCount: reviewCount,
        reviews: reviews,
        images: sampleImagesByCategory[category] || [],
        isFeatured: Math.random() < 0.2, // 20% chance to be featured
        ownerId: `sample-owner-${Math.floor(Math.random() * 10) + 1}`,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
        updatedAt: new Date()
      };
      
      businesses.push(business);
    }
  });
  
  return businesses;
}

// Main function to seed the database
async function seedBusinesses() {
  console.log('Starting to seed sample businesses...');
  
  try {
    // Check if businesses already exist
    const businessesRef = db.collection('businesses');
    const snapshot = await businessesRef.limit(1).get();
    
    if (!snapshot.empty) {
      console.log('Businesses already exist in the database. Skipping seed.');
      return;
    }
    
    const sampleBusinesses = createSampleBusinesses();
    console.log(`Created ${sampleBusinesses.length} sample businesses`);
    
    // Add businesses in batches (Firestore has a limit of 500 operations per batch)
    const batchSize = 20;
    let batch = db.batch();
    let operationCount = 0;
    let totalOperations = 0;
    
    for (const business of sampleBusinesses) {
      // Add to businesses collection
      const businessRef = businessesRef.doc(business.id);
      batch.set(businessRef, business);
      operationCount++;
      totalOperations++;
      
      // Add to category subcollection for quick category-based queries
      const categoryRef = db.collection('categories').doc(business.category).collection('businesses').doc(business.id);
      batch.set(categoryRef, {
        id: business.id,
        name: business.name,
        description: business.description,
        rating: business.rating,
        reviewCount: business.reviewCount,
        city: business.city,
        state: business.state,
        images: business.images && business.images.length > 0 ? [business.images[0]] : [],
        isFeatured: business.isFeatured,
        updatedAt: business.updatedAt
      });
      operationCount++;
      totalOperations++;
      
      // Add reviews as subcollection
      if (business.reviews && business.reviews.length > 0) {
        for (const review of business.reviews) {
          const reviewRef = businessRef.collection('reviews').doc(review.id);
          batch.set(reviewRef, review);
          operationCount++;
          totalOperations++;
          
          if (operationCount >= batchSize) {
            // Commit batch and start a new one
            await batch.commit();
            console.log(`Committed ${operationCount} operations`);
            batch = db.batch();
            operationCount = 0;
          }
        }
      }
      
      if (operationCount >= batchSize) {
        // Commit batch and start a new one
        await batch.commit();
        console.log(`Committed ${operationCount} operations`);
        batch = db.batch();
        operationCount = 0;
      }
    }
    
    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Committed final ${operationCount} operations`);
    }
    
    console.log(`Successfully added ${sampleBusinesses.length} businesses with a total of ${totalOperations} operations`);
  } catch (error) {
    console.error('Error seeding businesses:', error);
  }
}

// Run the seed function
seedBusinesses()
  .then(() => {
    console.log('Business seed operation completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Business seed operation failed:', error);
    process.exit(1);
  }); 