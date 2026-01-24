import { prisma } from './db';

// XP rewards for different actions
export const XP_REWARDS = {
  COMPLETE_LESSON: 50,
  PASS_QUIZ: 100,
  PERFECT_QUIZ: 150,
  EARN_BADGE: 200,
  COMPLETE_MODULE: 300,
  COMPLETE_TRACK: 500,
  DAILY_LOGIN: 10,
  STREAK_BONUS_7: 100,
  STREAK_BONUS_30: 500,
  FIRST_LESSON: 100,
  FIRST_QUIZ: 100,
  HELP_PEER: 25,
  SUBMIT_EXERCISE: 75,
  ATTEND_SESSION: 50,
  COMPLETE_CHALLENGE: 150,
};

// Level thresholds
export const LEVELS = [
  { level: 1, title: 'Newcomer', minXP: 0, color: 'gray' },
  { level: 2, title: 'Explorer', minXP: 100, color: 'green' },
  { level: 3, title: 'Learner', minXP: 300, color: 'blue' },
  { level: 4, title: 'Scholar', minXP: 600, color: 'purple' },
  { level: 5, title: 'Achiever', minXP: 1000, color: 'indigo' },
  { level: 6, title: 'Expert', minXP: 1500, color: 'orange' },
  { level: 7, title: 'Master', minXP: 2500, color: 'red' },
  { level: 8, title: 'Champion', minXP: 4000, color: 'pink' },
  { level: 9, title: 'Legend', minXP: 6000, color: 'yellow' },
  { level: 10, title: 'Visionary', minXP: 10000, color: 'gold' },
];

// Age band specific titles
export const AGE_BAND_TITLES: Record<string, typeof LEVELS> = {
  JUNIOR_FOUNDATIONS: [
    { level: 1, title: 'Apprentice', minXP: 0, color: 'gray' },
    { level: 2, title: 'Adventurer', minXP: 100, color: 'green' },
    { level: 3, title: 'Explorer', minXP: 300, color: 'blue' },
    { level: 4, title: 'Discoverer', minXP: 600, color: 'purple' },
    { level: 5, title: 'Trailblazer', minXP: 1000, color: 'indigo' },
    { level: 6, title: 'Pioneer', minXP: 1500, color: 'orange' },
    { level: 7, title: 'Hero', minXP: 2500, color: 'red' },
    { level: 8, title: 'Champion', minXP: 4000, color: 'pink' },
    { level: 9, title: 'Legend', minXP: 6000, color: 'yellow' },
    { level: 10, title: 'Superstar', minXP: 10000, color: 'gold' },
  ],
  TEEN_SKILLS: [
    { level: 1, title: 'Starter', minXP: 0, color: 'gray' },
    { level: 2, title: 'Rising Star', minXP: 100, color: 'green' },
    { level: 3, title: 'Go-Getter', minXP: 300, color: 'blue' },
    { level: 4, title: 'Achiever', minXP: 600, color: 'purple' },
    { level: 5, title: 'Leader', minXP: 1000, color: 'indigo' },
    { level: 6, title: 'Influencer', minXP: 1500, color: 'orange' },
    { level: 7, title: 'Maverick', minXP: 2500, color: 'red' },
    { level: 8, title: 'Trailblazer', minXP: 4000, color: 'pink' },
    { level: 9, title: 'Innovator', minXP: 6000, color: 'yellow' },
    { level: 10, title: 'Visionary', minXP: 10000, color: 'gold' },
  ],
};

export function getLevelFromXP(xp: number, ageBand?: string): typeof LEVELS[0] {
  const levels = ageBand && AGE_BAND_TITLES[ageBand] ? AGE_BAND_TITLES[ageBand] : LEVELS;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXP) {
      return levels[i];
    }
  }
  return levels[0];
}

export function getXPToNextLevel(xp: number, ageBand?: string): { current: number; required: number; progress: number } {
  const levels = ageBand && AGE_BAND_TITLES[ageBand] ? AGE_BAND_TITLES[ageBand] : LEVELS;
  const currentLevel = getLevelFromXP(xp, ageBand);
  const currentLevelIndex = levels.findIndex((l) => l.level === currentLevel.level);

  if (currentLevelIndex === levels.length - 1) {
    return { current: xp, required: xp, progress: 100 };
  }

  const nextLevel = levels[currentLevelIndex + 1];
  const xpInCurrentLevel = xp - currentLevel.minXP;
  const xpRequiredForNextLevel = nextLevel.minXP - currentLevel.minXP;
  const progress = Math.round((xpInCurrentLevel / xpRequiredForNextLevel) * 100);

  return {
    current: xpInCurrentLevel,
    required: xpRequiredForNextLevel,
    progress,
  };
}

