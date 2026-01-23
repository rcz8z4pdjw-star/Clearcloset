import { Role, AgeBandType, ContentStatus, ContentType, TradeStatus, SessionStatus } from '@prisma/client';

// User types
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  ageBandOverride?: AgeBandType | null;
  roles: Role[];
  householdIds: string[];
  currentAgeBand: AgeBandType;
}

export interface HouseholdMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  roles: Role[];
  ageBand: AgeBandType;
  progress?: MemberProgress;
}

export interface MemberProgress {
  lessonsCompleted: number;
  totalLessons: number;
  quizzesPassed: number;
  totalQuizzes: number;
  badgesEarned: number;
  completedTracks: number;
  recentMilestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  type: 'badge' | 'certificate' | 'module' | 'track';
  achievedAt: Date;
}

// Learning types
export interface TrackOverview {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  imageUrl?: string;
  ageBands: AgeBandType[];
  moduleCount: number;
  lessonCount: number;
  progress?: {
    completedLessons: number;
    totalLessons: number;
    completedModules: number;
    totalModules: number;
  };
}

export interface ModuleOverview {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl?: string;
  trackId: string;
  lessonCount: number;
  quizCount: number;
  isLocked: boolean;
  lockReason?: string;
  progress?: {
    completedLessons: number;
    totalLessons: number;
    quizScore?: number;
  };
}

export interface LessonDetail {
  id: string;
  slug: string;
  title: string;
  description?: string;
  content: string;
  videoUrl?: string;
  duration?: number;
  isCompleted: boolean;
  timeSpent: number;
  nextLesson?: {
    id: string;
    slug: string;
    title: string;
  };
  previousLesson?: {
    id: string;
    slug: string;
    title: string;
  };
}

export interface QuizQuestion {
  id: string;
  text: string;
  choices: {
    id: string;
    text: string;
  }[];
  points: number;
}

export interface QuizResult {
  attemptId: string;
  score: number;
  passed: boolean;
  totalPoints: number;
  earnedPoints: number;
  answers: {
    questionId: string;
    selectedChoiceId: string;
    isCorrect: boolean;
    correctChoiceId?: string;
    explanation?: string;
  }[];
}

// Mentorship types
export interface MentorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
  expertise?: string[];
  assignedMentees: number;
  totalSessions: number;
}

export interface MentorshipSessionDetail {
  id: string;
  mentorId: string;
  menteeId: string;
  mentor: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  mentee: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  status: SessionStatus;
  scheduledAt?: Date;
  duration?: number;
  location?: string;
  calendarLink?: string;
  agenda?: string;
  summary?: string;
}

export interface ActionPlanDetail {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  reminders: {
    id: string;
    remindAt: Date;
    isSent: boolean;
  }[];
}

// Portfolio types
export interface PortfolioSummary {
  id: string;
  name: string;
  type: 'paper' | 'real_capital';
  initialCapital: number;
  currentValue: number;
  totalReturn: number;
  totalReturnPct: number;
  holdingsCount: number;
  pendingTrades: number;
}

export interface HoldingDetail {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPct: number;
  weight: number;
  assetClass?: string;
  sector?: string;
}

export interface TradeRequestDetail {
  id: string;
  action: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  price?: number;
  thesis: string;
  riskAnalysis?: string;
  status: TradeStatus;
  createdAt: Date;
  approvals: {
    id: string;
    approver: {
      id: string;
      firstName: string;
      lastName: string;
    };
    decision: string;
    comments?: string;
    createdAt: Date;
  }[];
}

// Content types
export interface ContentItemSummary {
  id: string;
  slug: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  summary?: string;
  thumbnailUrl?: string;
  duration?: number;
  ageBands: AgeBandType[];
  createdAt: Date;
  publishedAt?: Date;
}

// Community types
export interface CommunityPostDetail {
  id: string;
  title?: string;
  content: string;
  isAnonymous: boolean;
  isPinned: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  cohort: {
    id: string;
    name: string;
  };
  commentsCount: number;
  createdAt: Date;
}

// Dashboard types
export interface DashboardStats {
  learningProgress: {
    completedLessons: number;
    totalLessons: number;
    completedModules: number;
    totalModules: number;
    recentActivity: {
      type: string;
      title: string;
      completedAt: Date;
    }[];
  };
  mentorship: {
    upcomingSessions: number;
    completedSessions: number;
    pendingActionPlans: number;
  };
  portfolio?: {
    totalValue: number;
    dayChange: number;
    dayChangePct: number;
    pendingTrades: number;
  };
  badges: {
    total: number;
    recent: {
      id: string;
      name: string;
      imageUrl?: string;
      awardedAt: Date;
    }[];
  };
}

// Form types
export interface InviteFormData {
  email: string;
  roles: Role[];
  householdId?: string;
}

export interface TradeRequestFormData {
  action: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  price?: number;
  thesis: string;
  riskAnalysis?: string;
}

export interface ContentFormData {
  title: string;
  slug: string;
  type: ContentType;
  summary?: string;
  content: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  attachmentUrl?: string;
  duration?: number;
  ageBands: AgeBandType[];
  trackIds?: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter types
export interface ContentFilters {
  type?: ContentType;
  status?: ContentStatus;
  ageBand?: AgeBandType;
  trackId?: string;
  search?: string;
}

export interface UserFilters {
  role?: Role;
  householdId?: string;
  ageBand?: AgeBandType;
  search?: string;
  isActive?: boolean;
}
