"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { STATES } from '@/lib/data';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Mail, MapPin, Phone, Calendar, Building, Shield, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface Profile {
  id: string;
  userId: string;
  fullName?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  phone?: string;
  bio?: string;
  role?: 'customer' | 'business';
  businessName?: string;
  businessAddress?: string;
  businessHours?: string;
  businessSocialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  membershipTier?: 'free' | 'gold' | 'platinum';
  isEmailVerified?: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState<'customer' | 'business'>('customer');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [facebookHandle, setFacebookHandle] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [membershipTier, setMembershipTier] = useState<'free' | 'gold' | 'platinum'>('free');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showBusinessFields, setShowBusinessFields] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getProfile = async () => {
      if (!authLoading && !user) {
        router.push('/auth');
        return;
      }

      if (user) {
        try {
          const docRef = doc(db, 'profiles', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const profileData = { id: docSnap.id, ...docSnap.data() } as Profile;
            setProfile(profileData);
            setFullName(profileData.fullName || user.displayName || '');
            setState(profileData.state || '');
            setCity(profileData.city || '');
            setPhone(profileData.phone || '');
            setBio(profileData.bio || '');
            setRole(profileData.role || 'customer');
            setShowBusinessFields(profileData.role === 'business');
            
            // Business fields
            if (profileData.role === 'business') {
              setBusinessName(profileData.businessName || '');
              setBusinessAddress(profileData.businessAddress || '');
              setBusinessHours(profileData.businessHours || '');
              setFacebookHandle(profileData.businessSocialMedia?.facebook || '');
              setTwitterHandle(profileData.businessSocialMedia?.twitter || '');
              setInstagramHandle(profileData.businessSocialMedia?.instagram || '');
              setMembershipTier(profileData.membershipTier || 'free');
            }
          } else {
            // Set display name from user object if profile doesn't exist
            setFullName(user.displayName || '');
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };
    
    if (!authLoading) {
      getProfile();
    }
  }, [user, authLoading, router]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(e.target.value);
    setCity('');
  };
  
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as 'customer' | 'business';
    setRole(newRole);
    setShowBusinessFields(newRole === 'business');
  };
  
  const cities = state 
    ? STATES.find(s => s.abbreviation === state)?.cities || []
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      if (!user) {
        router.push('/auth');
        return;
      }

      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      
      const profileData: any = {
        userId: user.uid,
        fullName,
        state,
        city,
        phone,
        bio,
        role,
        updatedAt: serverTimestamp()
      };
      
      // Add business fields if role is business
      if (role === 'business') {
        profileData.businessName = businessName;
        profileData.businessAddress = businessAddress;
        profileData.businessHours = businessHours;
        profileData.businessSocialMedia = {
          facebook: facebookHandle,
          twitter: twitterHandle,
          instagram: instagramHandle
        };
        profileData.membershipTier = membershipTier;
      }
      
      if (docSnap.exists()) {
        // Update existing profile
        await updateDoc(docRef, profileData);
      } else {
        // Create new profile
        profileData.createdAt = serverTimestamp();
        await setDoc(docRef, profileData);
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Profile updated successfully!
            </div>
          )}
          
          <div className="flex justify-center mb-6">
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-200">
              {user?.photoURL ? (
                <Image 
                  src={user.photoURL} 
                  alt={fullName || user.email || 'User'} 
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white text-2xl">
                  {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  disabled
                />
              </div>
              <div className="flex items-center mt-1">
                <div className={`h-2 w-2 rounded-full ${user?.emailVerified ? 'bg-green-500' : 'bg-yellow-500'} mr-2`}></div>
                <p className="text-xs text-gray-500">
                  {user?.emailVerified ? 'Email verified' : 'Email not verified'}
                  {!user?.emailVerified && (
                    <button 
                      type="button"
                      className="ml-2 text-blue-500 hover:underline"
                      onClick={() => {
                        // Send verification email logic would go here
                        alert('Verification email sent. Please check your inbox.');
                      }}
                    >
                      Verify now
                    </button>
                  )}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                Account Type
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  value={role}
                  onChange={handleRoleChange}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="customer">Customer/Buyer</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="state">
                State
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="state"
                  value={state}
                  onChange={handleStateChange}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select State</option>
                  {STATES.map((s) => (
                    <option key={s.abbreviation} value={s.abbreviation}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
                City
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!state}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  required
                >
                  <option value="">Select City</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Business fields */}
            {showBusinessFields && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-green-500" />
                  Business Information
                </h2>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="businessName">
                    Business Name
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required={role === 'business'}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="businessAddress">
                    Business Address
                  </label>
                  <input
                    id="businessAddress"
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required={role === 'business'}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="businessHours">
                    Hours of Operation
                  </label>
                  <input
                    id="businessHours"
                    type="text"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    placeholder="e.g., Mon-Fri: 9AM-5PM, Sat: 10AM-3PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Social Media
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 text-xs mb-1" htmlFor="facebookHandle">
                        Facebook
                      </label>
                      <input
                        id="facebookHandle"
                        type="text"
                        value={facebookHandle}
                        onChange={(e) => setFacebookHandle(e.target.value)}
                        placeholder="username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs mb-1" htmlFor="twitterHandle">
                        Twitter/X
                      </label>
                      <input
                        id="twitterHandle"
                        type="text"
                        value={twitterHandle}
                        onChange={(e) => setTwitterHandle(e.target.value)}
                        placeholder="username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs mb-1" htmlFor="instagramHandle">
                        Instagram
                      </label>
                      <input
                        id="instagramHandle"
                        type="text"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        placeholder="username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="membershipTier">
                    Membership Tier
                  </label>
                  <select
                    id="membershipTier"
                    value={membershipTier}
                    onChange={(e) => setMembershipTier(e.target.value as 'free' | 'gold' | 'platinum')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="free">Free</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {membershipTier === 'free' && 'Basic listing with limited features'}
                    {membershipTier === 'gold' && 'Enhanced visibility and additional features'}
                    {membershipTier === 'platinum' && 'Premium placement and all available features'}
                  </p>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </div>
            
            {profile && (
              <div className="mb-6 text-sm text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Member since: {profile.createdAt ? new Date(profile.createdAt.toDate()).toLocaleDateString() : 'Unknown'}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 bg-[#00FF4C] hover:bg-green-400 text-black font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center text-sm text-gray-500">
              <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />
              <span>Need to change your password or delete your account? Visit the <a href="/settings" className="text-blue-500 hover:underline">Settings page</a>.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}