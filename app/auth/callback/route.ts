import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const provider = searchParams.get('provider');
  
  // Handle Google OAuth callback
  if (provider === 'google' && code) {
    try {
      // Exchange code for token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: `${request.nextUrl.origin}/auth/callback?provider=google`,
          grant_type: 'authorization_code',
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error_description || 'Failed to exchange code for token');
      }
      
      // Create credential with the access token
      const credential = GoogleAuthProvider.credential(data.id_token, data.access_token);
      
      // Sign in with credential
      await signInWithCredential(auth, credential);
      
      // Redirect to home page or state parameter if provided
      return NextResponse.redirect(new URL(state || '/', request.url));
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      return NextResponse.redirect(new URL('/auth?error=oauth_error', request.url));
    }
  }
  
  // Default redirect if no valid parameters
  return NextResponse.redirect(new URL('/', request.url));
}