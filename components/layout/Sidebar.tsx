"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  MessageSquare, 
  Bell, 
  Users, 
  Calendar, 
  Share2, 
  ChevronDown, 
  ChevronUp,
  Tag,
  Building2,
  Stethoscope,
  GraduationCap,
  Award,
  UtensilsCrossed,
  Scissors,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', icon: Home, href: '/' },
  { name: 'For Sale & Free', icon: Tag, href: '/for-sale' },
  { name: 'Chats', icon: MessageSquare, href: '/chats' },
  { name: 'Notifications', icon: Bell, href: '/notifications' },
  { name: 'Groups', icon: Users, href: '/groups' },
  { name: 'Events', icon: Calendar, href: '/events' },
  { name: 'Invite Neighbors', icon: Share2, href: '/invite' },
];

const categoryItems = [
  { name: 'Real Estate', icon: Building2, href: '/categories/real-estate' },
  { name: 'Med Profs', icon: Stethoscope, href: '/categories/medical-professionals' },
  { name: 'Colleges', icon: GraduationCap, href: '/categories/colleges' },
  { name: 'Scholarships', icon: Award, href: '/categories/scholarships' },
  { name: 'Restaurants', icon: UtensilsCrossed, href: '/categories/restaurants' },
  { name: 'Beauty', icon: Scissors, href: '/categories/beauty' },
  { name: 'For Sale', icon: ShoppingBag, href: '/categories/for-sale' },
];

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState('Home');
  const [expandedCategories, setExpandedCategories] = useState(false);
  const router = useRouter();

  const toggleCategories = () => {
    setExpandedCategories(!expandedCategories);
  };

  return (
    <aside className="w-[200px] bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4">
        <h2 className="font-bold text-lg mb-6">African Business</h2>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors",
                activeItem === item.name ? "text-green-600 bg-green-50" : "text-gray-700"
              )}
              onClick={() => setActiveItem(item.name)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 px-4">
        <button
          onClick={toggleCategories}
          className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
        >
          <span>Categories</span>
          {expandedCategories ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expandedCategories && (
          <div className="mt-1 pl-2 space-y-1">
            {categoryItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setActiveItem(item.name)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto p-4 text-sm text-gray-500">
        <p>© 2025 African Business</p>
      </div>
    </aside>
  );
}