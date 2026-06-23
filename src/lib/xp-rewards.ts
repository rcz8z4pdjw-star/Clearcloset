/**
 * XP Rewards Configuration
 * Defines all XP rewards for various actions in the platform
 */

export const XP_REWARDS = {
  // Learning activities
  LESSON_COMPLETE: 50,
  LESSON_COMPLETE_FIRST_TIME: 75,
  QUIZ_COMPLETE: 25,
  QUIZ_PERFECT_SCORE: 100,
  QUIZ_PASS: 50,
  TRACK_COMPLETE: 500,
  MODULE_COMPLETE: 150,
  FLASHCARD_DECK_COMPLETE: 30,

  // Engagement
  DAILY_LOGIN: 10,
  STREAK_BONUS_BASE: 5, // multiplied by streak day
  STREAK_MILESTONE_7: 50,
  STREAK_MILESTONE_14: 100,
  STREAK_MILESTONE_30: 250,
  STREAK_MILESTONE_60: 500,
  STREAK_MILESTONE_100: 1000,
  STREAK_MILESTONE_365: 5000,

  // Challenges
  DAILY_CHALLENGE_COMPLETE: 25,
  WEEKLY_CHALLENGE_COMPLETE: 100,
  MONTHLY_CHALLENGE_COMPLETE: 500,

  // Social
  CONNECTION_MADE: 15,
  DISCUSSION_POST: 10,
  DISCUSSION_REPLY: 5,
  HELPFUL_REPLY_UPVOTE: 3,
  REFERRAL_SIGNUP: 200,
  REFERRAL_ACTIVE: 100,

  // Goals
  GOAL_CREATED: 25,
  GOAL_PROGRESS_LOGGED: 10,
  GOAL_MILESTONE_REACHED: 50,
  GOAL_COMPLETED: 200,

  // Workshops
  WORKSHOP_REGISTERED: 10,
  WORKSHOP_ATTENDED: 100,
  WORKSHOP_COMPLETED: 150,

  // Simulations
  SIMULATION_STARTED: 10,
  SIMULATION_COMPLETED: 75,
  SIMULATION_HIGH_SCORE: 150,

  // Journal
  JOURNAL_ENTRY_CREATED: 15,
  JOURNAL_STREAK_WEEKLY: 50,

  // Mentorship
  MENTORING_SESSION_COMPLETED: 100,
  MENTOR_FEEDBACK_GIVEN: 25,
  MENTEE_MILESTONE: 50,

  // Achievements
  FIRST_LESSON: 50,
  FIRST_QUIZ: 50,
  FIRST_CONNECTION: 25,
  PROFILE_COMPLETED: 100,
} as const;

/**
 * Level thresholds
 * XP required to reach each level
 */
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1900,   // Level 7
  2650,   // Level 8
  3550,   // Level 9
  4600,   // Level 10
  5800,   // Level 11
  7200,   // Level 12
  8800,   // Level 13
  10600,  // Level 14
  12600,  // Level 15
  14850,  // Level 16
  17350,  // Level 17
  20100,  // Level 18
  23100,  // Level 19
  26400,  // Level 20
  30000,  // Level 21
  34000,  // Level 22
  38500,  // Level 23
  43500,  // Level 24
  49000,  // Level 25
  55000,  // Level 26
  62000,  // Level 27
  70000,  // Level 28
  79000,  // Level 29
  89000,  // Level 30
  100000, // Level 31+
];

/**
 * Get level from total XP
 */
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    // After max defined level, each level requires 15000 more XP
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (currentLevel - LEVEL_THRESHOLDS.length + 1) * 15000;
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

/**
 * Get progress to next level as percentage
 */
export function getLevelProgress(totalXP: number): { level: number; progress: number; xpInLevel: number; xpForNextLevel: number } {
  const level = getLevelFromXP(totalXP);
  const currentLevelXP = level > 1 ? LEVEL_THRESHOLDS[level - 1] : 0;
  const nextLevelXP = getXPForNextLevel(level);
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progress = Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100);

  return {
    level,
    progress,
    xpInLevel,
    xpForNextLevel: xpNeeded,
  };
}

/**
 * Level titles based on level number
 */
export const LEVEL_TITLES: Record<number, string> = {
  1: 'Beginner',
  2: 'Novice',
  3: 'Apprentice',
  4: 'Student',
  5: 'Learner',
  6: 'Practitioner',
  7: 'Adept',
  8: 'Scholar',
  9: 'Expert',
  10: 'Master',
  15: 'Grandmaster',
  20: 'Sage',
  25: 'Luminary',
  30: 'Legend',
};

/**
 * Get title for a level
 */
export function getLevelTitle(level: number): string {
  // Find the highest title that applies
  const applicableLevels = Object.keys(LEVEL_TITLES)
    .map(Number)
    .filter(l => l <= level)
    .sort((a, b) => b - a);

  return LEVEL_TITLES[applicableLevels[0]] || 'Beginner';
}

/**
 * Calculate streak bonus
 */
export function calculateStreakBonus(streakDays: number): number {
  let bonus = streakDays * XP_REWARDS.STREAK_BONUS_BASE;

  // Add milestone bonuses
  if (streakDays >= 365) bonus += XP_REWARDS.STREAK_MILESTONE_365;
  else if (streakDays >= 100) bonus += XP_REWARDS.STREAK_MILESTONE_100;
  else if (streakDays >= 60) bonus += XP_REWARDS.STREAK_MILESTONE_60;
  else if (streakDays >= 30) bonus += XP_REWARDS.STREAK_MILESTONE_30;
  else if (streakDays >= 14) bonus += XP_REWARDS.STREAK_MILESTONE_14;
  else if (streakDays >= 7) bonus += XP_REWARDS.STREAK_MILESTONE_7;

  return bonus;
}

/**
 * Age band XP multipliers
 * Younger users get slightly higher XP to encourage engagement
 */
export const AGE_BAND_MULTIPLIERS: Record<string, number> = {
  JUNIOR_FOUNDATIONS: 1.25,
  TEEN_SKILLS: 1.15,
  LAUNCH: 1.0,
  STEWARDSHIP_PRACTICUM: 1.0,
  LEADERSHIP: 1.0,
};

/**
 * Apply age band multiplier to XP reward
 */
export function applyAgeBandMultiplier(baseXP: number, ageBand: string): number {
  const multiplier = AGE_BAND_MULTIPLIERS[ageBand] || 1.0;
  return Math.round(baseXP * multiplier);
}

/**
 * Get all XP sources for display
 */
export function getXPSourceInfo(source: string): { label: string; icon: string; color: string } {
  const sourceInfo: Record<string, { label: string; icon: string; color: string }> = {
    lesson_complete: { label: 'Lesson Completed', icon: 'book', color: 'text-blue-600' },
    quiz_complete: { label: 'Quiz Completed', icon: 'check', color: 'text-green-600' },
    streak_bonus: { label: 'Streak Bonus', icon: 'flame', color: 'text-orange-600' },
    daily_challenge: { label: 'Daily Challenge', icon: 'target', color: 'text-purple-600' },
    goal_progress: { label: 'Goal Progress', icon: 'trending', color: 'text-emerald-600' },
    achievement: { label: 'Achievement', icon: 'trophy', color: 'text-yellow-600' },
    workshop: { label: 'Workshop', icon: 'calendar', color: 'text-cyan-600' },
    social: { label: 'Social Activity', icon: 'users', color: 'text-pink-600' },
    referral: { label: 'Referral', icon: 'gift', color: 'text-indigo-600' },
  };

  return sourceInfo[source] || { label: 'Activity', icon: 'zap', color: 'text-gray-600' };
}
