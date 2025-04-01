/**
 * Firebase Index Creation Helper
 * 
 * This script provides instructions on how to create the necessary Firebase
 * index that's required for the "My Posts" query.
 * 
 * The error message is pointing to a URL that you should visit to create
 * the composite index for your Firestore database.
 * 
 * Steps:
 * 1. Visit the URL from the error message:
 *    https://console.firebase.google.com/v1/r/project/africaniv2/firestore/indexes?create_composite=Ckhwcm9qZWN0cy9hZnJpY2FuaXYyL2RhdGFiYXNlcy8oZG
 * 
 * 2. This should take you to the Firebase console and present you with a pre-filled
 *    form to create the necessary composite index.
 * 
 * 3. Alternatively, if the link doesn't work, you can manually create the index:
 *    - Go to your Firebase console (https://console.firebase.google.com/)
 *    - Select your project "africaniv2"
 *    - Navigate to Firestore Database
 *    - Click on the "Indexes" tab
 *    - Click "Add Index"
 *    - Fill in the following:
 *      - Collection ID: "posts"
 *      - Fields to index:
 *        - Field path: "userId", Order: "Ascending"
 *        - Field path: "createdAt", Order: "Descending"
 *      - Query scope: "Collection"
 *    - Click "Create"
 * 
 * 4. The index may take a few minutes to build, especially if you have many
 *    documents in your collection.
 * 
 * Once the index is built, the error will be resolved and queries using
 * where('userId', '==', user.uid) together with orderBy('createdAt', 'desc')
 * will work properly.
 */

console.log('Please follow the instructions in this file to create the required Firebase index.'); 