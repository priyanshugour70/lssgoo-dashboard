import { z } from 'zod';

// User Schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  isActive: z.boolean().default(true),
  roles: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  isActive: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Response Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  isActive: boolean;
  isBlocked: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
  roles?: Array<{
    id: string;
    role: {
      id: string;
      name: string;
      slug: string;
    };
    isActive: boolean;
    expiresAt: string | null;
  }>;
}

export interface Profile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  bio: string | null;
  phone: string | null;
  phoneVerified: boolean;
  alternateEmail: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  postalCode: string | null;
  avatar: string | null;
  coverImage: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  timezone: string;
  locale: string;
  dateFormat: string;
  timeFormat: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

