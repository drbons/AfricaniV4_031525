"use client";

import { useState } from 'react';
import Image from 'next/image';
import { X, UserPlus, UserMinus, Trash, Check, Search } from 'lucide-react';
import { ChatThread, User } from '@/types/chat';

interface GroupDetailModalProps {
  thread: ChatThread;
  onClose: () => void;
  onAddMembers: (memberIds: string[]) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onLeaveGroup: () => Promise<void>;
  onDeleteGroup: () => Promise<void>;
  availableUsers: User[];
  currentUserId: string;
  groupMembers: Record<string, User>;
  isCreator: boolean;
  isAdmin: boolean;
}

export default function GroupDetailModal({
  thread,
  onClose,
  onAddMembers,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
  availableUsers,
  currentUserId,
  groupMembers,
  isCreator,
  isAdmin
}: GroupDetailModalProps) {
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = searchQuery
    ? availableUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !thread.participants.includes(user.id)
      )
    : availableUsers.filter(user => !thread.participants.includes(user.id));

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await onAddMembers(selectedUsers);
      setSelectedUsers([]);
      setShowAddMembers(false);
    } catch (err) {
      console.error('Error adding members:', err);
      setError('Failed to add members. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await onRemoveMember(memberId);
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (isProcessing) return;
    
    if (!confirm('Are you sure you want to leave this group?')) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await onLeaveGroup();
      onClose();
    } catch (err) {
      console.error('Error leaving group:', err);
      setError('Failed to leave group. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (isProcessing) return;
    
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await onDeleteGroup();
      onClose();
    } catch (err) {
      console.error('Error deleting group:', err);
      setError('Failed to delete group. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderAddMembersView = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowAddMembers(false)}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <X className="h-5 w-5 mr-1" />
          <span>Back</span>
        </button>
        <h3 className="text-lg font-medium">Add Members</h3>
        <button
          onClick={handleAddMembers}
          disabled={selectedUsers.length === 0 || isProcessing}
          className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isProcessing ? (
            <span>Adding...</span>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-1" />
              <span>Add</span>
            </>
          )}
        </button>
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {selectedUsers.length > 0 && (
        <p className="mb-3 text-sm text-gray-600">
          Selected {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
        </p>
      )}

      <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No users found{searchQuery ? ' matching your search' : ' to add'}</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => handleUserSelection(user.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
            >
              <div className="flex items-center">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {user.name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="ml-3">{user.name}</span>
              </div>
              
              <div className={`w-5 h-5 flex items-center justify-center rounded-full ${
                selectedUsers.includes(user.id) 
                  ? 'bg-green-500' 
                  : 'border border-gray-300'
              }`}>
                {selectedUsers.includes(user.id) && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderGroupDetailsView = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Group Details</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="mb-6 text-center">
        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
          <span className="text-green-700 text-xl font-bold">
            {thread.name?.[0]?.toUpperCase() || 'G'}
          </span>
        </div>
        <h2 className="text-xl font-bold">{thread.name}</h2>
        <p className="text-gray-500 text-sm">{thread.participants.length} members</p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Members</h4>
          {(isCreator || isAdmin) && (
            <button
              onClick={() => setShowAddMembers(true)}
              className="text-green-600 hover:text-green-700 flex items-center text-sm"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              <span>Add Members</span>
            </button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
          {Object.entries(groupMembers).map(([userId, user]) => (
            <div
              key={userId}
              className="flex items-center justify-between p-3"
            >
              <div className="flex items-center">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {user.name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="ml-3">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {userId === thread.createdBy ? 'Creator' : (
                      thread.admins?.includes(userId) ? 'Admin' : 'Member'
                    )}
                    {userId === currentUserId ? ' (You)' : ''}
                  </p>
                </div>
              </div>
              
              {(isCreator || isAdmin) && userId !== currentUserId && userId !== thread.createdBy && (
                <button
                  onClick={() => handleRemoveMember(userId)}
                  className="text-red-500 hover:text-red-600 p-1"
                  aria-label="Remove member"
                  disabled={isProcessing}
                >
                  <UserMinus className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t">
        {isCreator ? (
          <button
            onClick={handleDeleteGroup}
            className="w-full py-2 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-md"
            disabled={isProcessing}
          >
            <Trash className="h-5 w-5 mr-2" />
            <span>Delete Group</span>
          </button>
        ) : (
          <button
            onClick={handleLeaveGroup}
            className="w-full py-2 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-md"
            disabled={isProcessing}
          >
            <UserMinus className="h-5 w-5 mr-2" />
            <span>Leave Group</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {showAddMembers ? renderAddMembersView() : renderGroupDetailsView()}
      </div>
    </div>
  );
} 