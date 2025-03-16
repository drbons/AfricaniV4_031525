"use client";

import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import Image from 'next/image';

interface IncomingCallModalProps {
  callerName: string;
  callerAvatar?: string;
  isVideoCall: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({
  callerName,
  callerAvatar,
  isVideoCall,
  onAccept,
  onDecline
}: IncomingCallModalProps) {
  const [ringtoneAudio, setRingtoneAudio] = useState<HTMLAudioElement | null>(null);
  const [ringingTime, setRingingTime] = useState(0);
  
  // Set up ringtone
  useEffect(() => {
    const audio = new Audio('/sounds/ringtone.mp3');
    audio.loop = true;
    audio.play().catch(error => {
      console.warn('Could not play ringtone automatically:', error);
    });
    
    setRingtoneAudio(audio);
    
    // Set up timer for auto-declining after 30 seconds
    const timer = setInterval(() => {
      setRingingTime(prev => {
        if (prev >= 30) {
          onDecline();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    
    return () => {
      audio.pause();
      clearInterval(timer);
    };
  }, [onDecline]);
  
  const handleAccept = () => {
    if (ringtoneAudio) {
      ringtoneAudio.pause();
    }
    onAccept();
  };
  
  const handleDecline = () => {
    if (ringtoneAudio) {
      ringtoneAudio.pause();
    }
    onDecline();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-bounce-gentle">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">
            Incoming {isVideoCall ? 'Video' : 'Voice'} Call
          </h2>
          
          <div className="my-6 flex flex-col items-center">
            {callerAvatar ? (
              <Image
                src={callerAvatar}
                alt={callerName}
                width={100}
                height={100}
                className="rounded-full border-4 border-green-500 mb-3"
              />
            ) : (
              <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-500 mb-3">
                <span className="text-green-700 text-3xl font-bold">
                  {callerName[0].toUpperCase()}
                </span>
              </div>
            )}
            
            <p className="text-lg font-medium">{callerName}</p>
            <p className="text-gray-500">is calling you...</p>
          </div>
          
          <div className="flex justify-center items-center space-x-6">
            <button
              onClick={handleDecline}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 flex flex-col items-center"
            >
              <PhoneOff className="h-8 w-8 mb-1" />
              <span className="text-sm">Decline</span>
            </button>
            
            <button
              onClick={handleAccept}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 flex flex-col items-center"
            >
              {isVideoCall ? (
                <>
                  <Video className="h-8 w-8 mb-1" />
                  <span className="text-sm">Accept</span>
                </>
              ) : (
                <>
                  <Phone className="h-8 w-8 mb-1" />
                  <span className="text-sm">Accept</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 2s infinite;
        }
      `}</style>
    </div>
  );
} 