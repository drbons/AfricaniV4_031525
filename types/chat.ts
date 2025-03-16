import { Timestamp } from 'firebase/firestore';

// Basic user info
export interface User {
  id: string;
  name: string;
  photoURL?: string | null;
}

// Chat participant
export interface ChatParticipant {
  id: string;
  name: string;
  photoURL?: string | null;
}

// Chat message
export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date | Timestamp;
  read: boolean;
  attachments?: string[];
  senderName?: string;
  isSystemMessage?: boolean;
}

// Chat types
export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group'
}

// Chat thread (conversation)
export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  participants: ChatParticipant[];
  createdBy?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  admins?: string[];
}

// Call types
export enum CallType {
  VOICE = 'voice',
  VIDEO = 'video'
}

// Call signal for WebRTC
export interface CallSignal {
  type: CallType;
  threadId: string;
  fromUserId: string;
  toUserId?: string;
  signal?: any;
  isInitiator: boolean;
  participantIds: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  timestamp?: Date | Timestamp;
}

// Legacy interfaces for backward compatibility
export interface ChatThread {
  id: string;
  type: 'private' | 'group';
  name?: string;
  avatar?: string;
  participants: string[];
  createdBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastMessage?: string;
  lastMessageTime?: Timestamp;
  unreadCount: number;
  admins?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  image?: string;
  createdAt: Timestamp;
  senderName?: string;
  senderAvatar?: string;
  isSystemMessage?: boolean;
}

// Notification
export interface Notification {
  id: string;
  type: 'message' | 'group_invitation' | 'call_missed';
  threadId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: Timestamp;
  isRead: boolean;
  recipientId: string;
}
