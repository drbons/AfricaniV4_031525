import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

export async function GET(request: NextRequest) {
  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profileRef = doc(db, 'profiles', currentUser.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: { id: profileSnap.id, ...profileSnap.data() } });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const profileRef = doc(db, 'profiles', currentUser.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      // Update existing profile
      await updateDoc(profileRef, {
        fullName: body.full_name,
        avatarUrl: body.avatar_url,
        city: body.city,
        state: body.state,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new profile
      await setDoc(profileRef, {
        userId: currentUser.uid,
        fullName: body.full_name,
        avatarUrl: body.avatar_url,
        city: body.city,
        state: body.state,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // Get the updated profile
    const updatedProfileSnap = await getDoc(profileRef);
    
    return NextResponse.json({ 
      profile: { 
        id: currentUser.uid, 
        ...updatedProfileSnap.data() 
      } 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}