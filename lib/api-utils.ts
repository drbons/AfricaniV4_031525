import { NextResponse } from 'next/server';

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Creates a successful API response
 * @param data - The data to include in the response
 * @returns NextResponse with standardized success format
 */
export function successResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data
  });
}

/**
 * Creates an error API response
 * @param message - Error message
 * @param code - Error code
 * @param status - HTTP status code
 * @param details - Additional error details
 * @returns NextResponse with standardized error format
 */
export function errorResponse(
  message: string,
  code = 'INTERNAL_SERVER_ERROR',
  status = 500,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details })
      }
    },
    { status }
  );
}

/**
 * Wraps an API handler with error handling
 * @param handler - The API handler function
 * @returns A wrapped handler function with error handling
 */
export function withErrorHandling(
  handler: (req: Request, params?: any) => Promise<NextResponse>
) {
  return async (req: Request, params?: any): Promise<NextResponse> => {
    try {
      return await handler(req, params);
    } catch (error: any) {
      console.error('API Error:', error);
      
      // Handle Firebase errors
      if (error.code && error.code.startsWith('auth/')) {
        return errorResponse(
          error.message || 'Authentication error',
          error.code,
          401
        );
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        return errorResponse(
          error.message || 'Validation error',
          'VALIDATION_ERROR',
          400,
          error.details
        );
      }
      
      // Handle other errors
      return errorResponse(
        error.message || 'An unexpected error occurred',
        'INTERNAL_SERVER_ERROR',
        500
      );
    }
  };
} 