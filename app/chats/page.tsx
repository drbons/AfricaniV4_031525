"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  limit,
  startAfter,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from '@/lib/firebase';
import { Loader2, PlusCircle, Users } from 'lucide-react';

// Import chat components
import ChatSidebar from '@/components/chats/ChatSidebar';
import ChatWindow from '@/components/chats/ChatWindow';
import CreateGroupModal from '@/components/chats/CreateGroupModal';
import GroupDetailModal from '@/components/chats/GroupDetailModal';
import VideoCallModal from '@/components/chats/VideoCallModal';
import VoiceCallModal from '@/components/chats/VoiceCallModal';
import IncomingCallModal from '@/components/chats/IncomingCallModal';

// Import types
import { 
  ChatThread, 
  Message, 
  User, 
  CallSignal, 
  Chat, 
  ChatType, 
  ChatMessage, 
  CallType,
  ChatParticipant
} from '@/types/chat';

export default function ChatsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Chat state
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Group chat state
  const [isThreadDialogOpen, setIsThreadDialogOpen] = useState(false);
  const [isManageGroupDialogOpen, setIsManageGroupDialogOpen] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  
  // Call state
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [callMinimized, setCallMinimized] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    type: 'video' | 'voice';
    callerName: string;
    callerAvatar?: string;
    threadId: string;
    callerId: string;
    signal?: any;
    participantIds: string[];
    participantNames: Record<string, string>;
    participantAvatars: Record<string, string>;
  } | null>(null);
  const [callParticipantIds, setCallParticipantIds] = useState<string[]>([]);
  const [callParticipantNames, setCallParticipantNames] = useState<Record<string, string>>({});
  const [callParticipantAvatars, setCallParticipantAvatars] = useState<Record<string, string>>({});
  const [callSignal, setCallSignal] = useState<any>(null);
  const [isCallInitiator, setIsCallInitiator] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const callSignalUnsubscribeRef = useRef<(() => void) | null>(null);

  // New state for pagination
  const [lastMessageDoc, setLastMessageDoc] = useState<any>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Check auth and redirect if not signed in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
      return;
    }

    // Initialize chat and set up listeners
    if (user) {
      initializeChat();
    }

    return () => {
      // Clean up listeners when unmounting
      if (callSignalUnsubscribeRef.current) {
        callSignalUnsubscribeRef.current();
      }
    };
  }, [user, loading, router]);

  // Initialize chat and set up listeners
  const initializeChat = async () => {
    if (!user) return;

    setIsLoadingThreads(true);
    
    try {
      // For development/demo purposes, create mock data
      // In production, this would fetch from Firebase
      const mockThreads: ChatThread[] = [
        {
          id: '1',
          type: 'private',
          name: 'John Doe',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          participants: [user.uid, 'user1'],
          createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 5)),
          updatedAt: Timestamp.fromDate(new Date(Date.now() - 3600000)),
          lastMessage: 'Hey, how are you doing?',
          lastMessageTime: Timestamp.fromDate(new Date(Date.now() - 3600000)),
          unreadCount: 2
        },
        {
          id: '2',
          type: 'group',
          name: 'Project Team',
          avatar: '',
          participants: [user.uid, 'user1', 'user2', 'user3'],
          createdBy: user.uid,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 10)),
          updatedAt: Timestamp.fromDate(new Date(Date.now() - 7200000)),
          lastMessage: 'Let\'s meet tomorrow at 10 AM',
          lastMessageTime: Timestamp.fromDate(new Date(Date.now() - 7200000)),
          unreadCount: 0,
          admins: [user.uid]
        },
        {
          id: '3',
          type: 'private',
          name: 'Jane Smith',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          participants: [user.uid, 'user2'],
          createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 2)),
          updatedAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
          lastMessage: 'Thanks for your help!',
          lastMessageTime: Timestamp.fromDate(new Date(Date.now() - 86400000)),
          unreadCount: 0
        }
      ];
      
      setThreads(mockThreads);
      
      // Set up call signal listener
      setupCallSignalListener();
    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Failed to load chats. Please try again.');
    } finally {
      setIsLoadingThreads(false);
    }
  };

  // Set up listener for call signals
  const setupCallSignalListener = () => {
    if (!user) return;

    // In a real implementation, this would listen to Firebase
    // For now, we'll just simulate it
    console.log('Setting up call signal listener');
  };

  // Handle incoming call
  const handleIncomingCall = (callData: CallSignal) => {
    if (!user) return;
    
    setIncomingCall({
      type: callData.type === CallType.VIDEO ? 'video' : 'voice',
      callerName: callData.participantNames[callData.fromUserId] || 'Unknown',
      callerAvatar: callData.participantAvatars[callData.fromUserId],
      threadId: callData.threadId,
      callerId: callData.fromUserId,
      signal: callData.signal,
      participantIds: callData.participantIds,
      participantNames: callData.participantNames,
      participantAvatars: callData.participantAvatars
    });
  };

  // Select a thread to view
  const selectThread = async (thread: ChatThread) => {
    setSelectedThread(thread);
    
    // Load messages for the selected thread
    await loadMessages(thread.id);
    
    // Mark messages as read
    if (thread.unreadCount > 0) {
      markThreadAsRead(thread.id);
    }
  };

  // Load messages for a thread
  const loadMessages = async (threadId: string) => {
    if (!user) return;
    
    try {
      // For development/demo purposes, create mock data
      // In production, this would fetch from Firebase
      const mockMessages: Message[] = [
        {
          id: '1',
          senderId: 'user1',
          text: 'Hey there!',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 2)),
          senderName: 'John Doe',
          senderAvatar: 'https://randomuser.me/api/portraits/men/32.jpg'
        },
        {
          id: '2',
          senderId: user.uid,
          text: 'Hi! How are you?',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 1.5))
        },
        {
          id: '3',
          senderId: 'user1',
          text: 'I\'m doing great! Just wanted to check in.',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000))
        },
        {
          id: '4',
          senderId: user.uid,
          text: 'That\'s awesome. I\'m working on the new project.',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 1800000))
        },
        {
          id: '5',
          senderId: 'user1',
          text: 'Sounds interesting! Can you tell me more about it?',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 900000))
        }
      ];
      
      setMessages(mockMessages);
      setHasMoreMessages(false); // For demo purposes
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages. Please try again.');
    }
  };

  // Mark a thread as read
  const markThreadAsRead = (threadId: string) => {
    if (!user) return;
    
    // Update the threads list to mark this thread as read
    setThreads(prevThreads => 
      prevThreads.map(thread => 
        thread.id === threadId 
          ? { ...thread, unreadCount: 0 } 
          : thread
      )
    );
    
    // In a real implementation, this would update Firebase
  };

  // Send a message
  const handleSendMessage = async (text: string, image: File | null = null) => {
    if (!user || !selectedThread || (!text.trim() && !image)) return;
    
    setSending(true);
    
    try {
      let imageUrl = '';
      
      // Upload image if provided
      if (image) {
        const storageRef = ref(storage, `chat-images/${selectedThread.id}/${uuidv4()}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Create new message
      const newMessage: Message = {
        id: uuidv4(),
        senderId: user.uid,
        text: text.trim(),
        image: imageUrl || undefined,
        createdAt: Timestamp.now()
      };
      
      // Add message to the list
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      // Update thread with last message
      setThreads(prevThreads => 
        prevThreads.map(thread => 
          thread.id === selectedThread.id 
            ? { 
                ...thread, 
                lastMessage: text.trim() || 'Image sent',
                lastMessageTime: Timestamp.now(),
                updatedAt: Timestamp.now()
              } 
            : thread
        )
      );
      
      // In a real implementation, this would save to Firebase
      
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Start a video call
  const handleStartVideoCall = () => {
    if (!user || !selectedThread) return;
    
    setShowVideoCall(true);
    setIsCallInitiator(true);
    
    // Set up call participants
    const participantIds = selectedThread.participants;
    
    // Create participant names and avatars maps
    const participantNames: Record<string, string> = {};
    const participantAvatars: Record<string, string> = {};
    
    // Add current user
    participantNames[user.uid] = user.displayName || 'You';
    participantAvatars[user.uid] = user.photoURL || '';
    
    // Add other participants (in a real app, this would fetch from profiles)
    if (selectedThread.type === 'private') {
      const otherUserId = selectedThread.participants.find(id => id !== user.uid);
      if (otherUserId) {
        participantNames[otherUserId] = selectedThread.name || 'User';
        participantAvatars[otherUserId] = selectedThread.avatar || '';
      }
    } else {
      // For group chats, we'd need to fetch all participant details
      // For demo purposes, we'll just use placeholder data
      selectedThread.participants.forEach(id => {
        if (id !== user.uid) {
          participantNames[id] = 'Group Member';
          participantAvatars[id] = '';
        }
      });
    }
    
    setCallParticipantIds(participantIds);
    setCallParticipantNames(participantNames);
    setCallParticipantAvatars(participantAvatars);
    
    // In a real implementation, this would create a call signal in Firebase
    
    // Add system message about call
    const callMessage: Message = {
      id: uuidv4(),
      senderId: user.uid,
      text: 'Started a video call',
      createdAt: Timestamp.now(),
      isSystemMessage: true
    };
    
    setMessages(prevMessages => [...prevMessages, callMessage]);
  };

  // Start a voice call
  const handleStartVoiceCall = () => {
    if (!user || !selectedThread) return;
    
    setShowVoiceCall(true);
    setIsCallInitiator(true);
    
    // Similar setup as video call
    const participantIds = selectedThread.participants;
    
    // Create participant names and avatars maps
    const participantNames: Record<string, string> = {};
    const participantAvatars: Record<string, string> = {};
    
    // Add current user
    participantNames[user.uid] = user.displayName || 'You';
    participantAvatars[user.uid] = user.photoURL || '';
    
    // Add other participants (in a real app, this would fetch from profiles)
    if (selectedThread.type === 'private') {
      const otherUserId = selectedThread.participants.find(id => id !== user.uid);
      if (otherUserId) {
        participantNames[otherUserId] = selectedThread.name || 'User';
        participantAvatars[otherUserId] = selectedThread.avatar || '';
      }
    } else {
      // For group chats, we'd need to fetch all participant details
      selectedThread.participants.forEach(id => {
        if (id !== user.uid) {
          participantNames[id] = 'Group Member';
          participantAvatars[id] = '';
        }
      });
    }
    
    setCallParticipantIds(participantIds);
    setCallParticipantNames(participantNames);
    setCallParticipantAvatars(participantAvatars);
    
    // In a real implementation, this would create a call signal in Firebase
    
    // Add system message about call
    const callMessage: Message = {
      id: uuidv4(),
      senderId: user.uid,
      text: 'Started a voice call',
      createdAt: Timestamp.now(),
      isSystemMessage: true
    };
    
    setMessages(prevMessages => [...prevMessages, callMessage]);
  };

  // Accept an incoming call
  const acceptCall = () => {
    if (!incomingCall) return;
    
    if (incomingCall.type === 'video') {
      setShowVideoCall(true);
    } else {
      setShowVoiceCall(true);
    }
    
    setCallParticipantIds(incomingCall.participantIds);
    setCallParticipantNames(incomingCall.participantNames);
    setCallParticipantAvatars(incomingCall.participantAvatars);
    setCallSignal(incomingCall.signal);
    setIsCallInitiator(false);
    setIncomingCall(null);
  };

  // Decline an incoming call
  const declineCall = () => {
    if (!incomingCall) return;
    
    // In a real implementation, this would send a decline signal to the caller
    
    setIncomingCall(null);
  };

  // End a call
  const endCall = () => {
    setShowVideoCall(false);
    setShowVoiceCall(false);
    setCallMinimized(false);
    
    // In a real implementation, this would clean up WebRTC connections
  };

  // Toggle call minimized state
  const toggleCallMinimized = () => {
    setCallMinimized(!callMinimized);
  };

  // Open thread creation dialog
  const openThreadDialog = () => {
    setIsThreadDialogOpen(true);
  };

  // Close thread creation dialog
  const closeThreadDialog = () => {
    setIsThreadDialogOpen(false);
  };

  // Create a new thread
  const createThread = async (type: 'private' | 'group', name: string, participants: string[]) => {
    if (!user) return;
    
    setIsCreatingThread(true);
    
    try {
      // Create a new thread
      const newThread: ChatThread = {
        id: uuidv4(),
        type,
        name: type === 'group' ? name : '',
        participants: [user.uid, ...participants],
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        unreadCount: 0
      };
      
      if (type === 'group') {
        newThread.admins = [user.uid];
      } else {
        // For private chats, set the name to the other user's name
        // In a real app, this would fetch from profiles
        newThread.name = 'New Contact';
      }
      
      // Add thread to the list
      setThreads(prevThreads => [newThread, ...prevThreads]);
      
      // Select the new thread
      setSelectedThread(newThread);
      
      // Close the dialog
      setIsThreadDialogOpen(false);
      
      // In a real implementation, this would save to Firebase
      
      toast.success(`${type === 'group' ? 'Group' : 'Chat'} created successfully`);
    } catch (error) {
      console.error('Error creating thread:', error);
      setError('Failed to create chat. Please try again.');
      toast.error('Failed to create chat');
    } finally {
      setIsCreatingThread(false);
    }
  };

  // Open group management dialog
  const openManageGroupDialog = () => {
    if (!selectedThread || selectedThread.type !== 'group') return;
    
    setIsManageGroupDialogOpen(true);
  };

  // Close group management dialog
  const closeManageGroupDialog = () => {
    setIsManageGroupDialogOpen(false);
  };

  // Check if current user is admin of the selected thread
  const isThreadAdmin = () => {
    if (!user || !selectedThread || selectedThread.type !== 'group') return false;
    
    return selectedThread.admins?.includes(user.uid) || false;
  };

  // Update a group thread
  const updateGroupThread = async (name: string, participants: string[]) => {
    if (!user || !selectedThread || selectedThread.type !== 'group') return;
    
    try {
      // Update the thread
      const updatedThread: ChatThread = {
        ...selectedThread,
        name,
        participants: [...new Set([user.uid, ...participants])], // Ensure unique participants
        updatedAt: Timestamp.now()
      };
      
      // Update the threads list
      setThreads(prevThreads => 
        prevThreads.map(thread => 
          thread.id === selectedThread.id ? updatedThread : thread
        )
      );
      
      // Update the selected thread
      setSelectedThread(updatedThread);
      
      // Close the dialog
      setIsManageGroupDialogOpen(false);
      
      // In a real implementation, this would update Firebase
      
      toast.success('Group updated successfully');
    } catch (error) {
      console.error('Error updating group:', error);
      setError('Failed to update group. Please try again.');
      toast.error('Failed to update group');
    }
  };

  // Leave a group thread
  const leaveGroupThread = async () => {
    if (!user || !selectedThread || selectedThread.type !== 'group') return;
    
    try {
      // Remove the thread from the list
      setThreads(prevThreads => 
        prevThreads.filter(thread => thread.id !== selectedThread.id)
      );
      
      // Clear the selected thread
      setSelectedThread(null);
      
      // Close the dialog
      setIsManageGroupDialogOpen(false);
      
      // In a real implementation, this would update Firebase
      
      toast.success('Left group successfully');
    } catch (error) {
      console.error('Error leaving group:', error);
      setError('Failed to leave group. Please try again.');
      toast.error('Failed to leave group');
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!user || !selectedThread || !lastMessageDoc || loadingMore) return;
    
    setLoadingMore(true);
    
    try {
      // In a real implementation, this would fetch more messages from Firebase
      // For demo purposes, we'll just simulate it
      setTimeout(() => {
        setHasMoreMessages(false);
        setLoadingMore(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading more messages:', error);
      setLoadingMore(false);
    }
  };

  // Handle search query change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Sidebar - Chat List */}
      <div className="w-72 border-r bg-white flex flex-col">
        <div className="p-4 border-b bg-white flex items-center">
          <h2 className="font-bold flex-1">Chats</h2>
          <button
            onClick={openThreadDialog}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            aria-label="Create new chat"
          >
            <PlusCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <ChatSidebar
            threads={threads}
            selectedThreadId={selectedThread?.id || null}
            onSelectThread={selectThread}
            onCreateGroup={openThreadDialog}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            isLoading={isLoadingThreads}
          />
        </div>
      </div>

      {/* Main Content - Chat Window */}
      <div className="flex-1 flex flex-col h-full">
        {!selectedThread ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-sm">Choose from your existing conversations or start a new one</p>
              <button
                onClick={openThreadDialog}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Start a new chat
              </button>
            </div>
          </div>
        ) : (
          <ChatWindow
            thread={selectedThread}
            messages={messages}
            currentUserId={user.uid}
            onSendMessage={handleSendMessage}
            onStartVideoCall={handleStartVideoCall}
            onStartVoiceCall={handleStartVoiceCall}
            onManageGroup={openManageGroupDialog}
            isMessageSending={sending}
            onLoadMoreMessages={loadMoreMessages}
            hasMoreMessages={hasMoreMessages}
            isLoadingMessages={loadingMore}
          />
        )}
        </div>
      
      {/* Create Thread Dialog */}
      {isThreadDialogOpen && (
        <CreateGroupModal
          onClose={closeThreadDialog}
          onCreate={createThread}
          isCreating={isCreatingThread}
        />
      )}
      
      {/* Manage Group Dialog */}
      {isManageGroupDialogOpen && selectedThread && (
        <GroupDetailModal
          thread={selectedThread}
          onClose={closeManageGroupDialog}
          onUpdateGroup={updateGroupThread}
          onLeaveGroup={leaveGroupThread}
          isAdmin={isThreadAdmin()}
        />
      )}
      
      {/* Incoming Call Dialog */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}
      
      {/* Video Call Modal */}
      {showVideoCall && (
        <VideoCallModal
          threadId={selectedThread?.id || ''}
          participantIds={callParticipantIds}
          participantNames={callParticipantNames}
          participantAvatars={callParticipantAvatars}
          isInitiator={isCallInitiator}
          signal={callSignal}
          isMinimized={callMinimized}
          onEndCall={endCall}
          onToggleMinimize={toggleCallMinimized}
        />
      )}
      
      {/* Voice Call Modal */}
      {showVoiceCall && (
        <VoiceCallModal
          threadId={selectedThread?.id || ''}
          participantIds={callParticipantIds}
          participantNames={callParticipantNames}
          participantAvatars={callParticipantAvatars}
          isInitiator={isCallInitiator}
          signal={callSignal}
          isMinimized={callMinimized}
          onEndCall={endCall}
          onToggleMinimize={toggleCallMinimized}
        />
      )}
      
      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
