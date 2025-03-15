import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  DocumentData 
} from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    const postRef = doc(db, 'posts', id);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = postSnap.data();
    
    // Get author profile data if available
    let authorProfile: DocumentData | null = null;
    if (postData.userId) {
      const profileRef = doc(db, 'profiles', postData.userId);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        authorProfile = profileSnap.data();
      }
    }

    return NextResponse.json({ 
      post: { 
        id, 
        ...postData,
        profiles: authorProfile ? {
          full_name: authorProfile.fullName,
          avatar_url: authorProfile.avatarUrl
        } : null
      } 
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Check if the post belongs to the user
    const postRef = doc(db, 'posts', id);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = postSnap.data();

    if (postData.userId !== currentUser.uid) {
      return NextResponse.json({ error: 'You can only update your own posts' }, { status: 403 });
    }

    // Add updated_at timestamp
    const updateData = {
      ...body,
      updated_at: serverTimestamp()
    };
    
    await updateDoc(postRef, updateData);
    
    // Get the updated post data
    const updatedPostSnap = await getDoc(postRef);
    
    return NextResponse.json({ post: { id, ...updatedPostSnap.data() } });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if the post belongs to the user
    const postRef = doc(db, 'posts', id);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = postSnap.data();

    if (postData.userId !== currentUser.uid) {
      return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 });
    }

    await deleteDoc(postRef);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}