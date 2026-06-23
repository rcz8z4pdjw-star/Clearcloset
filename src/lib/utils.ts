import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInYears, format, formatDistanceToNow } from 'date-fns';
import { AgeBandType } from '@prisma/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(dateOfBirth: Date): number {
  return differenceInYears(new Date(), dateOfBirth);
}

export function getAgeBand(dateOfBirth: Date, override?: AgeBandType | null): AgeBandType {
  if (override) return override;

  const age = calculateAge(dateOfBirth);

  if (age >= 10 && age <= 12) return 'JUNIOR_FOUNDATIONS';
  if (age >= 13 && age <= 15) return 'TEEN_SKILLS';
  if (age >= 16 && age <= 22) return 'LAUNCH';
  if (age >= 23 && age <= 30) return 'STEWARDSHIP_PRACTICUM';
  if (age >= 25 && age <= 35) return 'LEADERSHIP';

  // Default fallbacks for edge cases
  if (age < 10) return 'JUNIOR_FOUNDATIONS';
  return 'LEADERSHIP';
}

export function getAgeBandLabel(ageBand: AgeBandType): string {
  const labels: Record<AgeBandType, string> = {
    JUNIOR_FOUNDATIONS: 'Junior Foundations (10-12)',
    TEEN_SKILLS: 'Teen Skills (13-15)',
    LAUNCH: 'Launch (16-22)',
    STEWARDSHIP_PRACTICUM: 'Stewardship Practicum (23-30)',
    LEADERSHIP: 'Leadership (25-35)',
  };
  return labels[ageBand];
}

export function getAgeBandShortLabel(ageBand: AgeBandType): string {
  const labels: Record<AgeBandType, string> = {
    JUNIOR_FOUNDATIONS: 'Junior Foundations',
    TEEN_SKILLS: 'Teen Skills',
    LAUNCH: 'Launch',
    STEWARDSHIP_PRACTICUM: 'Stewardship Practicum',
    LEADERSHIP: 'Leadership',
  };
  return labels[ageBand];
}

export function getAgeBandAgeRange(ageBand: AgeBandType): { min: number; max: number } {
  const ranges: Record<AgeBandType, { min: number; max: number }> = {
    JUNIOR_FOUNDATIONS: { min: 10, max: 12 },
    TEEN_SKILLS: { min: 13, max: 15 },
    LAUNCH: { min: 16, max: 22 },
    STEWARDSHIP_PRACTICUM: { min: 23, max: 30 },
    LEADERSHIP: { min: 25, max: 35 },
  };
  return ranges[ageBand];
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getAgeBandType(ageBand: AgeBandType): AgeBandType {
  return ageBand;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}
