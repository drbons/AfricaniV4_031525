"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Event } from '@/types/firebase';
import { useToast } from '@/components/ui/use-toast';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface EventFormProps {
  userId: string;
  userName: string;
  userPhoto: string | null;
  event?: Event;
  isEditing?: boolean;
}

// Define form schema with Zod
const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }).max(100, {
    message: "Title cannot exceed 100 characters."
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters."
  }).max(5000, {
    message: "Description cannot exceed 5000 characters."
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  endDate: z.date().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isFree: z.boolean().default(true),
  price: z.string().optional(),
  location: z.object({
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    coordinates: z.object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }).optional(),
    virtualMeetingUrl: z.string().url().optional().or(z.literal('')),
  }),
  isVirtual: z.boolean().default(false),
  organizer: z.string().default(''),
  organizerEmail: z.string().email().optional().or(z.literal('')),
  organizerPhone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
});

// Event categories
const EVENT_CATEGORIES = [
  'Business & Professional',
  'Community & Culture',
  'Education',
  'Entertainment',
  'Food & Drink',
  'Health & Wellness',
  'Hobbies & Interest',
  'Music',
  'Sports & Fitness',
  'Technology',
  'Travel & Outdoor',
  'Other'
];

export default function EventForm({ userId, userName, userPhoto, event, isEditing = false }: EventFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVirtual, setIsVirtual] = useState(false);

  // Initialize form with default values or existing event data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      category: event?.category || '',
      startDate: event?.startDate ? new Date(event.startDate) : new Date(),
      endDate: event?.endDate ? new Date(event.endDate) : undefined,
      startTime: event?.startTime || '',
      endTime: event?.endTime || '',
      isFree: event?.isFree !== undefined ? event.isFree : true,
      price: event?.price ? String(event.price) : '',
      location: {
        address: event?.location?.address || '',
        city: event?.location?.city || '',
        country: event?.location?.country || '',
        coordinates: event?.location?.coordinates || undefined,
        virtualMeetingUrl: event?.location?.virtualMeetingUrl || '',
      },
      isVirtual: event?.location?.virtualMeetingUrl ? true : false,
      organizer: event?.organizer || userName,
      organizerEmail: event?.organizerEmail || '',
      organizerPhone: event?.organizerPhone || '',
      website: event?.website || '',
      contactEmail: event?.contactEmail || '',
      contactPhone: event?.contactPhone || '',
    },
  });

  // Load cover image preview if editing
  useEffect(() => {
    if (event?.coverImage) {
      setImagePreview(event.coverImage);
    }
    
    // Update isVirtual based on form values
    setIsVirtual(form.getValues('isVirtual'));
  }, [event, form]);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should not exceed 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      let coverImageUrl = event?.coverImage || null;
      
      // Upload image if selected
      if (imageFile) {
        const storageRef = ref(storage, `events/${userId}/${Date.now()}-${imageFile.name}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        coverImageUrl = await getDownloadURL(uploadResult.ref);
      }

      // Prepare event data
      const eventData = {
        title: values.title,
        description: values.description,
        category: values.category,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : values.startDate.toISOString(),
        startTime: values.startTime || null,
        endTime: values.endTime || null,
        isFree: values.isFree,
        price: values.isFree ? null : values.price,
        location: {
          address: values.location.address,
          city: values.location.city,
          country: values.location.country,
          coordinates: values.location.coordinates || null,
          virtualMeetingUrl: values.isVirtual ? values.location.virtualMeetingUrl : null,
        },
        organizer: values.organizer || userName,
        organizerEmail: values.organizerEmail || null,
        organizerPhone: values.organizerPhone || null,
        website: values.website || null,
        contactEmail: values.contactEmail || null,
        contactPhone: values.contactPhone || null,
        coverImage: coverImageUrl,
        createdBy: userId,
        organizer: values.organizer || userName,
        organizerPhotoURL: userPhoto,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        attendees: event?.attendees || [],
        interested: event?.interested || [],
        likes: event?.likes || [],
      };

      if (isEditing && event) {
        // Update existing event
        const eventRef = doc(db, 'events', event.id);
        await updateDoc(eventRef, {
          ...eventData,
          updatedAt: new Date().toISOString(),
        });

        toast({
          title: "Success!",
          description: "Event updated successfully",
        });
      } else {
        // Create new event
        const docRef = await addDoc(collection(db, 'events'), eventData);

        toast({
          title: "Success!",
          description: "Event created successfully",
        });
      }

      // Navigate back to events page
      router.push('/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: "Failed to save the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Event Details</h2>
            
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Event Title*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Description*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your event" 
                      className="min-h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Category*</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Cover Image */}
            <div className="mb-6">
              <Label htmlFor="coverImage">Cover Image</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-md overflow-hidden mb-2">
                    <Image 
                      src={imagePreview} 
                      alt="Cover Preview" 
                      fill
                      className="object-cover"
                    />
                    <Button 
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 rounded-full w-8 h-8"
                      type="button"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <Label 
                        htmlFor="coverImage" 
                        className="cursor-pointer text-blue-600 hover:text-blue-800"
                      >
                        Upload a cover image
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                )}
                <Input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Date & Time</h2>
            
            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Start Date*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* End Date */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>End Date (optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Time slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Time */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-500" />
                      <FormControl>
                        <Input 
                          type="time" 
                          placeholder="Start time" 
                          {...field} 
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* End Time */}
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-500" />
                      <FormControl>
                        <Input 
                          type="time" 
                          placeholder="End time" 
                          {...field} 
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            
            {/* Virtual Event */}
            <FormField
              control={form.control}
              name="isVirtual"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mb-4">
                  <div className="space-y-0.5">
                    <FormLabel>Virtual Event</FormLabel>
                    <div className="text-sm text-gray-500">
                      This event will take place online
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setIsVirtual(checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Location Address */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="location.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Virtual Meeting URL */}
              {isVirtual && (
                <FormField
                  control={form.control}
                  name="location.virtualMeetingUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting URL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url" 
                          placeholder="https://zoom.us/j/example" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Price</h2>
            
            {/* Free or Paid */}
            <FormField
              control={form.control}
              name="isFree"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mb-4">
                  <div className="space-y-0.5">
                    <FormLabel>Free Event</FormLabel>
                    <div className="text-sm text-gray-500">
                      This event is free to attend
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Price Input */}
            {!form.getValues('isFree') && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price*</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="29.99" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Organizer & Contact Information</h2>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="organizer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organizer Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter organizer name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="organizerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizer Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Enter organizer email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="organizerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizer Phone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter organizer phone" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Website</FormLabel>
                    <FormControl>
                      <Input 
                        type="url"
                        placeholder="https://example.com/event" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Enter contact email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter contact phone" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/events')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 