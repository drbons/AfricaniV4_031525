import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  
  if (code) {
    try {
      // Exchange code for token (if using OAuth)
      // This is a simplified example - you may need to adjust based on your OAuth provider
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: `${requestUrl.origin}/api/auth/callback`,
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
    } catch (error) {
      console.error('Error in auth callback:', error);
      return NextResponse.redirect(new URL('/auth?error=auth_error', requestUrl.origin));
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(state || '/', requestUrl.origin));
}