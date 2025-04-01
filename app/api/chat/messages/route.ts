import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { text, senderId } = await request.json();

    if (!text || !senderId) {
      return NextResponse.json(
        { error: 'Message text and sender ID are required' },
        { status: 400 }
      );
    }

    // Create a new message
    const messagesRef = collection(db, 'messages');
    const docRef = await addDoc(messagesRef, {
      text,
      senderId,
      timestamp: serverTimestamp(),
      participants: [senderId], // You might want to add other participants based on your chat logic
    });

    const message = {
      id: docRef.id,
      text,
      senderId,
      timestamp: new Date(),
    };

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 