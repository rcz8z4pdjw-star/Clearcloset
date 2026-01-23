// Age-based content filtering for the Ascent platform

export type AgeBand =
  | 'JUNIOR_FOUNDATIONS'  // Ages 10-12
  | 'TEEN_SKILLS'         // Ages 13-15
  | 'LAUNCH'              // Ages 16-22
  | 'STEWARDSHIP_PRACTICUM' // Ages 23-30
  | 'LEADERSHIP';         // Ages 25-35

export interface ContentItem {
  id: string;
  type: 'lesson' | 'quiz' | 'resource' | 'track';
  title: string;
  minAgeBand: AgeBand;
  maxAgeBand?: AgeBand;
  topics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

// Age band hierarchy for comparison
const ageBandOrder: Record<AgeBand, number> = {
  JUNIOR_FOUNDATIONS: 1,
  TEEN_SKILLS: 2,
  LAUNCH: 3,
  STEWARDSHIP_PRACTICUM: 4,
  LEADERSHIP: 5,
};

// Topics appropriate for each age band
const ageBandTopics: Record<AgeBand, string[]> = {
  JUNIOR_FOUNDATIONS: [
    'money-basics',
    'saving',
    'allowance',
    'needs-vs-wants',
    'simple-budgeting',
    'earning-money',
    'spending-wisely',
    'giving',
    'banking-basics',
  ],
  TEEN_SKILLS: [
    'money-basics',
    'saving',
    'budgeting',
    'earning-money',
    'spending-wisely',
    'giving',
    'banking',
    'first-job',
    'compound-interest',
    'intro-investing',
    'credit-basics',
    'financial-goals',
  ],
  LAUNCH: [
    'budgeting',
    'investing',
    'credit-management',
    'student-loans',
    'taxes-basics',
    'career-planning',
    'insurance',
    'renting-vs-buying',
    'retirement-accounts',
    'stock-market',
    'emergency-fund',
    'debt-management',
    'income-growth',
  ],
  STEWARDSHIP_PRACTICUM: [
    'investing',
    'taxes',
    'real-estate',
    'retirement-planning',
    'portfolio-management',
    'estate-planning',
    'business-ownership',
    'wealth-building',
    'charitable-giving',
    'family-finance',
    'risk-management',
    'alternative-investments',
  ],
  LEADERSHIP: [
    'advanced-investing',
    'family-office',
    'estate-planning',
    'philanthropy',
    'legacy-planning',
    'business-succession',
    'trust-management',
    'multi-generational-wealth',
    'impact-investing',
    'governance',
    'family-values',
    'mentorship',
  ],
};

// Difficulty appropriate for each age band
const ageBandDifficulty: Record<AgeBand, ('beginner' | 'intermediate' | 'advanced' | 'expert')[]> = {
  JUNIOR_FOUNDATIONS: ['beginner'],
  TEEN_SKILLS: ['beginner', 'intermediate'],
  LAUNCH: ['beginner', 'intermediate', 'advanced'],
  STEWARDSHIP_PRACTICUM: ['intermediate', 'advanced', 'expert'],
  LEADERSHIP: ['advanced', 'expert'],
};

/**
 * Check if a user's age band allows access to content
 */
export function canAccessContent(
  userAgeBand: AgeBand,
  contentMinAgeBand: AgeBand,
  contentMaxAgeBand?: AgeBand
): boolean {
  const userOrder = ageBandOrder[userAgeBand];
  const minOrder = ageBandOrder[contentMinAgeBand];
  const maxOrder = contentMaxAgeBand ? ageBandOrder[contentMaxAgeBand] : 5;

  return userOrder >= minOrder && userOrder <= maxOrder;
}

/**
 * Filter content items based on user's age band
 */
export function filterContentByAgeBand<T extends ContentItem>(
  content: T[],
  userAgeBand: AgeBand
): T[] {
  return content.filter(item =>
    canAccessContent(userAgeBand, item.minAgeBand, item.maxAgeBand)
  );
}

/**
 * Get appropriate topics for a user's age band
 */
export function getTopicsForAgeBand(ageBand: AgeBand): string[] {
  return ageBandTopics[ageBand] || [];
}

/**
 * Get appropriate difficulty levels for a user's age band
 */
export function getDifficultyLevelsForAgeBand(
  ageBand: AgeBand
): ('beginner' | 'intermediate' | 'advanced' | 'expert')[] {
  return ageBandDifficulty[ageBand] || ['beginner'];
}

/**
 * Check if a topic is appropriate for a user's age band
 */
export function isTopicAppropriate(topic: string, ageBand: AgeBand): boolean {
  const appropriateTopics = ageBandTopics[ageBand];
  return appropriateTopics.includes(topic);
}

/**
 * Calculate age band from birthdate
 */
export function calculateAgeBand(birthDate: Date): AgeBand {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age >= 10 && age <= 12) return 'JUNIOR_FOUNDATIONS';
  if (age >= 13 && age <= 15) return 'TEEN_SKILLS';
  if (age >= 16 && age <= 22) return 'LAUNCH';
  if (age >= 23 && age <= 30) return 'STEWARDSHIP_PRACTICUM';
  if (age >= 25 && age <= 35) return 'LEADERSHIP';

  // Default fallback
  if (age < 10) return 'JUNIOR_FOUNDATIONS';
  return 'LEADERSHIP';
}

/**
 * Get display name for age band
 */
export function getAgeBandDisplayName(ageBand: AgeBand): string {
  const displayNames: Record<AgeBand, string> = {
    JUNIOR_FOUNDATIONS: 'Junior Foundations (Ages 10-12)',
    TEEN_SKILLS: 'Teen Skills (Ages 13-15)',
    LAUNCH: 'Launch (Ages 16-22)',
    STEWARDSHIP_PRACTICUM: 'Stewardship Practicum (Ages 23-30)',
    LEADERSHIP: 'Leadership (Ages 25-35)',
  };
  return displayNames[ageBand];
}

/**
 * Get short display name for age band
 */
export function getAgeBandShortName(ageBand: AgeBand): string {
  const shortNames: Record<AgeBand, string> = {
    JUNIOR_FOUNDATIONS: 'Junior',
    TEEN_SKILLS: 'Teen',
    LAUNCH: 'Launch',
    STEWARDSHIP_PRACTICUM: 'Practicum',
    LEADERSHIP: 'Leadership',
  };
  return shortNames[ageBand];
}

/**
 * Content recommendations based on age band
 */
export function getRecommendedTracks(ageBand: AgeBand): string[] {
  const recommendations: Record<AgeBand, string[]> = {
    JUNIOR_FOUNDATIONS: [
      'money-basics',
      'saving-for-goals',
      'earning-your-first-dollar',
      'smart-spending',
    ],
    TEEN_SKILLS: [
      'budgeting-101',
      'intro-to-investing',
      'your-first-bank-account',
      'earning-and-saving',
    ],
    LAUNCH: [
      'financial-foundations',
      'investing-fundamentals',
      'credit-and-debt',
      'career-and-income',
    ],
    STEWARDSHIP_PRACTICUM: [
      'advanced-investing',
      'tax-strategies',
      'real-estate-investing',
      'retirement-planning',
    ],
    LEADERSHIP: [
      'family-governance',
      'wealth-transfer',
      'philanthropic-giving',
      'legacy-planning',
    ],
  };
  return recommendations[ageBand] || [];
}
