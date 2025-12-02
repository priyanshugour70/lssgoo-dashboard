import { z } from 'zod';

// Base API Response Types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError | string;
  message?: string;
  timestamp?: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response Helpers
export function successResponse<T>(
  data: T,
  message?: string
): APIResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): APIResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  };
}

// Error Codes
export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Helper function to extract error message
export function getErrorMessage(error?: APIError | string): string {
  if (!error) return 'An error occurred';
  if (typeof error === 'string') return error;
  return error.message || 'An error occurred';
}

// Filter and Pagination Types
export interface FilterParams {
  search?: string;
  category?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}
