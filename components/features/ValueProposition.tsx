"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Users, Check, ArrowRight } from 'lucide-react';

export default function ValueProposition() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 relative h-16 w-64">
          <Image 
            src="https://picsum.photos/800/200?random=africanilogo" 
            alt="Africani Logo"
            fill
            className="object-contain"
          />
        </div>
        
        <h2 className="text-2xl font-bold text-[#1B1F2B] mb-3">Why Join Us?</h2>
        
        <p className="text-gray-600 text-lg mb-4">
          Connect with African businesses across the United States. 
          <span className="font-bold text-[#00FF4C]"> IT&apos;S FREE!</span>
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-2">
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <Users className="h-8 w-8 text-[#00FF4C] mb-2" />
            <h3 className="font-semibold mb-1">Community</h3>
            <p className="text-sm text-gray-600">Join a thriving network of African businesses</p>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <Check className="h-8 w-8 text-[#00FF4C] mb-2" />
            <h3 className="font-semibold mb-1">Visibility</h3>
            <p className="text-sm text-gray-600">Increase your business&apos;s online presence</p>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <ArrowRight className="h-8 w-8 text-[#00FF4C] mb-2" />
            <h3 className="font-semibold mb-1">Growth</h3>
            <p className="text-sm text-gray-600">Connect with customers across the country</p>
          </div>
        </div>
        
        <Link 
          href="/auth" 
          className="mt-6 px-6 py-2 bg-[#00FF4C] hover:bg-green-400 text-black font-bold rounded-md transition-colors"
        >
          Join Now
        </Link>
      </div>
    </div>
  );
}