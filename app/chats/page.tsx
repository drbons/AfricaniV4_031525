"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Image as ImageIcon,
  X,
  Loader2,
  Users,
  Plus,
  Check
} from 'lucide-react';
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
  doc
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  senderId: string;
  text: string;
  image?: string;
  createdAt: any;
  senderName: string;
  senderAvatar?: string;
}

interface ChatThread {
  id: string;
  type: 'private' | 'group';
  name?: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
  avatar?: string;
  createdBy?: string;
  admins?: string[];
}

interface User {
  id: string;
  name: string;
  avatar?: string;
}

export default function ChatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    // Subscribe to chat threads
    const threadsRef = collection(db, 'chatThreads');
    const q = query(
      threadsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const threadsList: ChatThread[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data() as ChatThread;
        
        if (data.type === 'private') {
          const otherUserId = data.participants.find(id => id !== user.uid);
          const userDoc = await getDocs(query(
            collection(db, 'profiles'),
            where('userId', '==', otherUserId)
          ));
          const userDetails = userDoc.docs[0]?.data() || {};
          
          threadsList.push({
            ...data,
            id: doc.id,
            name: userDetails.fullName || 'Anonymous',
            avatar: userDetails.avatarUrl
          });
        } else {
          threadsList.push({
            ...data,
            id: doc.id
          });
        }
      }
      
      setThreads(threadsList);
      setLoading(false);
    });

    // Fetch available users for group creation
    const fetchUsers = async () => {
      const usersRef = collection(db, 'profiles');
      const usersSnap = await getDocs(usersRef);
      const usersList = usersSnap.docs
        .map(doc => ({
          id: doc.data().userId,
          name: doc.data().fullName || 'Anonymous',
          avatar: doc.data().avatarUrl
        }))
        .filter(u => u.id !== user.uid);
      setAvailableUsers(usersList);
    };
    fetchUsers();

    return () => unsubscribe();
  }, [user, router]);

  useEffect(() => {
    if (selectedThread) {
      // Subscribe to messages
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('threadId', '==', selectedThread.id),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        
        setMessages(messagesList);
        scrollToBottom();
      });

      return () => unsubscribe();
    }
  }, [selectedThread]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `chats/${user?.uid}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      const threadData = {
        type: 'group',
        name: groupName.trim(),
        participants: [user.uid, ...selectedUsers],
        lastMessage: `${user.displayName || 'Anonymous'} created the group`,
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        createdBy: user.uid,
        admins: [user.uid],
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'chatThreads'), threadData);
      
      setGroupName('');
      setSelectedUsers([]);
      setShowCreateGroup(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddRemoveUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleLeaveGroup = async () => {
    if (!selectedThread || selectedThread.type !== 'group') return;

    try {
      const threadRef = doc(db, 'chatThreads', selectedThread.id);
      await updateDoc(threadRef, {
        participants: selectedThread.participants.filter(id => id !== user?.uid),
        lastMessage: `${user?.displayName || 'Anonymous'} left the group`,
        lastMessageTime: serverTimestamp()
      });

      setSelectedThread(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedThread || (!newMessage.trim() && !selectedImage)) return;

    setSending(true);
    setError(null);

    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const messageData = {
        threadId: selectedThread.id,
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        senderAvatar: user.photoURL,
        text: newMessage.trim(),
        image: imageUrl,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'messages'), messageData);

      // Update thread's last message
      const threadRef = doc(db, 'chatThreads', selectedThread.id);
      await updateDoc(threadRef, {
        lastMessage: newMessage.trim() || 'Sent an image',
        lastMessageTime: serverTimestamp()
      });
      
      setNewMessage('');
      setSelectedImage(null);
      setImagePreview(null);
      
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-[1440px] mx-auto h-[calc(100vh-180px)] flex">
      {/* Chat Threads Sidebar */}
      <div className="w-80 bg-white border-r">
        <div className="p-4 border-b">
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          
          <button
            onClick={() => setShowCreateGroup(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#00FF4C] hover:bg-green-400 text-black font-bold rounded-lg transition-colors"
          >
            <Users className="h-5 w-5" />
            <span>Create Group</span>
          </button>
        </div>

        <div className="overflow-y-auto h-full">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : threads.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            threads
              .filter(thread => 
                thread.name?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                    selectedThread?.id === thread.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                    {thread.type === 'group' ? (
                      <div className="h-full w-full bg-green-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                    ) : thread.avatar ? (
                      <Image
                        src={thread.avatar}
                        alt={thread.name || ''}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {(thread.name || 'A')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {thread.name}
                        {thread.type === 'group' && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({thread.participants.length} members)
                          </span>
                        )}
                      </p>
                      <span className="text-xs text-gray-500">
                        {thread.lastMessageTime?.toDate().toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {thread.lastMessage}
                    </p>
                  </div>
                  
                  {thread.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {thread.unreadCount}
                      </span>
                    </div>
                  )}
                </button>
              ))
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Create Group Chat</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter group name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Members
              </label>
              <div className="max-h-60 overflow-y-auto">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleAddRemoveUser(u.id)}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      {u.avatar ? (
                        <Image
                          src={u.avatar}
                          alt={u.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {u.name[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span>{u.name}</span>
                    </div>
                    {selectedUsers.includes(u.id) && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className="px-4 py-2 bg-[#00FF4C] hover:bg-green-400 text-black font-bold rounded-lg disabled:opacity-50"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {selectedThread ? (
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Chat Header */}
          <div className="h-16 bg-white border-b flex items-center justify-between px-4">
            <div className="flex items-center space-x-3">
              <div className="relative h-10 w-10 rounded-full overflow-hidden">
                {selectedThread.type === 'group' ? (
                  <div className="h-full w-full bg-green-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                ) : selectedThread.avatar ? (
                  <Image
                    src={selectedThread.avatar}
                    alt={selectedThread.name || ''}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {(selectedThread.name || 'A')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-medium">
                  {selectedThread.name}
                  {selectedThread.type === 'group' && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({selectedThread.participants.length} members)
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {selectedThread.type === 'group' && (
                <button
                  onClick={handleLeaveGroup}
                  className="px-3 py-1 text-sm text-red-500 hover:bg-red-50 rounded-lg"
                >
                  Leave Group
                </button>
              )}
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Phone className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Video className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === user?.uid ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] ${
                      message.senderId === user?.uid
                        ? 'bg-[#00FF4C] text-black'
                        : 'bg-white text-gray-800'
                    } rounded-lg px-4 py-2 shadow-sm`}
                  >
                    {selectedThread.type === 'group' && message.senderId !== user?.uid && (
                      <p className="text-xs font-medium mb-1">
                        {message.senderName}
                      </p>
                    )}
                    {message.image && (
                      <div className="mb-2">
                        <Image
                          src={message.image}
                          alt="Message image"
                          width={300}
                          height={200}
                          className="rounded-lg"
                        />
                      </div>
                    )}
                    {message.text && <p>{message.text}</p>}
                    <div className="text-xs mt-1 opacity-70">
                      {message.createdAt?.toDate().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-white border-t p-4">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                
                {imagePreview && (
                  <div className="mt-2 relative inline-block">
                    <Image
                      src={imagePreview}
                      alt="Selected image"
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        if (imageInputRef.current) {
                          imageInputRef.current.value = '';
                        }
                        if (imagePreview) {
                          URL.revokeObjectURL(imagePreview);
                        }
                      }}
                      className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={handleImageSelect}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <ImageIcon className="h-6 w-6" />
              </button>
              
              <button
                type="submit"
                disabled={(!newMessage.trim() && !selectedImage) || sending}
                className="px-4 py-2 bg-[#00FF4C] hover:bg-green-400 text-black font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </form>
            
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-medium text-gray-600">
              Select a conversation to start chatting
            </h2>
            <p className="text-gray-500 mt-2">
              Choose from your existing conversations or create a new group
            </p>
          </div>
        </div>
      )}
    </div>
  );
}