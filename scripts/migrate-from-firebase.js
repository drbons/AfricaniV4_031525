// scripts/migrate-from-firebase.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (error) {
  console.error('Error loading service account key:', error.message);
  console.error('Please place your Firebase service account key at serviceAccountKey.json');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});
const firestore = getFirestore();

// Initialize PostgreSQL connection
const pool = new Pool({
  host: process.env.RDS_HOSTNAME,
  port: process.env.RDS_PORT || 5432,
  database: process.env.RDS_DB_NAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD
});

async function migrateData() {
  try {
    console.log('Starting data migration...');
    
    // Create database tables
    await createTables();
    
    // Migrate users
    await migrateUsers();
    
    // Migrate businesses
    await migrateBusinesses();
    
    // Migrate other collections
    await migratePosts();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

async function createTables() {
  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      display_name VARCHAR(255),
      photo_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  
  // Create businesses table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS businesses (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(255),
      website VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      address TEXT,
      city VARCHAR(255),
      state VARCHAR(255),
      zip VARCHAR(20),
      owner_id VARCHAR(255) REFERENCES users(id),
      logo_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  
  // Create posts table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id VARCHAR(255) PRIMARY KEY,
      content TEXT,
      author_id VARCHAR(255) REFERENCES users(id),
      author_name VARCHAR(255),
      author_image TEXT,
      location VARCHAR(255),
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  
  // Create post media table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_media (
      id SERIAL PRIMARY KEY,
      post_id VARCHAR(255) REFERENCES posts(id),
      media_url TEXT NOT NULL,
      media_type VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  
  console.log('Database tables created successfully');
}

async function migrateUsers() {
  console.log('Migrating users...');
  const usersSnapshot = await firestore.collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    
    await pool.query(
      `INSERT INTO users (id, email, display_name, photo_url, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET 
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         photo_url = EXCLUDED.photo_url,
         updated_at = NOW()`,
      [
        doc.id,
        userData.email || '',
        userData.displayName || userData.name || '',
        userData.photoURL || '',
        userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : new Date()
      ]
    );
  }
  
  console.log(`Migrated ${usersSnapshot.docs.length} users`);
}

async function migrateBusinesses() {
  console.log('Migrating businesses...');
  const businessesSnapshot = await firestore.collection('businesses').get();
  
  for (const doc of businessesSnapshot.docs) {
    const businessData = doc.data();
    
    await pool.query(
      `INSERT INTO businesses (
        id, name, description, category, website, phone, email,
        address, city, state, zip, owner_id, logo_url, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         category = EXCLUDED.category,
         website = EXCLUDED.website,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         address = EXCLUDED.address,
         city = EXCLUDED.city,
         state = EXCLUDED.state,
         zip = EXCLUDED.zip,
         owner_id = EXCLUDED.owner_id,
         logo_url = EXCLUDED.logo_url,
         updated_at = NOW()`,
      [
        doc.id,
        businessData.name || '',
        businessData.description || '',
        businessData.category || '',
        businessData.website || '',
        businessData.phone || '',
        businessData.email || '',
        businessData.address || '',
        businessData.city || '',
        businessData.state || '',
        businessData.zip || '',
        businessData.ownerId || null,
        businessData.logoUrl || '',
        businessData.createdAt ? new Date(businessData.createdAt.seconds * 1000) : new Date()
      ]
    );
  }
  
  console.log(`Migrated ${businessesSnapshot.docs.length} businesses`);
}

async function migratePosts() {
  console.log('Migrating posts...');
  const postsSnapshot = await firestore.collection('posts').get();
  
  for (const doc of postsSnapshot.docs) {
    const postData = doc.data();
    
    // Insert the post
    await pool.query(
      `INSERT INTO posts (
        id, content, author_id, author_name, author_image, location,
        likes, comments, shares, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET 
         content = EXCLUDED.content,
         author_id = EXCLUDED.author_id,
         author_name = EXCLUDED.author_name,
         author_image = EXCLUDED.author_image,
         location = EXCLUDED.location,
         likes = EXCLUDED.likes,
         comments = EXCLUDED.comments,
         shares = EXCLUDED.shares,
         updated_at = NOW()`,
      [
        doc.id,
        postData.content || '',
        postData.authorId || '',
        postData.authorName || '',
        postData.authorImage || '',
        postData.location || '',
        postData.likes || 0,
        postData.comments || 0,
        postData.shares || 0,
        postData.createdAt ? new Date(postData.createdAt.seconds * 1000) : new Date()
      ]
    );
    
    // Insert media URLs if any
    if (postData.mediaUrls && Array.isArray(postData.mediaUrls)) {
      for (const mediaUrl of postData.mediaUrls) {
        await pool.query(
          `INSERT INTO post_media (post_id, media_url, media_type)
           VALUES ($1, $2, $3)`,
          [doc.id, mediaUrl, determineMediaType(mediaUrl)]
        );
      }
    }
  }
  
  console.log(`Migrated ${postsSnapshot.docs.length} posts`);
}

function determineMediaType(url) {
  // Simple function to determine media type from URL extension
  const extension = url.split('.').pop().toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return 'image';
  } else if (['mp4', 'webm', 'mov'].includes(extension)) {
    return 'video';
  } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
    return 'audio';
  } else {
    return 'file';
  }
}

// Run the migration
migrateData(); 