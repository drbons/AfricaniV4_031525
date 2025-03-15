"use client";

import { useState, useEffect } from 'react';
import { Star, Facebook, Twitter, Instagram } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Business {
  id: string;
  name: string;
  owner: string;
  contact: string;
  social_media: string[];
  location: string;
  rating: 'silver' | 'gold' | 'platinum';
  image: string;
  city: string;
  state: string;
  category: string;
  ratingScore: number;
  reviewCount: number;
}

// Dummy data for businesses
const DUMMY_BUSINESSES: Business[] = [
  // Real Estate
  {
    id: "1",
    name: "African Real Estate Co.",
    owner: "John Doe",
    contact: "+1-555-123-4567",
    social_media: ["FB: africanrealestate", "X: @africanRE", "Instagram: african_re"],
    location: "Los Angeles, CA",
    city: "Los Angeles",
    state: "CA",
    category: "Real Estate",
    rating: "gold",
    ratingScore: 4.2,
    reviewCount: 87,
    image: "https://picsum.photos/300/200?random=1"
  },
  {
    id: "2",
    name: "Savanna Properties",
    owner: "Jane Smith",
    contact: "+1-555-234-5678",
    social_media: ["FB: savannaprops", "X: @savannaRE", "Instagram: savanna_re"],
    location: "Phoenix, AZ",
    city: "Phoenix",
    state: "AZ",
    category: "Real Estate",
    rating: "platinum",
    ratingScore: 4.9,
    reviewCount: 156,
    image: "https://picsum.photos/300/200?random=2"
  },
  {
    id: "3",
    name: "Heritage Homes",
    owner: "Michael Johnson",
    contact: "+1-555-345-6789",
    social_media: ["FB: heritagehomes", "X: @heritageRE", "Instagram: heritage_homes"],
    location: "Birmingham, AL",
    city: "Birmingham",
    state: "AL",
    category: "Real Estate",
    rating: "silver",
    ratingScore: 3.8,
    reviewCount: 42,
    image: "https://picsum.photos/300/200?random=3"
  },
  {
    id: "4",
    name: "Urban Living Realty",
    owner: "Sarah Williams",
    contact: "+1-555-456-7890",
    social_media: ["FB: urbanlivingrealty", "X: @urbanlivingRE", "Instagram: urban_living"],
    location: "New York, NY",
    city: "New York",
    state: "NY",
    category: "Real Estate",
    rating: "gold",
    ratingScore: 4.5,
    reviewCount: 112,
    image: "https://picsum.photos/300/200?random=4"
  },
  {
    id: "5",
    name: "Sunshine Properties",
    owner: "David Brown",
    contact: "+1-555-567-8901",
    social_media: ["FB: sunshineprops", "X: @sunshineRE", "Instagram: sunshine_props"],
    location: "Miami, FL",
    city: "Miami",
    state: "FL",
    category: "Real Estate",
    rating: "platinum",
    ratingScore: 4.8,
    reviewCount: 203,
    image: "https://picsum.photos/300/200?random=5"
  },
  {
    id: "6",
    name: "Coastal Realty Group",
    owner: "Emily Davis",
    contact: "+1-555-678-9012",
    social_media: ["FB: coastalrealty", "X: @coastalRE", "Instagram: coastal_realty"],
    location: "San Francisco, CA",
    city: "San Francisco",
    state: "CA",
    category: "Real Estate",
    rating: "gold",
    ratingScore: 4.3,
    reviewCount: 95,
    image: "https://picsum.photos/300/200?random=6"
  },
  {
    id: "7",
    name: "Midwest Property Solutions",
    owner: "Robert Wilson",
    contact: "+1-555-789-0123",
    social_media: ["FB: midwestproperty", "X: @midwestRE", "Instagram: midwest_property"],
    location: "Chicago, IL",
    city: "Chicago",
    state: "IL",
    category: "Real Estate",
    rating: "silver",
    ratingScore: 3.9,
    reviewCount: 67,
    image: "https://picsum.photos/300/200?random=7"
  },
  {
    id: "8",
    name: "Southern Comfort Homes",
    owner: "Lisa Martinez",
    contact: "+1-555-890-1234",
    social_media: ["FB: southerncomfort", "X: @southernRE", "Instagram: southern_comfort"],
    location: "Atlanta, GA",
    city: "Atlanta",
    state: "GA",
    category: "Real Estate",
    rating: "gold",
    ratingScore: 4.4,
    reviewCount: 128,
    image: "https://picsum.photos/300/200?random=8"
  },
  {
    id: "9",
    name: "Mountain View Properties",
    owner: "James Taylor",
    contact: "+1-555-901-2345",
    social_media: ["FB: mountainview", "X: @mountainRE", "Instagram: mountain_view"],
    location: "Denver, CO",
    city: "Denver",
    state: "CO",
    category: "Real Estate",
    rating: "platinum",
    ratingScore: 4.7,
    reviewCount: 175,
    image: "https://picsum.photos/300/200?random=9"
  },
  {
    id: "10",
    name: "Capital City Realty",
    owner: "Jennifer Anderson",
    contact: "+1-555-012-3456",
    social_media: ["FB: capitalcity", "X: @capitalRE", "Instagram: capital_city"],
    location: "Washington, DC",
    city: "Washington",
    state: "DC",
    category: "Real Estate",
    rating: "gold",
    ratingScore: 4.1,
    reviewCount: 82,
    image: "https://picsum.photos/300/200?random=10"
  },
  
  // Medical Professionals
  {
    id: "11",
    name: "African Health Clinic",
    owner: "Dr. Samuel Johnson",
    contact: "+1-555-123-7890",
    social_media: ["FB: africanhealthclinic", "X: @africanhealth", "Instagram: african_health"],
    location: "Los Angeles, CA",
    city: "Los Angeles",
    state: "CA",
    category: "Medical Professionals",
    rating: "platinum",
    ratingScore: 4.9,
    reviewCount: 215,
    image: "https://picsum.photos/300/200?random=11"
  },
  {
    id: "12",
    name: "Wellness Medical Center",
    owner: "Dr. Maria Rodriguez",
    contact: "+1-555-234-8901",
    social_media: ["FB: wellnessmedical", "X: @wellnessmed", "Instagram: wellness_medical"],
    location: "Phoenix, AZ",
    city: "Phoenix",
    state: "AZ",
    category: "Medical Professionals",
    rating: "gold",
    ratingScore: 4.5,
    reviewCount: 178,
    image: "https://picsum.photos/300/200?random=12"
  },
  {
    id: "13",
    name: "Family Care Practice",
    owner: "Dr. Robert Johnson",
    contact: "+1-555-345-9012",
    social_media: ["FB: familycarepractice", "X: @familycare", "Instagram: family_care"],
    location: "Chicago, IL",
    city: "Chicago",
    state: "IL",
    category: "Medical Professionals",
    rating: "silver",
    ratingScore: 3.9,
    reviewCount: 87,
    image: "https://picsum.photos/300/200?random=13"
  },
  {
    id: "14",
    name: "Premier Dental Clinic",
    owner: "Dr. Sarah Williams",
    contact: "+1-555-456-0123",
    social_media: ["FB: premierdentalclinic", "X: @premierdental", "Instagram: premier_dental"],
    location: "New York, NY",
    city: "New York",
    state: "NY",
    category: "Medical Professionals",
    rating: "gold",
    ratingScore: 4.6,
    reviewCount: 156,
    image: "https://picsum.photos/300/200?random=14"
  },
  {
    id: "15",
    name: "Sunshine Pediatrics",
    owner: "Dr. Emily Johnson",
    contact: "+1-555-567-1234",
    social_media: ["FB: sunshinepediatrics", "X: @sunshinepeds", "Instagram: sunshine_pediatrics"],
    location: "Miami, FL",
    city: "Miami",
    state: "FL",
    category: "Medical Professionals",
    rating: "platinum",
    ratingScore: 4.8,
    reviewCount: 189,
    image: "https://picsum.photos/300/200?random=15"
  },
  {
    id: "16",
    name: "Harmony Mental Health",
    owner: "Dr. David Wilson",
    contact: "+1-555-678-2345",
    social_media: ["FB: harmonymentalhealth", "X: @harmonymh", "Instagram: harmony_mental_health"],
    location: "San Francisco, CA",
    city: "San Francisco",
    state: "CA",
    category: "Medical Professionals",
    rating: "gold",
    ratingScore: 4.4,
    reviewCount: 132,
    image: "https://picsum.photos/300/200?random=16"
  },
  {
    id: "17",
    name: "Heartland Cardiology",
    owner: "Dr. Michael Brown",
    contact: "+1-555-789-3456",
    social_media: ["FB: heartlandcardio", "X: @heartlandcardio", "Instagram: heartland_cardiology"],
    location: "Chicago, IL",
    city: "Chicago",
    state: "IL",
    category: "Medical Professionals",
    rating: "platinum",
    ratingScore: 4.7,
    reviewCount: 167,
    image: "https://picsum.photos/300/200?random=17"
  },
  {
    id: "18",
    name: "Southern Physical Therapy",
    owner: "Dr. Lisa Davis",
    contact: "+1-555-890-4567",
    social_media: ["FB: southernpt", "X: @southernpt", "Instagram: southern_pt"],
    location: "Atlanta, GA",
    city: "Atlanta",
    state: "GA",
    category: "Medical Professionals",
    rating: "silver",
    ratingScore: 4.0,
    reviewCount: 98,
    image: "https://picsum.photos/300/200?random=18"
  },
  
  // Restaurants
  {
    id: "21",
    name: "African Delights",
    owner: "Chef Kwame Johnson",
    contact: "+1-555-345-6789",
    social_media: ["FB: africandelights", "X: @africandelights", "Instagram: african_delights"],
    location: "New York, NY",
    city: "New York",
    state: "NY",
    category: "Restaurants",
    rating: "platinum",
    ratingScore: 4.8,
    reviewCount: 312,
    image: "https://picsum.photos/300/200?random=21"
  },
  {
    id: "22",
    name: "Savanna Grill",
    owner: "Chef Amara Williams",
    contact: "+1-555-456-7890",
    social_media: ["FB: savannagrill", "X: @savannagrill", "Instagram: savanna_grill"],
    location: "Chicago, IL",
    city: "Chicago",
    state: "IL",
    category: "Restaurants",
    rating: "gold",
    ratingScore: 4.6,
    reviewCount: 245,
    image: "https://picsum.photos/300/200?random=22"
  },
  {
    id: "23",
    name: "Taste of Africa",
    owner: "Chef Michael Brown",
    contact: "+1-555-567-8901",
    social_media: ["FB: tasteofafrica", "X: @tasteofafrica", "Instagram: taste_of_africa"],
    location: "Los Angeles, CA",
    city: "Los Angeles",
    state: "CA",
    category: "Restaurants",
    rating: "platinum",
    ratingScore: 4.9,
    reviewCount: 287,
    image: "https://picsum.photos/300/200?random=23"
  },
  {
    id: "24",
    name: "Spice Kingdom",
    owner: "Chef Lisa Martinez",
    contact: "+1-555-678-9012",
    social_media: ["FB: spicekingdom", "X: @spicekingdom", "Instagram: spice_kingdom"],
    location: "Houston, TX",
    city: "Houston",
    state: "TX",
    category: "Restaurants",
    rating: "gold",
    ratingScore: 4.5,
    reviewCount: 198,
    image: "https://picsum.photos/300/200?random=24"
  },
  {
    id: "25",
    name: "Mama's Kitchen",
    owner: "Chef Sarah Johnson",
    contact: "+1-555-789-0123",
    social_media: ["FB: mamaskitchen", "X: @mamaskitchen", "Instagram: mamas_kitchen"],
    location: "Atlanta, GA",
    city: "Atlanta",
    state: "GA",
    category: "Restaurants",
    rating: "silver",
    ratingScore: 4.2,
    reviewCount: 156,
    image: "https://picsum.photos/300/200?random=25"
  },
  {
    id: "26",
    name: "Ocean Flavors",
    owner: "Chef David Wilson",
    contact: "+1-555-890-1234",
    social_media: ["FB: oceanflavors", "X: @oceanflavors", "Instagram: ocean_flavors"],
    location: "Miami, FL",
    city: "Miami",
    state: "FL",
    category: "Restaurants",
    rating: "gold",
    ratingScore: 4.4,
    reviewCount: 178,
    image: "https://picsum.photos/300/200?random=26"
  },
  {
    id: "27",
    name: "Desert Oasis Cafe",
    owner: "Chef Emily Brown",
    contact: "+1-555-901-2345",
    social_media: ["FB: desertoasis", "X: @desertoasis", "Instagram: desert_oasis"],
    location: "Phoenix, AZ",
    city: "Phoenix",
    state: "AZ",
    category: "Restaurants",
    rating: "platinum",
    ratingScore: 4.7,
    reviewCount: 223,
    image: "https://picsum.photos/300/200?random=27"
  },
  {
    id: "28",
    name: "Mountain View Bistro",
    owner: "Chef Robert Davis",
    contact: "+1-555-012-3456",
    social_media: ["FB: mountainviewbistro", "X: @mvbistro", "Instagram: mountain_view_bistro"],
    location: "Denver, CO",
    city: "Denver",
    state: "CO",
    category: "Restaurants",
    rating: "gold",
    ratingScore: 4.5,
    reviewCount: 187,
    image: "https://picsum.photos/300/200?random=28"
  },
  
  // Education
  {
    id: "31",
    name: "African Heritage College",
    owner: "Dr. James Taylor",
    contact: "+1-555-789-0123",
    social_media: ["FB: africanheritage", "X: @africanheritage", "Instagram: african_heritage"],
    location: "Atlanta, GA",
    city: "Atlanta",
    state: "GA",
    category: "Education",
    rating: "gold",
    ratingScore: 4.4,
    reviewCount: 156,
    image: "https://picsum.photos/300/200?random=31"
  },
  {
    id: "32",
    name: "Global Scholars Academy",
    owner: "Dr. Jennifer Anderson",
    contact: "+1-555-890-1234",
    social_media: ["FB: globalscholars", "X: @globalscholars", "Instagram: global_scholars"],
    location: "Washington, DC",
    city: "Washington",
    state: "DC",
    category: "Education",
    rating: "platinum",
    ratingScore: 4.8,
    reviewCount: 203,
    image: "https://picsum.photos/300/200?random=32"
  },
  {
    id: "33",
    name: "Future Leaders Institute",
    owner: "Dr. Michael Wilson",
    contact: "+1-555-901-2345",
    social_media: ["FB: futureleaders", "X: @futureleaders", "Instagram: future_leaders"],
    location: "Chicago, IL",
    city: "Chicago",
    state: "IL",
    category: "Education",
    rating: "gold",
    ratingScore: 4.5,
    reviewCount: 178,
    image: "https://picsum.photos/300/200?random=33"
  },
  {
    id: "34",
    name: "Excellence STEM Academy",
    owner: "Dr. Sarah Brown",
    contact: "+1-555-012-3456",
    social_media: ["FB: excellencestem", "X: @excellencestem", "Instagram: excellence_stem"],
    location: "San Francisco, CA",
    city: "San Francisco",
    state: "CA",
    category: "Education",
    rating: "platinum",
    ratingScore: 4.9,
    reviewCount: 215,
    image: "https://picsum.photos/300/200?random=34"
  },
  
  // Beauty
  {
    id: "41",
    name: "African Beauty Salon",
    owner: "Amara Johnson",
    contact: "+1-555-123-4567",
    social_media: ["FB: africanbeauty", "X: @africanbeauty", "Instagram: african_beauty"],
    location: "New York, NY",
    city: "New York",
    state: "NY",
    category: "Beauty",
    rating: "platinum",
    ratingScore: 4.8,
    reviewCount: 245,
    image: "https://picsum.photos/300/200?random=41"
  },
  {
    id: "42",
    name: "Natural Hair Studio",
    owner: "Zara Williams",
    contact: "+1-555-234-5678",
    social_media: ["FB: naturalhairstudio", "X: @naturalhairstudio", "Instagram: natural_hair_studio"],
    location: "Atlanta, GA",
    city: "Atlanta",
    state: "GA",
    category: "Beauty",
    rating: "gold",
    ratingScore: 4.6,
    reviewCount: 198,
    image: "https://picsum.photos/300/200?random=42"
  },
  {
    id: "43",
    name: "Glow Skincare Spa",
    owner: "Maya Brown",
    contact: "+1-555-345-6789",
    social_media: ["FB: glowskincare", "X: @glowskincare", "Instagram: glow_skincare"],
    location: "Los Angeles, CA",
    city: "Los Angeles",
    state: "CA",
    category: "Beauty",
    rating: "platinum",
    ratingScore: 4.9,
    reviewCount: 267,
    image: "https://picsum.photos/300/200?random=43"
  },
  {
    id: "44",
    name: "Royal Nails & Spa",
    owner: "Nia Davis",
    contact: "+1-555-456-7890",
    social_media: ["FB: royalnails", "X: @royalnails", "Instagram: royal_nails"],
    location: "Houston, TX",
    city: "Houston",
    state: "TX",
    category: "Beauty",
    rating: "gold",
    ratingScore: 4.5,
    reviewCount: 178,
    image: "https://picsum.photos/300/200?random=44"
  },
  {
    id: "45",
    name: "Essence Beauty Supply",
    owner: "Kira Wilson",
    contact: "+1-555-567-8901",
    social_media: ["FB: essencebeauty", "X: @essencebeauty", "Instagram: essence_beauty"],
    location: "Chicago, IL",
    city: "Chicago",
    state: "IL",
    category: "Beauty",
    rating: "silver",
    ratingScore: 4.2,
    reviewCount: 132,
    image: "https://picsum.photos/300/200?random=45"
  },
  {
    id: "46",
    name: "Braids & Locs Studio",
    owner: "Tasha Martinez",
    contact: "+1-555-678-9012",
    social_media: ["FB: braidsandlocs", "X: @braidsandlocs", "Instagram: braids_and_locs"],
    location: "Miami, FL",
    city: "Miami",
    state: "FL",
    category: "Beauty",
    rating: "gold",
    ratingScore: 4.7,
    reviewCount: 215,
    image: "https://picsum.photos/300/200?random=46"
  },
  
  // For Sale
  {
    id: "51",
    name: "African Marketplace",
    owner: "Kofi Johnson",
    contact: "+1-555-789-0123",
    social_media: ["FB: africanmarketplace", "X: @africanmarket", "Instagram: african_marketplace"],
    location: "New York, NY",
    city: "New York",
    state: "NY",
    category: "For Sale",
    rating: "gold",
    ratingScore: 4.5,
    reviewCount: 178,
    image: "https://picsum.photos/300/200?random=51"
  },
  {
    id: "52",
    name: "Heritage Crafts & Goods",
    owner: "Ade Williams",
    contact: "+1-555-890-1234",
    social_media: ["FB: heritagecrafts", "X: @heritagecrafts", "Instagram: heritage_crafts"],
    location: "Atlanta, GA",
    city: "Atlanta",
    state: "GA",
    category: "For Sale",
    rating: "platinum",
    ratingScore: 4.8,
    reviewCount: 223,
    image: "https://picsum.photos/300/200?random=52"
  },
  {
    id: "53",
    name: "Global Treasures",
    owner: "Femi Brown",
    contact: "+1-555-901-2345",
    social_media: ["FB: globaltreasures", "X: @globaltreasures", "Instagram: global_treasures"],
    location: "Los Angeles, CA",
    city: "Los Angeles",
    state: "CA",
    category: "For Sale",
    rating: "gold",
    ratingScore: 4.6,
    reviewCount: 198,
    image: "https://picsum.photos/300/200?random=53"
  },
  {
    id: "54",
    name: "Authentic African Imports",
    owner: "Kwame Davis",
    contact: "+1-555-012-3456",
    social_media: ["FB: africanimports", "X: @africanimports", "Instagram: african_imports"],
    location: "Houston, TX",
    city: "Houston",
    state: "TX",
    category: "For Sale",
    rating: "silver",
    ratingScore: 4.3,
    reviewCount: 156,
    image: "https://picsum.photos/300/200?random=54"
  },
  {
    id: "55",
    name: "Cultural Artifacts Gallery",
    owner: "Zainab Wilson",
    contact: "+1-555-123-4567",
    social_media: ["FB: culturalartifacts", "X: @culturalart", "Instagram: cultural_artifacts"],
    location: "Chicago, IL",
    city: "Chicago",
    state: "IL",
    category: "For Sale",
    rating: "platinum",
    ratingScore: 4.9,
    reviewCount: 245,
    image: "https://picsum.photos/300/200?random=55"
  },
  {
    id: "56",
    name: "Diaspora Collectibles",
    owner: "Chidi Martinez",
    contact: "+1-555-234-5678",
    social_media: ["FB: diasporacollectibles", "X: @diasporacoll", "Instagram: diaspora_collectibles"],
    location: "Miami, FL",
    city: "Miami",
    state: "FL",
    category: "For Sale",
    rating: "gold",
    ratingScore: 4.7,
    reviewCount: 187,
    image: "https://picsum.photos/300/200?random=56"
  }
];

