"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { STATES } from '@/lib/data';
import { Mail, Lock, User, MapPin, Building2, Phone, Clock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  state: string;
  city: string;
  hasBusiness: boolean;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessHours: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// Error message mapping for Firebase auth errors
const errorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered. Please sign in or use a different email.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password is too weak. Please use at least 8 characters.',
  'auth/user-not-found': 'No account found with this email. Please sign up instead.',
  'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
  'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'password-mismatch': 'Passwords do not match. Please try again.',
  'password-too-short': 'Password must be at least 8 characters long.'
};

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const router = useRouter();
  const { user, isAuthenticated, signIn, signUp, signInWithGoogle } = useAuth();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && isAuthenticated) {
      console.log('[AuthForm] User already authenticated, redirecting handled by useAuth hook', { userId: user.uid });
    }
  }, [user, isAuthenticated, router]);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    state: '',
    city: '',
    hasBusiness: false,
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    businessHours: ''
  });

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      state: e.target.value,
      city: ''
    }));
  };
  
  const cities = formData.state 
    ? STATES.find(s => s.abbreviation === formData.state)?.cities || []
    : [];

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }
    
    // Confirm password validation (only for signup)
    if (isSignUp && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && currentStep < (formData.hasBusiness ? 3 : 2)) {
      // Validate first step for signup
      if (currentStep === 1 && !validateForm()) {
        return;
      }
      
      setCurrentStep(prev => prev + 1);
      return;
    }

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[AuthForm] Attempting authentication', { isSignUp, email: formData.email });
      
      if (isSignUp) {
        // Sign up
        const newUser = await signUp(formData.email, formData.password, {
          fullName: formData.fullName,
          city: formData.city,
          state: formData.state,
          businessDetails: formData.hasBusiness ? {
            name: formData.businessName,
            address: formData.businessAddress,
            phone: formData.businessPhone,
            hours: formData.businessHours
          } : undefined
        });
        
        console.log('[AuthForm] Sign up successful', { userId: newUser.uid });
        
        // Set a cookie to redirect to profile page after login
        document.cookie = "redirectAfterLogin=/profile; path=/; max-age=300";
      } else {
        // Sign in
        const signedInUser = await signIn(formData.email, formData.password);
        console.log('[AuthForm] Sign in successful', { userId: signedInUser.uid });
        // Redirect is handled by the useAuth hook
      }
    } catch (err: any) {
      console.error('[AuthForm] Authentication error:', err);
      
      // Convert Firebase error codes to user-friendly messages
      const errorCode = err.code || '';
      const errorMessage = errorMessages[errorCode] || err.message || 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[AuthForm] Attempting Google sign in');
      const googleUser = await signInWithGoogle();
      console.log('[AuthForm] Google sign in successful', { userId: googleUser.uid });
      // Redirect is handled by the useAuth hook
    } catch (err: any) {
      console.error('[AuthForm] Google sign in error:', err);
      
      // Convert Firebase error codes to user-friendly messages
      const errorCode = err.code || '';
      const errorMessage = errorMessages[errorCode] || err.message || 'An error occurred with Google sign in';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isSignUp ? 'Create an Account' : 'Sign In'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isSignUp && (
        <div className="flex justify-center mb-6">
          {[1, 2, formData.hasBusiness ? 3 : null].filter((step): step is number => step !== null).map((step) => (
            <div
              key={step}
              className={`flex items-center ${step !== 1 ? 'ml-4' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step !== (formData.hasBusiness ? 3 : 2) && (
                <div
                  className={`w-16 h-1 ml-2 ${
                    currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {(!isSignUp || currentStep === 1) && (
          <>
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
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  className={`w-full pl-10 px-3 py-2 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                  required
                />
              </div>
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, password: e.target.value }));
                    if (validationErrors.password) {
                      setValidationErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  className={`w-full pl-10 pr-10 py-2 border ${validationErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
              )}
              {isSignUp && !validationErrors.password && (
                <p className="text-gray-500 text-xs mt-1">Password must be at least 8 characters long.</p>
              )}
            </div>
            
            {isSignUp && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                      if (validationErrors.confirmPassword) {
                        setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
                      }
                    }}
                    className={`w-full pl-10 pr-10 py-2 border ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                    required
                  />
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
                )}
              </div>
            )}
          </>
        )}

        {isSignUp && currentStep === 2 && (
          <>
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
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
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
                  value={formData.state}
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
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  disabled={!formData.state}
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

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hasBusiness}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasBusiness: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-600">I have a business to list</span>
              </label>
            </div>
          </>
        )}

        {isSignUp && currentStep === 3 && formData.hasBusiness && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="businessName">
                Business Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="businessAddress">
                Business Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="businessAddress"
                  type="text"
                  value={formData.businessAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="businessPhone">
                Business Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="businessPhone"
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessPhone: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="businessHours">
                Business Hours
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="businessHours"
                  type="text"
                  placeholder="e.g. Mon-Fri: 9am-5pm, Sat: 10am-3pm"
                  value={formData.businessHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessHours: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
          </>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00FF4C] hover:bg-green-400 text-black font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition duration-200"
        >
          {loading ? 'Loading...' : isSignUp ? 
            (currentStep < (formData.hasBusiness ? 3 : 2) ? 'Next' : 'Sign Up') 
            : 'Sign In'}
        </button>
      </form>
      
      {!isSignUp && (
        <>
          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition duration-200"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                  fill="#4285F4"
                />
              </svg>
              Google
            </button>
          </div>
        </>
      )}
      
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setCurrentStep(1);
            setError(null);
            setValidationErrors({});
            setFormData({
              email: '',
              password: '',
              confirmPassword: '',
              fullName: '',
              state: '',
              city: '',
              hasBusiness: false,
              businessName: '',
              businessAddress: '',
              businessPhone: '',
              businessHours: ''
            });
          }}
          className="text-blue-600 hover:underline"
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  );
}