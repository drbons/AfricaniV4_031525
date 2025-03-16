"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Check, MapPin, Search, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

// Event categories
const EVENT_CATEGORIES = [
  'All Categories',
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

interface FilterState {
  category: string | null;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  isFree: boolean | null;
  distance: number | null;
  sortBy: 'newest' | 'popular' | 'upcoming';
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: Partial<FilterState>) => void;
}

export default function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined
  );
  const [location, setLocation] = useState(filters.location || '');

  // Update date range and call parent onChange
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // If no start date is selected yet, or if selected date is before current start date
    if (!filters.startDate || date < filters.startDate) {
      onChange({ startDate: date, endDate: dateRangeEnd || null });
    } 
    // If date is after start date, set as end date
    else if (filters.startDate && date > filters.startDate) {
      setDateRangeEnd(date);
      onChange({ endDate: date });
    } 
    // If same date selected, set both start and end
    else {
      setDateRangeEnd(date);
      onChange({ startDate: date, endDate: date });
    }
  };

  // Clear all date filters
  const clearDateFilter = () => {
    setDateRangeEnd(undefined);
    onChange({ startDate: null, endDate: null });
  };

  // Handle location search
  const handleLocationSearch = () => {
    onChange({ location });
  };

  // Reset all filters
  const resetAllFilters = () => {
    setLocation('');
    setDateRangeEnd(undefined);
    onChange({
      category: null,
      startDate: null,
      endDate: null,
      location: null,
      isFree: null,
      distance: null,
      sortBy: 'upcoming',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Filters</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetAllFilters} 
              className="h-8 text-sm text-gray-500 hover:text-gray-900"
            >
              Reset All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Category Filter */}
          <div>
            <Label htmlFor="category" className="text-sm font-medium">Category</Label>
            <Select
              value={filters.category || 'All Categories'}
              onValueChange={(value) => onChange({ 
                category: value === 'All Categories' ? null : value 
              })}
            >
              <SelectTrigger id="category" className="mt-1.5">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div>
            <div className="flex justify-between mb-1.5">
              <Label className="text-sm font-medium">Date</Label>
              {(filters.startDate || filters.endDate) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearDateFilter} 
                  className="h-6 p-0 text-xs text-gray-500 hover:text-gray-900"
                >
                  Clear
                </Button>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? (
                    filters.endDate && filters.endDate.getTime() !== filters.startDate.getTime() ? (
                      <>
                        {format(filters.startDate, "MMM d, yyyy")} - {format(filters.endDate, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(filters.startDate, "MMMM d, yyyy")
                    )
                  ) : (
                    <span>Pick a date or range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate || undefined}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Location Filter */}
          <div>
            <Label htmlFor="location" className="text-sm font-medium">Location</Label>
            <div className="flex mt-1.5">
              <div className="relative flex-grow">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  placeholder="City or area"
                  className="pl-9"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                />
              </div>
              <Button 
                variant="outline" 
                className="ml-2" 
                onClick={handleLocationSearch}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Distance Filter */}
          <div>
            <div className="flex justify-between mb-1.5">
              <Label className="text-sm font-medium">Distance</Label>
              <span className="text-xs text-gray-500">
                {filters.distance || 50} km
              </span>
            </div>
            <Slider
              defaultValue={[filters.distance || 50]}
              max={200}
              step={10}
              onValueChange={(value) => onChange({ distance: value[0] })}
              className="my-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 km</span>
              <span>200 km</span>
            </div>
          </div>

          <Separator />

          {/* Price Filter */}
          <div className="flex items-center justify-between">
            <Label htmlFor="free-only" className="text-sm font-medium">Free Events Only</Label>
            <Switch
              id="free-only"
              checked={filters.isFree || false}
              onCheckedChange={(checked) => onChange({ isFree: checked })}
            />
          </div>

          {/* Sort Options */}
          <div>
            <Label className="text-sm font-medium">Sort By</Label>
            <RadioGroup 
              value={filters.sortBy}
              onValueChange={(value: 'newest' | 'popular' | 'upcoming') => onChange({ sortBy: value })}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upcoming" id="upcoming" />
                <Label htmlFor="upcoming" className="text-sm font-normal cursor-pointer">Upcoming</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="newest" id="newest" />
                <Label htmlFor="newest" className="text-sm font-normal cursor-pointer">Newest</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="popular" id="popular" />
                <Label htmlFor="popular" className="text-sm font-normal cursor-pointer">Popular</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 