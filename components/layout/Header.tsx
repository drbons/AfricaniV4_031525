"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ChevronDown, Map, ChevronLeft, ChevronRight } from 'lucide-react';
import { STATES } from '@/lib/data';
import AuthButton from '@/components/auth/AuthButton';

export default function Header() {
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);
  
  // African countries flags
  const africanFlags = [
    { country: "Nigeria", code: "ng" },
    { country: "South Africa", code: "za" },
    { country: "Egypt", code: "eg" },
    { country: "Kenya", code: "ke" },
    { country: "Ghana", code: "gh" },
    { country: "Morocco", code: "ma" },
    { country: "Algeria", code: "dz" },
    { country: "Ethiopia", code: "et" },
    { country: "Tanzania", code: "tz" },
    { country: "Uganda", code: "ug" },
    { country: "Senegal", code: "sn" },
    { country: "Cameroon", code: "cm" },
    { country: "Ivory Coast", code: "ci" },
    { country: "Tunisia", code: "tn" },
    { country: "Zimbabwe", code: "zw" }
  ];
  
  const totalSlides = Math.ceil(africanFlags.length / 3);
  
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [totalSlides, isPaused]);
  
  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };
  
  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };
  
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
    setSelectedCity('');
  };

  const cities = selectedState 
    ? STATES.find(state => state.abbreviation === selectedState)?.cities || []
    : [];

  return (
    <header className="bg-[#1B1F2B] text-white sticky top-0 z-50">
      {/* African Flags Slideshow */}
      <div className="relative h-20 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-16 w-full max-w-[1440px] mx-auto px-4">
            <div 
              className="absolute inset-0 flex items-center justify-center"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="relative w-full overflow-hidden">
                <div 
                  ref={slideRef}
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                    <div key={slideIndex} className="flex-shrink-0 w-full flex justify-center space-x-4 md:space-x-8">
                      {africanFlags.slice(slideIndex * 3, slideIndex * 3 + 3).map((flag) => (
                        <div key={flag.code} className="relative h-12 w-20 md:h-14 md:w-24 rounded-md overflow-hidden shadow-md">
                          <Image
                            src={`https://flagcdn.com/w320/${flag.code}.png`}
                            alt={`Flag of ${flag.country}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-end justify-center">
                            <span className="text-white text-xs font-medium pb-1">{flag.country}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Navigation Arrows */}
              <button 
                onClick={handlePrev}
                className="absolute left-2 bg-black bg-opacity-30 rounded-full p-1 hover:bg-opacity-50 transition-opacity"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-2 bg-black bg-opacity-30 rounded-full p-1 hover:bg-opacity-50 transition-opacity"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
              
              {/* Slide Indicators */}
              <div className="absolute bottom-1 flex space-x-1 justify-center">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      currentSlide === index ? 'w-4 bg-[#00FF4C]' : 'w-1.5 bg-white bg-opacity-50'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Header Content */}
      <div className="h-[60px] max-w-[1440px] mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center">
            <Map className="h-6 w-6 mr-2 text-[#00FF4C]" />
            <span className="font-bold text-lg">African Business</span>
          </Link>
          
          <div className="hidden md:flex space-x-2">
            <div className="relative">
              <select
                value={selectedState}
                onChange={handleStateChange}
                className="appearance-none bg-[#2A2F3E] text-white px-3 py-1 rounded-md pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select State</option>
                {STATES.map((state) => (
                  <option key={state.abbreviation} value={state.abbreviation}>
                    {state.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedState}
                className="appearance-none bg-[#2A2F3E] text-white px-3 py-1 rounded-md pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
          </div>
        </div>
        
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for General Contractor..."
              className="w-full bg-white text-gray-800 px-4 py-1.5 rounded-full pl-10 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-4">
          <nav className="flex space-x-4 text-sm">
            <Link href="/for-you" className="hover:text-green-400 transition-colors">For You</Link>
            <Link href="/recent" className="hover:text-green-400 transition-colors">Recent</Link>
            <Link href="/nearby" className="hover:text-green-400 transition-colors">Nearby</Link>
            <Link href="/trending" className="hover:text-green-400 transition-colors">Trending</Link>
          </nav>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}