// Application constants

// Age bands
export const AGE_BANDS = {
  JUNIOR_FOUNDATIONS: {
    id: 'JUNIOR_FOUNDATIONS',
    name: 'Junior Foundations',
    ageRange: '10-12',
    minAge: 10,
    maxAge: 12,
    description: 'Building foundational money concepts',
    color: '#F59E0B', // amber
    icon: '🌱',
  },
  TEEN_SKILLS: {
    id: 'TEEN_SKILLS',
    name: 'Teen Skills',
    ageRange: '13-15',
    minAge: 13,
    maxAge: 15,
    description: 'Developing practical financial skills',
    color: '#10B981', // emerald
    icon: '📚',
  },
  LAUNCH: {
    id: 'LAUNCH',
    name: 'Launch',
    ageRange: '16-22',
    minAge: 16,
    maxAge: 22,
    description: 'Preparing for financial independence',
    color: '#6366F1', // indigo
    icon: '🚀',
  },
  STEWARDSHIP_PRACTICUM: {
    id: 'STEWARDSHIP_PRACTICUM',
    name: 'Stewardship Practicum',
    ageRange: '23-30',
    minAge: 23,
    maxAge: 30,
    description: 'Advanced stewardship practices',
    color: '#8B5CF6', // violet
    icon: '🎯',
  },
  LEADERSHIP: {
    id: 'LEADERSHIP',
    name: 'Leadership',
    ageRange: '25-35',
    minAge: 25,
    maxAge: 35,
    description: 'Leadership and mentorship focus',
    color: '#EC4899', // pink
    icon: '👑',
  },
} as const;

export type AgeBandId = keyof typeof AGE_BANDS;

// User roles
export const USER_ROLES = {
  MEMBER: {
    id: 'MEMBER',
    name: 'Member',
    description: 'Standard platform member',
    permissions: ['view_content', 'submit_progress', 'join_groups'],
  },
  PARENT: {
    id: 'PARENT',
    name: 'Parent/Guardian',
    description: 'Parent or guardian of a member',
    permissions: ['view_content', 'view_child_progress', 'send_encouragement'],
  },
  MENTOR: {
    id: 'MENTOR',
    name: 'Mentor',
    description: 'Assigned mentor for members',
    permissions: ['view_content', 'view_mentee_progress', 'schedule_sessions', 'award_badges'],
  },
  CIO: {
    id: 'CIO',
    name: 'Chief Investment Officer',
    description: 'Investment office leadership',
    permissions: ['all_mentor_permissions', 'manage_portfolios', 'view_analytics'],
  },
  PROGRAM_DIRECTOR: {
    id: 'PROGRAM_DIRECTOR',
    name: 'Program Director',
    description: 'Program administration',
    permissions: ['all_cio_permissions', 'manage_curriculum', 'manage_users'],
  },
  ADMIN: {
    id: 'ADMIN',
    name: 'Administrator',
    description: 'Full platform administration',
    permissions: ['all'],
  },
  COMPLIANCE: {
    id: 'COMPLIANCE',
    name: 'Compliance',
    description: 'Compliance and audit access',
    permissions: ['view_all', 'export_data', 'audit_logs'],
  },
} as const;

export type UserRoleId = keyof typeof USER_ROLES;

// XP rewards
export const XP_REWARDS = {
  LESSON_COMPLETE: 50,
  QUIZ_PASS: 100,
  QUIZ_PERFECT: 150,
  WORKSHOP_ATTEND: 100,
  JOURNAL_ENTRY: 10,
  DAILY_CHALLENGE: 25,
  STREAK_BONUS_7: 50,
  STREAK_BONUS_14: 100,
  STREAK_BONUS_30: 250,
  STREAK_BONUS_100: 1000,
  GOAL_COMPLETE: 100,
  BADGE_EARN: 50,
  FIRST_LOGIN_DAY: 5,
  CONNECTION_MADE: 10,
  MENTOR_SESSION: 75,
} as const;

// Level thresholds
export const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  450,   // Level 4
  700,   // Level 5
  1000,  // Level 6
  1400,  // Level 7
  1900,  // Level 8
  2500,  // Level 9
  3200,  // Level 10
  4000,  // Level 11
  5000,  // Level 12
  6200,  // Level 13
  7600,  // Level 14
  9200,  // Level 15
  11000, // Level 16
  13000, // Level 17
  15500, // Level 18
  18500, // Level 19
  22000, // Level 20
  26000, // Level 21
  31000, // Level 22
  37000, // Level 23
  44000, // Level 24
  52000, // Level 25
] as const;

// Badge rarities
export const BADGE_RARITIES = {
  COMMON: { id: 'common', name: 'Common', color: '#6B7280', multiplier: 1 },
  UNCOMMON: { id: 'uncommon', name: 'Uncommon', color: '#22C55E', multiplier: 1.5 },
  RARE: { id: 'rare', name: 'Rare', color: '#3B82F6', multiplier: 2 },
  EPIC: { id: 'epic', name: 'Epic', color: '#8B5CF6', multiplier: 3 },
  LEGENDARY: { id: 'legendary', name: 'Legendary', color: '#F59E0B', multiplier: 5 },
} as const;

// Content categories
export const CONTENT_CATEGORIES = [
  'Budgeting',
  'Saving',
  'Investing',
  'Taxes',
  'Career',
  'Entrepreneurship',
  'Real Estate',
  'Insurance',
  'Estate Planning',
  'Philanthropy',
] as const;

// Notification types
export const NOTIFICATION_TYPES = {
  ACHIEVEMENT_EARNED: 'achievement_earned',
  LEVEL_UP: 'level_up',
  STREAK_MILESTONE: 'streak_milestone',
  NEW_CONTENT: 'new_content',
  WORKSHOP_REMINDER: 'workshop_reminder',
  MENTOR_MESSAGE: 'mentor_message',
  GOAL_PROGRESS: 'goal_progress',
  FAMILY_MESSAGE: 'family_message',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
} as const;

// API rate limits
export const RATE_LIMITS = {
  DEFAULT: { requests: 100, window: 60 * 1000 }, // 100 req/min
  STRICT: { requests: 10, window: 60 * 1000 }, // 10 req/min
  AUTH: { requests: 5, window: 60 * 1000 }, // 5 req/min for auth endpoints
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  AVATAR: { maxSize: 5 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] },
  DOCUMENT: { maxSize: 10 * 1024 * 1024, types: ['application/pdf', 'application/msword'] },
  VIDEO: { maxSize: 500 * 1024 * 1024, types: ['video/mp4', 'video/webm'] },
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Session settings
export const SESSION = {
  MAX_AGE: 7 * 24 * 60 * 60, // 7 days
  REFRESH_THRESHOLD: 24 * 60 * 60, // Refresh if less than 24 hours remaining
} as const;

// Feature flags
export const FEATURES = {
  SIMULATIONS: true,
  PORTFOLIO_TRACKING: true,
  LIVE_WORKSHOPS: true,
  FAMILY_DASHBOARD: true,
  MENTORSHIP: true,
  CERTIFICATES: true,
  SOCIAL_FEATURES: true,
} as const;

// Default UI settings
export const DEFAULT_SETTINGS = {
  theme: 'system' as const,
  emailNotifications: true,
  pushNotifications: true,
  showLeaderboard: true,
  showStreak: true,
  compactMode: false,
} as const;
