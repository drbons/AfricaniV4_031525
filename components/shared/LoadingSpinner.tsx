'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
  text?: string;
  fullPage?: boolean;
}

/**
 * A reusable loading spinner component
 */
export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className,
  text,
  fullPage = false
}: LoadingSpinnerProps) {
  // Size mappings
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  // Color mappings
  const colorMap = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  };

  const spinnerClasses = cn(
    'animate-spin',
    sizeMap[size],
    colorMap[color],
    className
  );

  // Full page loading spinner
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
        <div className="flex flex-col items-center">
          <Loader2 className={spinnerClasses} />
          {text && <p className="mt-4 text-gray-700">{text}</p>}
        </div>
      </div>
    );
  }

  // Inline loading spinner
  return (
    <div className="flex items-center justify-center">
      <Loader2 className={spinnerClasses} />
      {text && <span className="ml-2">{text}</span>}
    </div>
  );
} 