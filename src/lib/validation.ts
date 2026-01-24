// Validation utility functions

import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name must be at most 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const dateOfBirthSchema = z
  .string()
  .or(z.date())
  .refine((val) => {
    const date = new Date(val);
    const now = new Date();
    const minAge = 10;
    const maxAge = 100;
    const age = (now.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= minAge && age <= maxAge;
  }, 'Age must be between 10 and 100 years');

// User registration schema
export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: dateOfBirthSchema,
  agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  avatarUrl: z.string().url('Invalid URL').optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

// Goal creation schema
export const goalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  type: z.enum(['SAVINGS', 'LEARNING', 'INVESTING', 'CAREER', 'CUSTOM']),
  targetAmount: z.number().positive('Target amount must be positive').optional(),
  targetDate: z.string().or(z.date()).optional(),
  category: z.string().optional(),
});

// Journal entry schema
export const journalEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be at most 10000 characters'),
  mood: z.enum(['excited', 'motivated', 'thoughtful', 'confused', 'proud']).optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  isPrivate: z.boolean().optional(),
  linkedLessonId: z.string().optional(),
});

// Quiz answer schema
export const quizAnswerSchema = z.object({
  questionId: z.string(),
  selectedOptionId: z.string(),
});

export const quizSubmissionSchema = z.object({
  quizId: z.string(),
  answers: z.array(quizAnswerSchema).min(1, 'At least one answer is required'),
});

// Workshop registration schema
export const workshopRegistrationSchema = z.object({
  workshopId: z.string(),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
});

// Message schema
export const messageSchema = z.object({
  recipientId: z.string(),
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message must be at most 5000 characters'),
  parentMessageId: z.string().optional(),
});

// Feedback schema
export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'content']),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be at most 2000 characters'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  attachments: z.array(z.string().url()).max(5, 'Maximum 5 attachments allowed').optional(),
});

// Search query schema
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Search query must be at most 200 characters'),
  type: z.enum(['all', 'lessons', 'quizzes', 'users', 'workshops']).optional(),
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().max(100).optional(),
});

// Helper function to validate and parse data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map(issue => issue.message);
  return { success: false, errors };
}

// Validation helper for API routes
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map(issue => issue.message).join(', ');
    throw new Error(`Validation failed: ${errors}`);
  }

  return result.data;
}

// Sanitization functions
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 200);
}

// Check if string is safe (no script injection)
export function isSafeString(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /data:/i,
    /vbscript:/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
}

// Validate URL is from allowed domains
export function isAllowedUrl(url: string, allowedDomains: string[]): boolean {
  try {
    const parsed = new URL(url);
    return allowedDomains.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}
