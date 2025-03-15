# African Business Directory Platform

A full-stack web application for an African Business Directory Platform with State-Based Navigation. Built with Next.js, Tailwind CSS, and Firebase.

## Features

- User authentication with email/password
- Business directory with filtering by category, state, and city
- Community posts and business promotions
- Real-time updates for posts and business listings
- Profile management
- Responsive design for mobile, tablet, and desktop

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS, Lucide React
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **API**: Next.js API Routes with Firebase integration

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add your Firebase credentials
4. Run the development server: `npm run dev`

## Database Schema

The application uses the following collections in Firestore:

- `businesses`: Stores business listings with details like name, address, category, etc.
- `posts`: Stores community posts and business promotions
- `profiles`: Stores user profile information linked to Firebase Auth

## API Endpoints

- `/api/businesses`: Get all businesses or create a new business
- `/api/businesses/:id`: Get, update, or delete a specific business
- `/api/businesses/:id/reviews`: Add a review to a business
- `/api/posts`: Get all posts or create a new post
- `/api/posts/:id`: Get, update, or delete a specific post
- `/api/posts/:id/like`: Like a post
- `/api/posts/:id/comments`: Add a comment to a post

## Authentication

The application uses Firebase Auth for user authentication. Users can sign up and sign in with email and password.