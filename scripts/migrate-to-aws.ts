import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDbPool, query, transaction } from '../lib/aws/db';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const firebaseApp = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const firestore = getFirestore(firebaseApp);

async function migrateUsers() {
  console.log('Migrating users...');
  const usersSnapshot = await firestore.collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    await query(
      `INSERT INTO users (id, email, display_name, photo_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       photo_url = EXCLUDED.photo_url,
       updated_at = CURRENT_TIMESTAMP`,
      [
        doc.id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.createdAt?.toDate() || new Date(),
        userData.updatedAt?.toDate() || new Date(),
      ]
    );
  }
  console.log(`Migrated ${usersSnapshot.size} users`);
}

async function migratePosts() {
  console.log('Migrating posts...');
  const postsSnapshot = await firestore.collection('posts').get();
  
  for (const doc of postsSnapshot.docs) {
    const postData = doc.data();
    await transaction(async (client) => {
      // Insert post
      await client.query(
        `INSERT INTO posts (id, user_id, content, image_url, like_count, comment_count, share_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
         content = EXCLUDED.content,
         image_url = EXCLUDED.image_url,
         like_count = EXCLUDED.like_count,
         comment_count = EXCLUDED.comment_count,
         share_count = EXCLUDED.share_count,
         updated_at = CURRENT_TIMESTAMP`,
        [
          doc.id,
          postData.userId,
          postData.content,
          postData.imageUrl,
          postData.likeCount || 0,
          postData.commentCount || 0,
          postData.shareCount || 0,
          postData.createdAt?.toDate() || new Date(),
          postData.updatedAt?.toDate() || new Date(),
        ]
      );

      // Migrate comments
      if (postData.comments) {
        for (const comment of postData.comments) {
          await client.query(
            `INSERT INTO comments (id, post_id, user_id, content, created_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [
              comment.id,
              doc.id,
              comment.userId,
              comment.text,
              comment.createdAt?.toDate() || new Date(),
            ]
          );
        }
      }

      // Migrate likes
      if (postData.likes) {
        for (const userId of Object.keys(postData.likes)) {
          await client.query(
            `INSERT INTO likes (post_id, user_id, created_at)
             VALUES ($1, $2, $3)
             ON CONFLICT (post_id, user_id) DO NOTHING`,
            [doc.id, userId, new Date()]
          );
        }
      }
    });
  }
  console.log(`Migrated ${postsSnapshot.size} posts`);
}

async function migrateCategories() {
  console.log('Migrating categories...');
  const categoriesSnapshot = await firestore.collection('categories').get();
  
  for (const doc of categoriesSnapshot.docs) {
    const categoryData = doc.data();
    await query(
      `INSERT INTO categories (id, name, description, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO UPDATE SET
       description = EXCLUDED.description`,
      [
        doc.id,
        categoryData.name,
        categoryData.description,
        categoryData.createdAt?.toDate() || new Date(),
      ]
    );
  }
  console.log(`Migrated ${categoriesSnapshot.size} categories`);
}

async function migrateBusinesses() {
  console.log('Migrating businesses...');
  const businessesSnapshot = await firestore.collection('businesses').get();
  
  for (const doc of businessesSnapshot.docs) {
    const businessData = doc.data();
    await query(
      `INSERT INTO businesses (
        id, user_id, name, description, category_id, location,
        contact_email, contact_phone, website_url, logo_url,
        rating, review_count, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      category_id = EXCLUDED.category_id,
      location = EXCLUDED.location,
      contact_email = EXCLUDED.contact_email,
      contact_phone = EXCLUDED.contact_phone,
      website_url = EXCLUDED.website_url,
      logo_url = EXCLUDED.logo_url,
      rating = EXCLUDED.rating,
      review_count = EXCLUDED.review_count,
      updated_at = CURRENT_TIMESTAMP`,
      [
        doc.id,
        businessData.userId,
        businessData.name,
        businessData.description,
        businessData.categoryId,
        businessData.location,
        businessData.contactEmail,
        businessData.contactPhone,
        businessData.websiteUrl,
        businessData.logoUrl,
        businessData.rating || 0,
        businessData.reviewCount || 0,
        businessData.createdAt?.toDate() || new Date(),
        businessData.updatedAt?.toDate() || new Date(),
      ]
    );
  }
  console.log(`Migrated ${businessesSnapshot.size} businesses`);
}

async function main() {
  try {
    // Ensure database connection
    await getDbPool();

    // Run migrations in sequence
    await migrateUsers();
    await migrateCategories();
    await migratePosts();
    await migrateBusinesses();

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 