// Map category URL names to display names
const CATEGORY_MAP: Record<string, string> = {
  'real estate': 'Real Estate',
  'real-estate': 'Real Estate',
  'medical professionals': 'Medical Professionals',
  'medical-professionals': 'Medical Professionals',
  'med profs': 'Medical Professionals',
  'med-profs': 'Medical Professionals',
  'restaurants': 'Restaurants',
  'colleges': 'Education',
  'scholarships': 'Education',
  'beauty': 'Beauty',
  'for sale': 'For Sale',
  'for-sale': 'For Sale'
};

export default function CategoryBusinessList({ category }: { category: string }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Normalize the category name
  const normalizedCategory = CATEGORY_MAP[category.toLowerCase()] || category;

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      setError(null);

      try {
        // First try to fetch from Firebase
        const businessesRef = collection(db, 'businesses');
        const q = query(
          businessesRef,
          where('category', '==', normalizedCategory),
          limit(20)
        );

        const querySnapshot = await getDocs(q);
        const fetchedBusinesses: Business[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedBusinesses.push({
            id: doc.id,
            name: data.name,
            owner: data.owner || 'Unknown',
            contact: data.phone || data.contact || 'No contact info',
            social_media: data.socialMedia ? Object.values(data.socialMedia).filter(Boolean) : [],
            location: `${data.city}, ${data.state}`,
            city: data.city,
            state: data.state,
            category: data.category,
            rating: data.rating || 'silver',
            ratingScore: data.ratingScore || 3.0,
            reviewCount: data.reviewCount || 0,
            image: data.images && data.images.length > 0 ? data.images[0] : `https://picsum.photos/300/200?random=${doc.id}`
          } as Business);
        });

        // If we got results from Firebase, use those
        if (fetchedBusinesses.length > 0) {
          setBusinesses(fetchedBusinesses);
        } else {
          // Otherwise, fall back to dummy data
          const filteredDummyBusinesses = DUMMY_BUSINESSES.filter(
            business => business.category.toLowerCase() === normalizedCategory.toLowerCase()
          );
          setBusinesses(filteredDummyBusinesses);
        }
      } catch (err: any) {
        console.error("Error fetching businesses:", err);
        setError(err.message);
        
        // Fall back to dummy data on error
        const filteredDummyBusinesses = DUMMY_BUSINESSES.filter(
          business => business.category.toLowerCase() === normalizedCategory.toLowerCase()
        );
        setBusinesses(filteredDummyBusinesses);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [normalizedCategory]);

  const renderRatingStars = (rating: string, score: number) => {
    const stars: React.ReactNode[] = [];
    const starCount = rating === 'platinum' ? 5 : rating === 'gold' ? 4 : 3;
    const starColor = rating === 'platinum' 
      ? 'text-blue-500' 
      : rating === 'gold' 
        ? 'text-yellow-500' 
        : 'text-gray-400';
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-4 w-4 ${i < starCount ? `${starColor} fill-current` : 'text-gray-300'}`} 
        />
      );
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="h-40 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        Error loading businesses: {error}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No businesses found in this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {businesses.map((business) => (
        <div key={business.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 h-48 md:h-auto relative">
              <Image
                src={business.image}
                alt={business.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4 md:w-2/3">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{business.name}</h3>
                <div className="flex">
                  {renderRatingStars(business.rating, business.ratingScore)}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-1">Owner: {business.owner}</p>
              
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600 flex items-center">
                  <span className="font-medium mr-2">Contact:</span> {business.contact}
                </p>
                <p className="text-sm text-gray-600 flex items-center">
                  <span className="font-medium mr-2">Location:</span> {business.location}
                </p>
                <div className="text-sm text-gray-600">
                  <span className="font-medium mr-2">Social Media:</span>
                  <div className="flex mt-1 space-x-2">
                    {business.social_media.map((social, index) => {
                      if (social.includes('FB:') || social.includes('facebook')) {
                        return (
                          <div key={index} className="flex items-center text-blue-600">
                            <Facebook className="h-4 w-4 mr-1" />
                            <span className="text-xs">{social.replace('FB: ', '')}</span>
                          </div>
                        );
                      } else if (social.includes('X:') || social.includes('twitter')) {
                        return (
                          <div key={index} className="flex items-center text-gray-800">
                            <Twitter className="h-4 w-4 mr-1" />
                            <span className="text-xs">{social.replace('X: ', '')}</span>
                          </div>
                        );
                      } else if (social.includes('Instagram:') || social.includes('instagram')) {
                        return (
                          <div key={index} className="flex items-center text-pink-600">
                            <Instagram className="h-4 w-4 mr-1" />
                            <span className="text-xs">{social.replace('Instagram: ', '')}</span>
                          </div>
                        );
                      }
                      return (
                        <span key={index} className="text-xs">{social}</span>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                    {business.rating.charAt(0).toUpperCase() + business.rating.slice(1)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({business.reviewCount} reviews)
                  </span>
                </div>
                <Link 
                  href={`/business/${business.id}`} 
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="mt-6 flex justify-center">
        <Link 
          href="/"
          className="px-4 py-2 bg-[#00FF4C] hover:bg-green-400 text-black font-bold rounded-md transition-colors"
        >
          Back to Feed
        </Link>
      </div>
    </div>
  );
}