import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isValid, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date input into a human-readable string
 * @param dateInput - The date to format (can be Date, string, number, or Firestore Timestamp)
 * @param formatString - Optional format string (defaults to 'MMM d, yyyy h:mm a')
 * @returns Formatted date string
 */
export function formatDate(dateInput: any, formatString = 'MMM d, yyyy h:mm a'): string {
  try {
    if (!dateInput) {
      return 'Invalid date';
    }
    
    let date: Date;
    
    // Handle Firestore Timestamp objects
    if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
      date = dateInput.toDate();
    } 
    // Handle Firestore timestamp objects that might be serialized
    else if (dateInput && typeof dateInput === 'object' && 'seconds' in dateInput) {
      date = new Date(dateInput.seconds * 1000);
    }
    // Handle ISO string dates
    else if (typeof dateInput === 'string') {
      try {
        date = parseISO(dateInput);
      } catch {
        date = new Date(dateInput);
      }
    }
    // Handle numbers (unix timestamps)
    else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    }
    else {
      date = new Date(dateInput);
    }
    
    // Check if date is valid
    if (!isValid(date)) {
      return 'Invalid date';
    }
    
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Truncates text to a specified length and adds ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Gets initials from a name (e.g., "John Doe" -> "JD")
 * @param name - The name to get initials from
 * @returns Uppercase initials
 */
export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}