export async function awardXP(
  userId: string,
  amount: number,
  reason: string,
  entityType?: string,
  entityId?: string
) {
  // Get current user XP
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXP: true, currentLevel: true },
  });

  if (!user) return null;

  const newTotalXP = (user.totalXP || 0) + amount;
  const oldLevel = getLevelFromXP(user.totalXP || 0);
  const newLevel = getLevelFromXP(newTotalXP);

  // Update user XP
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalXP: newTotalXP,
      currentLevel: newLevel.level,
    },
  });

  // Log XP gain
  await prisma.xPLog.create({
    data: {
      userId,
      amount,
      reason,
      entityType,
      entityId,
      balanceAfter: newTotalXP,
    },
  });

  // Check for level up
  const leveledUp = newLevel.level > oldLevel.level;

  if (leveledUp) {
    // Create level up notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'LEVEL_UP',
        title: `Level Up! You're now ${newLevel.title}`,
        message: `Congratulations! You've reached Level ${newLevel.level}. Keep up the amazing work!`,
        link: '/dashboard/profile',
      },
    });
  }

  return {
    newTotalXP,
    xpGained: amount,
    leveledUp,
    newLevel: newLevel.level,
    newTitle: newLevel.title,
  };
}

export async function calculateStreak(userId: string): Promise<number> {
  const activities = await prisma.lessonProgress.findMany({
    where: {
      usedId: userId,
      completedAt: { not: null },
    },
    select: { completedAt: true },
    orderBy: { completedAt: 'desc' },
  });

  if (activities.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group activities by day
  const activityDays = new Set<string>();
  activities.forEach((a) => {
    if (a.completedAt) {
      const date = new Date(a.completedAt);
      date.setHours(0, 0, 0, 0);
      activityDays.add(date.toISOString());
    }
  });

  // Count consecutive days
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    checkDate.setHours(0, 0, 0, 0);

    if (activityDays.has(checkDate.toISOString())) {
      streak++;
    } else if (i > 0) {
      // Allow for today not having activity yet
      break;
    }
  }

  return streak;
}

export async function checkStreakBonus(userId: string, streak: number) {
  if (streak === 7) {
    await awardXP(userId, XP_REWARDS.STREAK_BONUS_7, '7-day learning streak!');
  } else if (streak === 30) {
    await awardXP(userId, XP_REWARDS.STREAK_BONUS_30, '30-day learning streak!');
  }
}

// Daily challenges based on age band
export const DAILY_CHALLENGES = {
  JUNIOR_FOUNDATIONS: [
    { id: 'watch_video', title: 'Watch a Video Lesson', description: 'Complete any video lesson', xp: 30, icon: 'video' },
    { id: 'take_quiz', title: 'Quiz Champion', description: 'Pass a quiz with 70%+', xp: 50, icon: 'quiz' },
    { id: 'read_glossary', title: 'Word Explorer', description: 'Learn 3 new glossary terms', xp: 20, icon: 'book' },
    { id: 'complete_lesson', title: 'Lesson Master', description: 'Complete any lesson', xp: 40, icon: 'check' },
  ],
  TEEN_SKILLS: [
    { id: 'complete_2_lessons', title: 'Double Down', description: 'Complete 2 lessons', xp: 60, icon: 'layers' },
    { id: 'perfect_quiz', title: 'Perfect Score', description: 'Get 100% on any quiz', xp: 80, icon: 'star' },
    { id: 'help_peer', title: 'Team Player', description: 'Help a peer in discussions', xp: 30, icon: 'users' },
    { id: 'explore_resource', title: 'Resource Hunter', description: 'Explore 3 resources', xp: 25, icon: 'folder' },
  ],
  LAUNCH: [
    { id: 'portfolio_check', title: 'Portfolio Review', description: 'Review your portfolio performance', xp: 40, icon: 'trending' },
    { id: 'submit_trade', title: 'Market Mover', description: 'Submit a trade request', xp: 70, icon: 'chart' },
    { id: 'mentor_session', title: 'Mentorship Moment', description: 'Request or attend a mentor session', xp: 60, icon: 'calendar' },
    { id: 'complete_module', title: 'Module Master', description: 'Complete a full module', xp: 100, icon: 'award' },
  ],
  STEWARDSHIP_PRACTICUM: [
    { id: 'analyze_trade', title: 'Deep Analysis', description: 'Analyze a potential investment', xp: 80, icon: 'search' },
    { id: 'mentor_meeting', title: 'Mentor Connect', description: 'Complete a mentor session', xp: 70, icon: 'users' },
    { id: 'philanthropy_plan', title: 'Give Back', description: 'Work on philanthropy planning', xp: 60, icon: 'heart' },
    { id: 'governance_study', title: 'Governance Guru', description: 'Study family governance', xp: 50, icon: 'shield' },
  ],
  LEADERSHIP: [
    { id: 'mentor_others', title: 'Pay It Forward', description: 'Mentor a younger member', xp: 100, icon: 'users' },
    { id: 'lead_discussion', title: 'Thought Leader', description: 'Lead a community discussion', xp: 80, icon: 'message' },
    { id: 'strategy_review', title: 'Strategic Mind', description: 'Review investment strategy', xp: 90, icon: 'target' },
    { id: 'family_council', title: 'Council Ready', description: 'Participate in governance activity', xp: 75, icon: 'crown' },
  ],
};

