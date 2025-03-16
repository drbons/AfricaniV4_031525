"use client";

import { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, PhoneOff, X, MinusCircle } from 'lucide-react';
import Image from 'next/image';
import { ChatThread } from '@/types/chat';
import Peer from 'simple-peer';

interface VoiceCallModalProps {
  thread: ChatThread;
  currentUserId: string;
  onClose: () => void;
  onMinimize?: () => void;
  isInitiator: boolean;
  onSendSignal?: (signal: any) => void;
  incomingSignal?: any;
  participantIds?: string[];
  participantNames?: Record<string, string>;
  participantAvatars?: Record<string, string>;
  isMinimized?: boolean;
}

export default function VoiceCallModal({
  thread,
  currentUserId,
  onClose,
  onMinimize,
  isInitiator,
  onSendSignal,
  incomingSignal,
  participantIds = [],
  participantNames = {},
  participantAvatars = {},
  isMinimized = false
}: VoiceCallModalProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectedParticipants, setConnectedParticipants] = useState<string[]>([]);
  
  const peerRefs = useRef<Record<string, Peer.Instance>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize microphone
  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        
        setLocalStream(stream);
        setConnecting(false);
        
        // Start the call timer
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        setError('Could not access microphone. Please check permissions.');
        setConnecting(false);
      }
    };
    
    getMedia();
    
    return () => {
      // Clean up local stream when component unmounts
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Set up peer connections
  useEffect(() => {
    if (!localStream || !onSendSignal) return;
    
    // Initialize connections with all participants
    participantIds.forEach(participantId => {
      if (participantId !== currentUserId) {
        initializePeerConnection(participantId, true);
      }
    });
    
    return () => {
      // Clean up peer connections
      Object.values(peerRefs.current).forEach(peer => {
        peer.destroy();
      });
      peerRefs.current = {};
    };
  }, [localStream, participantIds, currentUserId, onSendSignal]);

  // Handle incoming signals
  useEffect(() => {
    if (!incomingSignal || !localStream) return;
    
    const { fromUserId, signal } = incomingSignal;
    
    // If we already have a connection with this peer, handle the signal
    if (peerRefs.current[fromUserId]) {
      peerRefs.current[fromUserId].signal(signal);
    } else {
      // Otherwise, create a new peer connection
      initializePeerConnection(fromUserId, false, signal);
    }
  }, [incomingSignal, localStream]);

  const initializePeerConnection = (
    peerId: string, 
    initiator: boolean, 
    incomingSignal?: any
  ) => {
    if (!localStream) return;
    
    const peer = new Peer({
      initiator,
      trickle: false,
      stream: localStream
    });
    
    // Handle signals to send to the other peer
    peer.on('signal', signal => {
      if (onSendSignal) {
        onSendSignal({
          toUserId: peerId,
          fromUserId: currentUserId,
          signal
        });
      }
    });
    
    // Handle peer connection
    peer.on('connect', () => {
      setConnectedParticipants(prev => [...prev, peerId]);
    });
    
    // Handle peer close
    peer.on('close', () => {
      console.log(`Connection with ${peerId} closed`);
      
      // Remove from connected participants
      setConnectedParticipants(prev => 
        prev.filter(id => id !== peerId)
      );
      
      // Remove peer reference
      delete peerRefs.current[peerId];
    });
    
    // Handle errors
    peer.on('error', err => {
      console.error('Peer connection error:', err);
      setError('Connection error. Please try again.');
    });
    
    // If responding to an incoming signal, process it
    if (incomingSignal) {
      peer.signal(incomingSignal);
    }
    
    // Store the peer reference
    peerRefs.current[peerId] = peer;
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isAudioMuted;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const endCall = () => {
    // Stop all local media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close all peer connections
    Object.values(peerRefs.current).forEach(peer => {
      peer.destroy();
    });
    
    // Clear peer references
    peerRefs.current = {};
    
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Close the modal
    onClose();
  };

  const formatCallDuration = () => {
    const hours = Math.floor(callDuration / 3600);
    const minutes = Math.floor((callDuration % 3600) / 60);
    const seconds = callDuration % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 rounded-lg shadow-lg z-50 w-64 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center mr-2">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <div className="text-white">
              <p className="text-sm font-medium">Voice call</p>
              <p className="text-xs text-gray-400">{formatCallDuration()}</p>
            </div>
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={onMinimize}
              className="p-1 text-gray-400 hover:text-white"
              aria-label="Maximize call"
            >
              <MinusCircle className="h-5 w-5" />
            </button>
            
            <button
              onClick={endCall}
              className="p-1 text-red-500 hover:text-red-400"
              aria-label="End call"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <button 
            onClick={onClose}
            className="mr-4 text-white hover:text-gray-300"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          
          <h2 className="text-white text-lg font-medium">
            {thread.type === 'group' ? thread.name : participantNames[participantIds.find(id => id !== currentUserId) || ''] || 'Voice Call'}
          </h2>
        </div>
        
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="text-white hover:text-gray-300"
            aria-label="Minimize call"
          >
            <MinusCircle className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center">
        {error ? (
          <div className="text-white text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={endCall}
              className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              End Call
            </button>
          </div>
        ) : connecting ? (
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg font-medium mb-2">Connecting...</p>
            <p className="text-gray-400">Setting up your voice call</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-green-400 text-xl font-bold mb-8">
              {formatCallDuration()}
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 max-w-2xl mx-auto">
              {/* Current user */}
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  {participantAvatars[currentUserId] ? (
                    <Image
                      src={participantAvatars[currentUserId]}
                      alt="You"
                      width={80}
                      height={80}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-20 w-20 bg-green-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {participantNames[currentUserId]?.[0]?.toUpperCase() || 'Y'}
                      </span>
                    </div>
                  )}
                  
                  {isAudioMuted && (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
                      <MicOff className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-white font-medium">You</p>
              </div>
              
              {/* Other participants */}
              {participantIds.filter(id => id !== currentUserId).map(participantId => (
                <div key={participantId} className="flex flex-col items-center">
                  <div className="relative mb-2">
                    {participantAvatars[participantId] ? (
                      <Image
                        src={participantAvatars[participantId]}
                        alt={participantNames[participantId] || 'User'}
                        width={80}
                        height={80}
                        className={`rounded-full ${connectedParticipants.includes(participantId) ? '' : 'opacity-50 grayscale'}`}
                      />
                    ) : (
                      <div className={`h-20 w-20 bg-gray-600 rounded-full flex items-center justify-center ${connectedParticipants.includes(participantId) ? '' : 'opacity-50'}`}>
                        <span className="text-white text-2xl font-bold">
                          {participantNames[participantId]?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    
                    {!connectedParticipants.includes(participantId) && (
                      <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                        <span className="block h-4 w-4"></span>
                      </div>
                    )}
                  </div>
                  <p className={`font-medium ${connectedParticipants.includes(participantId) ? 'text-white' : 'text-gray-400'}`}>
                    {participantNames[participantId] || 'User'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {connectedParticipants.includes(participantId) ? 'Connected' : 'Connecting...'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pb-10 pt-4 flex items-center justify-center space-x-6">
        <button
          onClick={toggleAudio}
          className={`p-5 rounded-full ${isAudioMuted ? 'bg-red-500' : 'bg-green-500'} text-white hover:opacity-90`}
          aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isAudioMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        
        <button
          onClick={endCall}
          className="p-5 rounded-full bg-red-500 text-white hover:bg-red-600"
          aria-label="End call"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
} 