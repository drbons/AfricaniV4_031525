import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="h-[60px] bg-[#1B1F2B] text-white">
      <div className="h-full max-w-[1440px] mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/about" className="text-sm hover:text-green-400 transition-colors">
            About Us
          </Link>
          <div className="flex items-center text-sm">
            <Mail className="h-4 w-4 mr-1" />
            <span>contact@africanbusiness.com</span>
          </div>
          <div className="hidden md:flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            <span>123 Business Ave, New York, NY</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="https://facebook.com" className="text-white hover:text-green-400 transition-colors">
            <Facebook className="h-5 w-5" />
          </Link>
          <Link href="https://twitter.com" className="text-white hover:text-green-400 transition-colors">
            <Twitter className="h-5 w-5" />
          </Link>
          <Link href="https://instagram.com" className="text-white hover:text-green-400 transition-colors">
            <Instagram className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}