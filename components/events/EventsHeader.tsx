"use client";

import { CalendarDays } from 'lucide-react';

export default function EventsHeader() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg p-6 md:p-8 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center">
            <CalendarDays className="h-8 w-8 mr-3" />
            <h1 className="text-2xl md:text-3xl font-bold">Community Events</h1>
          </div>
          <p className="mt-2 md:max-w-xl opacity-90">
            Discover and connect with upcoming events in your community. Find gatherings, 
            workshops, and celebrations that match your interests.
          </p>
        </div>
        
        <div className="flex flex-col md:items-end">
          <div className="bg-white/20 backdrop-blur-sm rounded-md px-4 py-3 md:ml-4">
            <p className="text-sm font-medium">Looking to promote your event?</p>
            <p className="mt-1 text-xs opacity-90">
              Post your event for free and reach the entire community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 