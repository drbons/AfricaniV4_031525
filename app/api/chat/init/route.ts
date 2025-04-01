import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Query for recent messages
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('participants', 'array-contains', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error initializing chat:', error);
    return NextResponse.json(
      { error: 'Failed to initialize chat' },
      { status: 500 }
    );
  }
} 