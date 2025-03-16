"use client";

import { ShoppingBag } from 'lucide-react';

export default function MarketplaceHeader() {
  return (
    <div>
      <div className="flex items-center">
        <ShoppingBag className="h-7 w-7 mr-3 text-[#00FF4C]" />
        <h1 className="text-2xl font-bold">Marketplace - For Sale & Free</h1>
      </div>
      <p className="text-gray-600 mt-1">
        Buy and sell items in your local community
      </p>
    </div>
  );
} 