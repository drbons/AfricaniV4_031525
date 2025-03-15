import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    const businessRef = doc(db, 'businesses', id);
    const businessSnap = await getDoc(businessRef);

    if (!businessSnap.exists()) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ business: { id, ...businessSnap.data() } });
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 });
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
    const businessRef = doc(db, 'businesses', id);
    const businessSnap = await getDoc(businessRef);

    if (!businessSnap.exists()) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const businessData = businessSnap.data();
    
    // Check if the current user is the owner of the business
    if (businessData.owner_id !== currentUser.uid) {
      return NextResponse.json({ error: 'You do not have permission to update this business' }, { status: 403 });
    }
    
    // Add updated_at timestamp
    const updateData = {
      ...body,
      updated_at: serverTimestamp()
    };
    
    await updateDoc(businessRef, updateData);
    
    // Get the updated business data
    const updatedBusinessSnap = await getDoc(businessRef);
    
    return NextResponse.json({ business: { id, ...updatedBusinessSnap.data() } });
  } catch (error) {
    console.error('Error updating business:', error);
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
    const businessRef = doc(db, 'businesses', id);
    const businessSnap = await getDoc(businessRef);

    if (!businessSnap.exists()) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const businessData = businessSnap.data();
    
    // Check if the current user is the owner of the business
    if (businessData.owner_id !== currentUser.uid) {
      return NextResponse.json({ error: 'You do not have permission to delete this business' }, { status: 403 });
    }
    
    await deleteDoc(businessRef);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting business:', error);
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
  }
}