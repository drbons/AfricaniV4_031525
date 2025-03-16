"use client";

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, X, Plus, ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Books',
  'Vehicles',
  'Home Goods',
  'Sports & Outdoors',
  'Toys & Games',
  'Musical Instruments',
  'Office Supplies',
  'Art & Crafts',
  'Other'
];

export default function ListingForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [useProfileContact, setUseProfileContact] = useState(true);
  
  // Form state - submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  
  // Form validation
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    category?: string;
    price?: string;
    condition?: string;
    location?: string;
    images?: string;
    contact?: string;
  }>({});
  
  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    
    // Clear previous errors
    setErrors(prev => ({...prev, images: undefined}));
    
    // Check if adding more files would exceed the limit
    if (images.length + selectedFiles.length > MAX_IMAGES) {
      setErrors(prev => ({
        ...prev, 
        images: `You can only upload up to ${MAX_IMAGES} images.`
      }));
      return;
    }
    
    // Process each selected file
    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];
    const newErrors: string[] = [];
    
    Array.from(selectedFiles).forEach(file => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        newErrors.push(`${file.name} exceeds the 5MB size limit.`);
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        newErrors.push(`${file.name} is not an image file.`);
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      newFiles.push(file);
      newPreviewUrls.push(previewUrl);
    });
    
    // Update state with new files and preview URLs
    if (newFiles.length > 0) {
      setImages(prev => [...prev, ...newFiles]);
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
    
    // Set errors if any
    if (newErrors.length > 0) {
      setErrors(prev => ({
        ...prev, 
        images: newErrors.join(' ')
      }));
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove an image
  const removeImage = (index: number) => {
    const newImages = [...images];
    const newPreviewUrls = [...imagePreviewUrls];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviewUrls[index]);
    
    newImages.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    
    setImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
    
    // Reset progress if any
    const newProgress = [...uploadProgress];
    newProgress.splice(index, 1);
    setUploadProgress(newProgress);
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    setSubmitError(null);
    
    // Validate form
    const newErrors: any = {};
    
    if (!title.trim()) newErrors.title = "Title is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!category) newErrors.category = "Category is required";
    if (!isFree && (!price || parseFloat(price) <= 0)) {
      newErrors.price = "Please enter a valid price";
    }
    if (!condition) newErrors.condition = "Condition is required";
    if (!location.trim()) newErrors.location = "Location is required";
    
    // Contact validation
    if (!useProfileContact && !contactEmail && !contactPhone) {
      newErrors.contact = "Please provide at least one contact method";
    }
    
    // Set validation errors if any
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First, upload images if any
      const imageUrls: string[] = [];
      if (images.length > 0) {
        // Initialize progress array
        setUploadProgress(new Array(images.length).fill(0));
        
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileName = `listings/${user?.uid}/${Date.now()}-${file.name}`;
          const storage = getStorage();
          const storageRef = ref(storage, fileName);
          
          // Upload file with progress tracking
          const uploadTask = uploadBytesResumable(storageRef, file);
          
          // Wait for upload to complete
          await new Promise<void>((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                // Track upload progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                const newProgress = [...uploadProgress];
                newProgress[i] = progress;
                setUploadProgress(newProgress);
              },
              (error) => {
                console.error('Upload error:', error);
                reject(error);
              },
              async () => {
                // Upload complete, get download URL
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                imageUrls.push(downloadURL);
                resolve();
              }
            );
          });
        }
      }
      
      // Get user data for contact information
      const contactInfo = useProfileContact
        ? {
            email: user?.email || "",
            phone: user?.phoneNumber || ""
          }
        : {
            email: contactEmail,
            phone: contactPhone
          };
          
      // Create the listing document
      const listingData = {
        title,
        description,
        category: category.toLowerCase(),
        price: isFree ? 0 : parseFloat(price),
        isFree,
        condition: condition.toLowerCase(),
        images: imageUrls,
        status: 'active',
        location: {
          name: location,
          coords: null // Would be populated with geocoding in a full implementation
        },
        contact: contactInfo,
        sellerId: user?.uid,
        sellerName: user?.displayName || "Anonymous",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'listings'), listingData);
      
      toast({
        title: "Listing created successfully!",
        variant: "success"
      });
      
      // Redirect to the listing page
      router.push(`/marketplace/listing/${docRef.id}`);
      
    } catch (error) {
      console.error('Error submitting listing:', error);
      setSubmitError("Failed to create listing. Please try again.");
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-6">
      {/* Submit error message */}
      {submitError && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{submitError}</p>
        </div>
      )}
      
      {/* Basic Info Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Item Details</h2>
        
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title*</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you selling?"
            maxLength={100}
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title}</p>
          )}
        </div>
        
        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description*</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your item (condition, features, etc.)"
            className={`min-h-[120px] ${errors.description ? "border-red-500" : ""}`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description}</p>
          )}
        </div>
        
        {/* Category and Condition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category*</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-red-500 text-sm">{errors.category}</p>
            )}
          </div>
          
          {/* Condition */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condition*</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className={errors.condition ? "border-red-500" : ""}>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="like-new">Like New</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
            {errors.condition && (
              <p className="text-red-500 text-sm">{errors.condition}</p>
            )}
          </div>
        </div>
        
        {/* Price */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFree"
              checked={isFree}
              onCheckedChange={(checked) => setIsFree(checked === true)}
            />
            <Label htmlFor="isFree">This item is free</Label>
          </div>
          
          {!isFree && (
            <div className="space-y-2">
              <Label htmlFor="price">Price* ($)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                min="0"
                step="0.01"
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && (
                <p className="text-red-500 text-sm">{errors.price}</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Separator />
      
      {/* Images Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Images</h2>
        <p className="text-sm text-gray-500">
          Upload up to {MAX_IMAGES} images (5MB max per image)
        </p>
        
        {/* Image uploader */}
        <div className="space-y-4">
          {/* Image preview grid */}
          {imagePreviewUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 rounded-md overflow-hidden">
                  <Image
                    src={url}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Upload progress indicator */}
                  {isSubmitting && uploadProgress[index] < 100 && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                      <Loader2 className="h-6 w-6 animate-spin mb-1" />
                      <span className="text-sm">{Math.round(uploadProgress[index])}%</span>
                    </div>
                  )}
                  
                  {/* Remove button */}
                  {!isSubmitting && (
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 rounded-full bg-black/70 p-1 hover:bg-black/90"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  )}
                </div>
              ))}
              
              {/* Add more button - only show if under limit */}
              {imagePreviewUrls.length < MAX_IMAGES && !isSubmitting && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center gap-1 hover:border-gray-400 transition-colors"
                >
                  <Plus className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-500">Add</span>
                </button>
              )}
            </div>
          )}
          
          {/* Initial upload button - only show if no images yet */}
          {imagePreviewUrls.length === 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center hover:border-gray-400 transition-colors"
              disabled={isSubmitting}
            >
              <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Click to upload images</span>
            </button>
          )}
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={isSubmitting}
          />
          
          {/* Image upload error message */}
          {errors.images && (
            <p className="text-red-500 text-sm">{errors.images}</p>
          )}
        </div>
      </div>
      
      <Separator />
      
      {/* Location Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Location</h2>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location*</Label>
          <div className="relative">
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State or Neighborhood"
              className={`pl-9 ${errors.location ? "border-red-500" : ""}`}
            />
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          </div>
          {errors.location && (
            <p className="text-red-500 text-sm">{errors.location}</p>
          )}
        </div>
      </div>
      
      <Separator />
      
      {/* Contact Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Contact Information</h2>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="useProfileContact">Use my account contact info</Label>
            <Switch
              id="useProfileContact"
              checked={useProfileContact}
              onCheckedChange={setUseProfileContact}
            />
          </div>
          
          {!useProfileContact && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email (at least one contact required)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Your email address"
                  className={errors.contact ? "border-red-500" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone number (at least one contact required)</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Your phone number"
                  className={errors.contact ? "border-red-500" : ""}
                />
              </div>
              
              {errors.contact && (
                <p className="text-red-500 text-sm">{errors.contact}</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-[#00FF4C] hover:bg-green-400 text-black font-medium"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Creating Listing...
          </>
        ) : (
          'Post Listing'
        )}
      </Button>
    </form>
  );
} 