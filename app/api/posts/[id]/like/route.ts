import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc,
  increment,
  serverTimestamp 
} from 'firebase/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const postId = params.id;
  
  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the current post
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment the likes count
    await updateDoc(postRef, {
      likes: increment(1),
      updated_at: serverTimestamp()
    });

    // Get the updated post data
    const updatedPostSnap = await getDoc(postRef);
    const updatedPostData = updatedPostSnap.data();

    return NextResponse.json({ post: { id: postId, ...updatedPostData } });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}