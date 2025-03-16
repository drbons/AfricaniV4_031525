"use client";

import { useState } from 'react';
import Image from 'next/image';
import { X, Check, Users, Search } from 'lucide-react';
import { User } from '@/types/chat';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreateGroup: (name: string, participants: string[]) => Promise<void>;
  availableUsers: User[];
  currentUserId: string;
  isLoading: boolean;
}

export default function CreateGroupModal({
  onClose,
  onCreateGroup,
  availableUsers,
  currentUserId,
  isLoading
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = searchQuery
    ? availableUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        user.id !== currentUserId
      )
    : availableUsers.filter(user => user.id !== currentUserId);

  const handleAddRemoveUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one group member');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Include current user in participants
      await onCreateGroup(
        groupName, 
        [...selectedUsers, currentUserId]
      );
      onClose();
    } catch (error) {
      setError('Failed to create group. Please try again.');
      console.error('Error creating group:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Create Group Chat</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

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
            Search Members
          </label>
          <div className="relative mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pl-10"
              placeholder="Search users..."
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <div className="mb-2">
            <p className="text-sm text-gray-500 mb-2">
              {selectedUsers.length} users selected
            </p>
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(userId => {
                  const user = availableUsers.find(u => u.id === userId);
                  if (!user) return null;
                  
                  return (
                    <div 
                      key={userId}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center text-sm"
                    >
                      <span>{user.name}</span>
                      <button 
                        onClick={() => handleAddRemoveUser(userId)}
                        className="ml-1 text-green-700 hover:text-green-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No users found</p>
                {searchQuery && <p className="text-sm mt-1">Try a different search term</p>}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAddRemoveUser(user.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="flex items-center">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-9 w-9 bg-gray-200 rounded-full flex items-center justify-center">
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

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={creating || !groupName.trim() || selectedUsers.length === 0}
            className="px-4 py-2 bg-[#00FF4C] text-black font-medium rounded-lg hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Create Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 