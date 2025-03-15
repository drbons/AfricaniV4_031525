"use client";

import { useState } from 'react';
import { NEARBY_ADDRESSES } from '@/lib/data';
import { Share2 } from 'lucide-react';

export default function InviteNeighbors() {
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([]);
  
  const toggleAddress = (address: string) => {
    if (selectedAddresses.includes(address)) {
      setSelectedAddresses(selectedAddresses.filter(a => a !== address));
    } else {
      setSelectedAddresses([...selectedAddresses, address]);
    }
  };
  
  const selectAll = () => {
    if (selectedAddresses.length === NEARBY_ADDRESSES.length) {
      setSelectedAddresses([]);
    } else {
      setSelectedAddresses([...NEARBY_ADDRESSES]);
    }
  };
  
  const handleInvite = () => {
    alert(`Inviting ${selectedAddresses.length} neighbors`);
    setSelectedAddresses([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Invite Neighbors</h3>
        <Share2 className="h-5 w-5 text-green-600" />
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        Invite your neighbors to join the African Business community.
      </p>
      
      <div className="mb-3">
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="select-all"
            checked={selectedAddresses.length === NEARBY_ADDRESSES.length}
            onChange={selectAll}
            className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
          />
          <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-700">
            Select All
          </label>
        </div>
        
        <div className="max-h-[200px] overflow-y-auto space-y-2">
          {NEARBY_ADDRESSES.map((address, index) => (
            <div key={index} className="flex items-center">
              <input
                type="checkbox"
                id={`address-${index}`}
                checked={selectedAddresses.includes(address)}
                onChange={() => toggleAddress(address)}
                className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <label htmlFor={`address-${index}`} className="ml-2 text-sm text-gray-700">
                {address}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <button
        onClick={handleInvite}
        disabled={selectedAddresses.length === 0}
        className="w-full bg-[#00FF4C] hover:bg-green-400 text-black font-medium py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Invite {selectedAddresses.length > 0 ? `(${selectedAddresses.length})` : ''}
      </button>
    </div>
  );
}