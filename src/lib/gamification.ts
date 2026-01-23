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