export function getDailyChallenges(ageBand: string) {
  return DAILY_CHALLENGES[ageBand as keyof typeof DAILY_CHALLENGES] || DAILY_CHALLENGES.TEEN_SKILLS;
}

// Achievement definitions
export const ACHIEVEMENTS = {
  LEARNING: [
    { id: 'first_lesson', name: 'First Steps', description: 'Complete your first lesson', icon: 'BookOpen', xp: 25, threshold: 1 },
    { id: 'ten_lessons', name: 'Knowledge Seeker', description: 'Complete 10 lessons', icon: 'BookOpen', xp: 100, threshold: 10 },
    { id: 'fifty_lessons', name: 'Scholar', description: 'Complete 50 lessons', icon: 'GraduationCap', xp: 250, threshold: 50 },
    { id: 'hundred_lessons', name: 'Academic', description: 'Complete 100 lessons', icon: 'Award', xp: 500, threshold: 100 },
  ],
  QUIZ: [
    { id: 'first_quiz', name: 'Quiz Taker', description: 'Pass your first quiz', icon: 'CheckCircle', xp: 25, threshold: 1 },
    { id: 'perfect_quiz', name: 'Perfectionist', description: 'Get 100% on a quiz', icon: 'Star', xp: 50, threshold: 1 },
    { id: 'ten_quizzes', name: 'Quiz Master', description: 'Pass 10 quizzes', icon: 'CheckCircle', xp: 100, threshold: 10 },
    { id: 'quiz_streak', name: 'On Fire', description: 'Pass 5 quizzes in a row', icon: 'Flame', xp: 150, threshold: 5 },
  ],
  STREAK: [
    { id: 'week_streak', name: 'Consistent', description: 'Maintain a 7-day streak', icon: 'Flame', xp: 50, threshold: 7 },
    { id: 'month_streak', name: 'Dedicated', description: 'Maintain a 30-day streak', icon: 'Flame', xp: 150, threshold: 30 },
    { id: 'quarter_streak', name: 'Committed', description: 'Maintain a 90-day streak', icon: 'Trophy', xp: 400, threshold: 90 },
    { id: 'year_streak', name: 'Legendary', description: 'Maintain a 365-day streak', icon: 'Crown', xp: 1000, threshold: 365 },
  ],
  SOCIAL: [
    { id: 'first_connection', name: 'Networker', description: 'Make your first connection', icon: 'Users', xp: 15, threshold: 1 },
    { id: 'ten_connections', name: 'Social Butterfly', description: 'Connect with 10 people', icon: 'Users', xp: 75, threshold: 10 },
    { id: 'group_founder', name: 'Community Builder', description: 'Create a study group', icon: 'Users', xp: 50, threshold: 1 },
    { id: 'first_referral', name: 'Ambassador', description: 'Successfully refer someone', icon: 'Share2', xp: 100, threshold: 1 },
  ],
  TRACK: [
    { id: 'first_track', name: 'Track Champion', description: 'Complete your first track', icon: 'Flag', xp: 200, threshold: 1 },
    { id: 'three_tracks', name: 'Multi-Tracker', description: 'Complete 3 tracks', icon: 'Flag', xp: 500, threshold: 3 },
    { id: 'all_tracks', name: 'Completionist', description: 'Complete all tracks', icon: 'Trophy', xp: 1000, threshold: -1 },
  ],
  PORTFOLIO: [
    { id: 'first_portfolio', name: 'Investor', description: 'Create your first portfolio', icon: 'Briefcase', xp: 50, threshold: 1 },
    { id: 'first_profit', name: 'Money Maker', description: 'Make your first profit', icon: 'TrendingUp', xp: 75, threshold: 1 },
    { id: 'ten_trades', name: 'Active Trader', description: 'Execute 10 trades', icon: 'BarChart2', xp: 100, threshold: 10 },
  ],
};

