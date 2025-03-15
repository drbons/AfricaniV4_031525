import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // With Firebase Auth, we don't need to do anything special in the middleware
  // Firebase Auth is handled client-side
  const res = NextResponse.next();
  return res;
}