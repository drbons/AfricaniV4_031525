"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SeedMarketplace() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSeed = async () => {
    if (loading) return;
    
    setLoading(true);
    setSuccess(false);
    setError(null);
    
    try {
      const response = await fetch('/api/seed-marketplace');
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        toast({
          title: 'Success!',
          description: `Added ${data.listings.length} sample listings to the marketplace.`,
          variant: 'success'
        });
      } else {
        throw new Error(data.message || 'Failed to seed marketplace');
      }
    } catch (err) {
      console.error('Error seeding marketplace:', err);
      setError(err.message || 'An error occurred');
      toast({
        title: 'Error',
        description: err.message || 'Failed to seed marketplace',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="font-bold text-lg mb-2">Marketplace Demo</h2>
      <p className="text-gray-600 text-sm mb-4">
        Add sample listings from different users to populate the marketplace.
      </p>
      
      <Button
        onClick={handleSeed}
        disabled={loading || success}
        className={`w-full ${success ? 'bg-green-500 hover:bg-green-600' : 'bg-[#00FF4C] hover:bg-green-400'} text-black font-medium`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding Sample Listings...
          </>
        ) : success ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Sample Listings Added
          </>
        ) : (
          'Add Sample Listings'
        )}
      </Button>
      
      {error && (
        <div className="mt-2 text-red-500 text-sm flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
} 