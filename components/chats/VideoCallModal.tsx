"use client";

import { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, X, RotateCw } from 'lucide-react';
import Image from 'next/image';
import { ChatThread } from '@/types/chat';
import Peer from 'simple-peer';

interface VideoCallModalProps {
  thread: ChatThread;
  currentUserId: string;
  onClose: () => void;
  isInitiator: boolean;
  onSendSignal?: (signal: any) => void;
  incomingSignal?: any;
  participantIds?: string[];
  participantNames?: Record<string, string>;
  participantAvatars?: Record<string, string>;
}

export default function VideoCallModal({
  thread,
  currentUserId,
  onClose,
  isInitiator,
  onSendSignal,
  incomingSignal,
  participantIds = [],
  participantNames = {},
  participantAvatars = {}
}: VideoCallModalProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [usingFrontCamera, setUsingFrontCamera] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerRefs = useRef<Record<string, Peer.Instance>>({});

  // Initialize camera and microphone
  useEffect(() => {
    const getMedia = async () => {
      try {
        const constraints = {
          video: {
            facingMode: usingFrontCamera ? 'user' : 'environment'
          },
          audio: true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        setConnecting(false);
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Could not access camera or microphone. Please check permissions.');
        setConnecting(false);
      }
    };
    
    getMedia();
    
    return () => {
      // Clean up local stream when component unmounts
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [usingFrontCamera]);

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
    
    // Handle receiving remote stream
    peer.on('stream', stream => {
      setRemoteStreams(prev => ({
        ...prev,
        [peerId]: stream
      }));
    });
    
    // Handle peer close
    peer.on('close', () => {
      console.log(`Connection with ${peerId} closed`);
      // Remove remote stream
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[peerId];
        return newStreams;
      });
      
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

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const switchCamera = async () => {
    // Stop all tracks in the current stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Toggle camera mode
    setUsingFrontCamera(!usingFrontCamera);
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
    
    // Close the modal
    onClose();
  };

  const renderParticipantStreams = () => {
    const remoteParticipants = Object.keys(remoteStreams);
    const totalParticipants = remoteParticipants.length + 1; // +1 for local stream
    
    // Determine grid columns based on participant count
    let gridCols = 'grid-cols-1';
    if (totalParticipants === 2) {
      gridCols = 'grid-cols-1 md:grid-cols-2';
    } else if (totalParticipants <= 4) {
      gridCols = 'grid-cols-1 md:grid-cols-2';
    } else {
      gridCols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
    
    return (
      <div className={`grid ${gridCols} gap-4 w-full h-full`}>
        {/* Local stream */}
        <div className="relative rounded-lg overflow-hidden bg-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="h-20 w-20 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {/* Use first letter of name or 'You' */}
                  {participantNames[currentUserId]?.[0]?.toUpperCase() || 'Y'}
                </span>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded-md text-white text-sm">
            You {isAudioMuted && '(muted)'}
          </div>
        </div>
        
        {/* Remote streams */}
        {remoteParticipants.map(participantId => (
          <div key={participantId} className="relative rounded-lg overflow-hidden bg-gray-800">
            <video
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              ref={(element) => {
                if (element && remoteStreams[participantId]) {
                  element.srcObject = remoteStreams[participantId];
                }
              }}
            />
            
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded-md text-white text-sm">
              {participantNames[participantId] || 'User'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <div className="flex items-center">
          <button 
            onClick={onClose}
            className="mr-4 text-white hover:text-gray-300"
            aria-label="Minimize"
          >
            <X className="h-6 w-6" />
          </button>
          
          <h2 className="text-white text-lg font-medium">
            {thread.type === 'group' ? thread.name : participantNames[participantIds.find(id => id !== currentUserId) || ''] || 'Video Call'}
          </h2>
        </div>
        
        <span className="text-green-400 text-sm">
          {connecting ? 'Connecting...' : 'Connected'}
        </span>
      </div>

      <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={endCall}
              className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              Close
            </button>
          </div>
        ) : connecting ? (
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
            <p>Setting up your video call...</p>
          </div>
        ) : (
          renderParticipantStreams()
        )}
      </div>

      <div className="bg-gray-900 p-4 flex items-center justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full ${isAudioMuted ? 'bg-red-500' : 'bg-gray-700'} text-white hover:opacity-90`}
          aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isAudioMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} text-white hover:opacity-90`}
          aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
        </button>
        
        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600"
          aria-label="End call"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
        
        <button
          onClick={switchCamera}
          className="p-4 rounded-full bg-gray-700 text-white hover:opacity-90"
          aria-label="Switch camera"
        >
          <RotateCw className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
} 