// Badge rarity system
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const BADGE_RARITY_CONFIG: Record<BadgeRarity, { color: string; bgColor: string; borderColor: string; label: string }> = {
  common: { color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-300', label: 'Common' },
  uncommon: { color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-300', label: 'Uncommon' },
  rare: { color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-300', label: 'Rare' },
  epic: { color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-300', label: 'Epic' },
  legendary: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-400', label: 'Legendary' },
};

// Leaderboard types
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';
export type LeaderboardType = 'xp' | 'streak' | 'lessons' | 'quizzes';

// Format XP with abbreviation
export function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}

// Calculate learning time in minutes
export function calculateLearningTime(lessonCount: number, quizCount: number, flashcardSessions: number = 0): number {
  // Estimates: lessons ~10 min, quizzes ~5 min, flashcards ~8 min
  return lessonCount * 10 + quizCount * 5 + flashcardSessions * 8;
}

// Format learning time
export function formatLearningTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

// Referral tier system
export const REFERRAL_TIERS = [
  { name: 'Bronze', minReferrals: 0, maxReferrals: 2, bonusXP: 50, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { name: 'Silver', minReferrals: 3, maxReferrals: 5, bonusXP: 75, color: 'text-gray-500', bgColor: 'bg-gray-100' },
  { name: 'Gold', minReferrals: 6, maxReferrals: 10, bonusXP: 100, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { name: 'Platinum', minReferrals: 11, maxReferrals: Infinity, bonusXP: 150, color: 'text-purple-600', bgColor: 'bg-purple-100' },
];

export function getReferralTier(referralCount: number) {
  return REFERRAL_TIERS.find(tier => referralCount >= tier.minReferrals && referralCount <= tier.maxReferrals) || REFERRAL_TIERS[0];
}

// Check if user qualifies for achievement
export async function checkAchievement(
  userId: string,
  achievementId: string,
  currentValue: number
) {
  const allAchievements = [
    ...ACHIEVEMENTS.LEARNING,
    ...ACHIEVEMENTS.QUIZ,
    ...ACHIEVEMENTS.STREAK,
    ...ACHIEVEMENTS.SOCIAL,
    ...ACHIEVEMENTS.TRACK,
    ...ACHIEVEMENTS.PORTFOLIO,
  ];

  const achievement = allAchievements.find(a => a.id === achievementId);
  if (!achievement) return null;

  // Check if user already has this badge
  const existingBadge = await prisma.userBadge.findFirst({
    where: {
      userId,
      badge: { name: achievement.name },
    },
  });

  if (existingBadge) return null;

  // Check if threshold met
  if (currentValue >= achievement.threshold) {
    // Find or create the badge
    let badge = await prisma.badge.findFirst({
      where: { name: achievement.name },
    });

    if (!badge) {
      badge = await prisma.badge.create({
        data: {
          name: achievement.name,
          description: achievement.description,
          imageUrl: `/badges/${achievement.id}.png`,
          category: 'achievement',
        },
      });
    }

    // Award badge to user
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
      },
    });

    // Award XP for earning badge
    await awardXP(userId, achievement.xp, `Earned badge: ${achievement.name}`, 'badge', badge.id);

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'BADGE_EARNED',
        title: `New Badge: ${achievement.name}!`,
        message: achievement.description,
        link: '/dashboard/badges',
      },
    });

    return { badge, achievement };
  }

  return null;
}

// Calculate user rank position
export async function getUserRank(userId: string, type: LeaderboardType = 'xp'): Promise<number> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      totalXP: true,
      currentStreak: true,
      _count: {
        select: {
          lessonProgress: { where: { completedAt: { not: null } } },
          quizAttempts: { where: { passed: true } },
        },
      },
    },
    orderBy: type === 'xp' ? { totalXP: 'desc' } : type === 'streak' ? { currentStreak: 'desc' } : undefined,
  });

  if (type === 'lessons') {
    users.sort((a, b) => b._count.lessonProgress - a._count.lessonProgress);
  } else if (type === 'quizzes') {
    users.sort((a, b) => b._count.quizAttempts - a._count.quizAttempts);
  }

  const rank = users.findIndex(u => u.id === userId) + 1;
  return rank || users.length + 1;
}

// Progress milestones for visual indicators
export const PROGRESS_MILESTONES = [
  { percent: 25, label: 'Getting Started', color: 'bg-blue-500' },
  { percent: 50, label: 'Halfway There', color: 'bg-yellow-500' },
  { percent: 75, label: 'Almost Done', color: 'bg-orange-500' },
  { percent: 100, label: 'Complete!', color: 'bg-green-500' },
];

export function getMilestone(percent: number) {
  for (let i = PROGRESS_MILESTONES.length - 1; i >= 0; i--) {
    if (percent >= PROGRESS_MILESTONES[i].percent) {
      return PROGRESS_MILESTONES[i];
    }
  }
  return { percent: 0, label: 'Just Started', color: 'bg-gray-400' };
}
