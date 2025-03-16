import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware function for Next.js
 * Handles authentication and routing
 */
export async function middleware(req: NextRequest) {
  try {
    // Get the pathname from the URL
    const { pathname } = req.nextUrl;
    
    // List of paths that don't require authentication
    const publicPaths = ['/auth', '/api/auth', '/test-auth', '/api/health'];
    
    // Check if the current path is public
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
    
    // Log request for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] Processing: ${pathname}`);
      console.log(`[Middleware] Is public path: ${isPublicPath}`);
    }
    
    // Check for auth cookies
    const cookies = req.cookies;
    const authCookies = {
      session: cookies.get('__session')?.value,
      firebaseAuth: cookies.get('firebaseAuth')?.value,
      firebaseToken: cookies.get('firebaseToken')?.value,
    };
    
    const hasAuthCookies = Object.values(authCookies).some(Boolean);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] Auth cookies present: ${hasAuthCookies}`);
      console.log(`[Middleware] Cookies:`, Object.fromEntries(cookies.getAll().map(c => [c.name, 'present'])));
    }
    
    // Prevent redirect loops by tracking redirects
    const lastRedirectTime = cookies.get('lastRedirectTime')?.value;
    const currentTime = Date.now();
    const redirectTimeGap = lastRedirectTime ? currentTime - parseInt(lastRedirectTime) : 5000;
    const canRedirect = !lastRedirectTime || redirectTimeGap > 3000;
    
    // If we can't redirect due to timing, just proceed without redirect
    if (!canRedirect) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] Skipping redirect check due to timing constraints');
      }
      return NextResponse.next();
    }

    // Case 1: If user is on auth page but already has auth cookie, redirect to home
    if (isPublicPath && pathname === '/auth' && hasAuthCookies) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] User is authenticated but on auth page, redirecting to home');
      }
      
      const redirectPath = cookies.get('redirectAfterLogin')?.value || '/';
      const response = NextResponse.redirect(new URL(redirectPath, req.url));
      
      // Set a cookie to track the last redirect time
      response.cookies.set('lastRedirectTime', currentTime.toString(), {
        maxAge: 10, // Short expiry time
        path: '/'
      });
      
      // Clear the redirect cookie since we're using it
      if (cookies.get('redirectAfterLogin')) {
        response.cookies.delete('redirectAfterLogin');
      }
      
      return response;
    }
    
    // Case 2: If user is NOT on a public path and has NO auth cookies, redirect to auth
    if (!isPublicPath && !hasAuthCookies) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] User is NOT authenticated but trying to access protected route, redirecting to auth');
      }
      
      const response = NextResponse.redirect(new URL('/auth', req.url));
      
      // Set a cookie to track the last redirect time
      response.cookies.set('lastRedirectTime', currentTime.toString(), {
        maxAge: 10, // Short expiry time
        path: '/'
      });
      
      // Save the original URL to redirect back after login (for better UX)
      // Only if it's not already set and it's not the home page
      if (!cookies.get('redirectAfterLogin') && pathname !== '/') {
        response.cookies.set('redirectAfterLogin', pathname, {
          maxAge: 60 * 5, // 5 minutes
          path: '/'
        });
      }
      
      return response;
    }
    
    // If we reach here, no redirect is needed
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Error:', error);
    
    // Return a generic error response
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

// Configure which paths should trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};