'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  text?: string;
}

/**
 * A reusable loading spinner component
 */
export default function LoadingSpinner({
  size = 'md',
  color = '#00FF4C',
  className,
  text,
}: LoadingSpinnerProps) {
  // Size mappings
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className || ''}`}>
      <Loader2 
        className={`${sizeMap[size]} animate-spin`} 
        style={{ color }}
      />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
} 