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
  const businessId = params.id;
  
  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.rating || !body.comment) {
      return NextResponse.json({ error: 'Rating and comment are required' }, { status: 400 });
    }

    // Get the business first
    const businessRef = doc(db, 'businesses', businessId);
    const businessSnap = await getDoc(businessRef);

    if (!businessSnap.exists()) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const businessData = businessSnap.data();

    // Create the new review
    const newReview = {
      user_id: currentUser.uid,
      comment: body.comment,
      rating: body.rating,
      created_at: new Date().toISOString()
    };

    // Update the reviews array
    const reviews = businessData.reviews ? [...businessData.reviews, newReview] : [newReview];
    
    // Calculate new rating score
    const totalRatings = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    const newRatingScore = totalRatings / reviews.length;
    const newReviewCount = reviews.length;

    // Determine rating tier based on score and count
    let ratingTier = 'silver';
    if (newRatingScore >= 4.5 && newReviewCount >= 100) {
      ratingTier = 'platinum';
    } else if (newRatingScore >= 4.0 && newReviewCount >= 50) {
      ratingTier = 'gold';
    }

    // Update the business with new review data
    await updateDoc(businessRef, {
      reviews: arrayUnion(newReview),
      rating_score: newRatingScore,
      review_count: newReviewCount,
      rating: ratingTier,
      updated_at: serverTimestamp()
    });

    // Get the updated business data
    const updatedBusinessSnap = await getDoc(businessRef);
    const updatedBusinessData = updatedBusinessSnap.data();

    return NextResponse.json({ 
      business: { id: businessId, ...updatedBusinessData },
      review: newReview
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding review:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}