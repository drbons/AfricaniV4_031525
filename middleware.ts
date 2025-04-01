import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase/admin';

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/reset-password',
  '/_next',
  '/api/auth',
  '/favicon.ico',
];

/**
 * Middleware function for Next.js
 * Handles authentication and routing
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

  try {
    // Get the token from the cookies
    const token = request.cookies.get('firebaseToken')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Create response
    const response = NextResponse.next();
    
    // Set cache control headers
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Configure which paths should trigger this middleware
export const config = {
  matcher: ['/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)'],
};