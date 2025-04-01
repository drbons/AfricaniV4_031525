import { Business } from '@/types/firebase';

export const sampleBusinesses: Business[] = [
  // Technology & IT
  {
    id: 'tech1',
    name: 'AfriTech Solutions',
    category: 'Technology & IT',
    description: 'Leading software development and IT consulting firm in Africa',
    location: 'Lagos, Nigeria',
    rating: 4.8,
    reviews: 45,
    imageUrl: 'https://source.unsplash.com/random/800x600/?tech',
    userId: 'sample',
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: true
  },
  {
    id: 'tech2',
    name: 'Digital Safari',
    category: 'Technology & IT',
    description: 'Innovative mobile app development and digital solutions',
    location: 'Nairobi, Kenya',
    rating: 4.5,
    reviews: 32,
    imageUrl: 'https://source.unsplash.com/random/800x600/?software',
    userId: 'sample',
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: true
  },
  {
    id: 'tech3',
    name: 'CyberAfrica',
    category: 'Technology & IT',
    description: 'Cybersecurity and network solutions for African businesses',
    location: 'Cairo, Egypt',
    rating: 4.7,
    reviews: 28,
    imageUrl: 'https://source.unsplash.com/random/800x600/?cybersecurity',
    userId: 'sample',
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: false
  },

  // Healthcare
  {
    id: 'health1',
    name: 'AfriHealth Center',
    category: 'Healthcare',
    description: 'Modern healthcare facility with state-of-the-art equipment',
    location: 'Accra, Ghana',
    rating: 4.9,
    reviews: 56,
    imageUrl: 'https://source.unsplash.com/random/800x600/?hospital',
    userId: 'sample',
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: true
  },
  {
    id: 'health2',
    name: 'Wellness Africa',
    category: 'Healthcare',
    description: 'Holistic healthcare and wellness services',
    location: 'Johannesburg, South Africa',
    rating: 4.6,
    reviews: 41,
    imageUrl: 'https://source.unsplash.com/random/800x600/?wellness',
    userId: 'sample',
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: false
  },
  {
    id: 'health3',
    name: 'MediCare Plus',
    category: 'Healthcare',
    description: 'Affordable and accessible healthcare solutions',
    location: 'Addis Ababa, Ethiopia',
    rating: 4.4,
    reviews: 35,
    imageUrl: 'https://source.unsplash.com/random/800x600/?medical',
    userId: 'sample',
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: true
  },

  // Education
  {
    id: 'edu1',
    name: 'African Learning Academy',
    category: 'Education',
    description: 'Quality education with modern teaching methods',
    location: 'Kigali, Rwanda',
    rating: 4.8,
    reviews: 48,
    imageUrl: 'https://source.unsplash.com/random/800x600/?education',
    userId: 'sample',
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: true
  },
  {
    id: 'edu2',
    name: 'TechSkills Africa',
    category: 'Education',
    description: 'Professional tech skills training and certification',
    location: 'Dakar, Senegal',
    rating: 4.7,
    reviews: 39,
    imageUrl: 'https://source.unsplash.com/random/800x600/?training',
    userId: 'sample',
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: false
  },
  {
    id: 'edu3',
    name: 'Future Leaders Institute',
    category: 'Education',
    description: 'Developing tomorrow\'s African leaders',
    location: 'Kampala, Uganda',
    rating: 4.9,
    reviews: 52,
    imageUrl: 'https://source.unsplash.com/random/800x600/?school',
    userId: 'sample',
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: true
  }
]; 