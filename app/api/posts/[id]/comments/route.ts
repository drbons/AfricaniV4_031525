import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion,
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
    const body = await request.json();
    
    // Validate required fields
    if (!body.comment) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    // Get the current post
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = postSnap.data();

    // Get user profile info
    const profileRef = doc(db, 'profiles', currentUser.uid);
    const profileSnap = await getDoc(profileRef);
    const profileData = profileSnap.exists() ? profileSnap.data() : null;

    // Create the new comment
    const newComment = {
      id: crypto.randomUUID(),
      user_id: currentUser.uid,
      user_name: profileData?.fullName || currentUser.displayName || currentUser.email,
      user_avatar: profileData?.avatarUrl || currentUser.photoURL || null,
      text: body.comment,
      created_at: new Date().toISOString()
    };

    // Update the post with the new comment
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
      updated_at: serverTimestamp()
    });

    // Get the updated post data
    const updatedPostSnap = await getDoc(postRef);
    const updatedPostData = updatedPostSnap.data();

    return NextResponse.json({ 
      post: { id: postId, ...updatedPostData },
      comment: newComment
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}