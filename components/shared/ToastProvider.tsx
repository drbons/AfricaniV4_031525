'use client';

import React from 'react';
import { Toaster } from '@/components/ui/toaster';

/**
 * Toast notification provider component
 * Wraps the application with the toast notification system
 */
export default function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
} 