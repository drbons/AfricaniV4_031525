# African Business Directory Platform

A full-stack web application for an African Business Directory Platform with State-Based Navigation. Built with Next.js, Tailwind CSS, and Firebase.

## Features

- User authentication with email/password and Google Sign-In
- Business directory with filtering by category, state, and city
- Community posts and business promotions
- Real-time updates for posts and business listings
- Profile management
- Responsive design for mobile, tablet, and desktop
- Error boundaries for improved error handling
- Toast notifications for user feedback
- Pagination for efficient data loading

## Tech Stack

- **Frontend**: Next.js 13.5.1, Tailwind CSS, Lucide React, Radix UI components
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **API**: Next.js API Routes with Firebase integration
- **State Management**: React Hooks and Context API
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- A Firebase project with Firestore and Authentication enabled

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/drbons/AfricaniV4_031525.git
   cd AfricaniV4_031525
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env.local`
   - Update the Firebase configuration values in `.env.local`:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
     NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Troubleshooting Common Issues

#### "next is not recognized" Error

If you encounter the error `'next' is not recognized as an internal or external command`, run:
```bash
npm run fix-next-cli
```

#### "ERR_HTTP_HEADERS_SENT" Error

If you encounter the error `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`, run:
```bash
npm run fix-headers-sent
```

#### Firebase Authentication Issues

If you're having issues with Firebase authentication:
1. Ensure your Firebase project has Authentication enabled
2. Check that you've added the correct Firebase configuration in `.env.local`
3. If using Google Sign-In, ensure you've configured the Google provider in Firebase Console

## Database Schema

The application uses the following collections in Firestore:

- `businesses`: Stores business listings with details like name, address, category, etc.
- `posts`: Stores community posts and business promotions
- `profiles`: Stores user profile information linked to Firebase Auth
- `comments`: Stores comments on posts
- `reviews`: Stores reviews for businesses

## API Endpoints

- `/api/businesses`: Get all businesses or create a new business
- `/api/businesses/:id`: Get, update, or delete a specific business
- `/api/businesses/:id/reviews`: Add a review to a business
- `/api/posts`: Get all posts or create a new post
- `/api/posts/:id`: Get, update, or delete a specific post
- `/api/posts/:id/like`: Like a post
- `/api/posts/:id/comments`: Add a comment to a post
- `/api/profile`: Get or update the current user's profile

## Authentication

The application uses Firebase Auth for user authentication. Users can:
- Sign up with email and password
- Sign in with email and password
- Sign in with Google
- Reset their password
- Verify their email address

## Deployment

This application is configured for deployment on Vercel:

1. Push your code to a GitHub repository
2. Import the repository in Vercel
3. Configure the environment variables in Vercel
4. Deploy the application

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.