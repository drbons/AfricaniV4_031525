"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  MessageSquare, 
  Bell, 
  Calendar, 
  Store,
  Grid,
  Info,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', icon: Home, href: '/' },
  { name: 'Marketplace', icon: Store, href: '/marketplace' },
  { name: 'Chats', icon: MessageSquare, href: '/chats' },
  { name: 'Notifications', icon: Bell, href: '/notifications' },
  { name: 'Events', icon: Calendar, href: '/events' },
  { name: 'Categories', icon: Grid, href: '/categories' },
  { name: 'About Us', icon: Info, href: '/about-us' },
  { name: 'Contact Us', icon: Phone, href: '/contact-us' }
];

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState('Home');
  const router = useRouter();

  return (
    <aside className="w-[240px] bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-6">
        <h2 className="font-bold text-xl mb-8 text-gray-800">African Business</h2>
        <nav className="space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                activeItem === item.name 
                  ? "text-green-600 bg-green-50 shadow-sm" 
                  : "text-gray-700 hover:bg-gray-50"
              )}
              onClick={() => setActiveItem(item.name)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 text-sm text-gray-500 border-t border-gray-100">
        <p>© 2025 African Business</p>
      </div>
    </aside>
  );
}