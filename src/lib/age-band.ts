import { AgeBand } from '@prisma/client';

// Age band definitions
export const AGE_BANDS = {
  JUNIOR_FOUNDATIONS: {
    id: 'JUNIOR_FOUNDATIONS',
    name: 'Junior Foundations',
    minAge: 10,
    maxAge: 12,
    description: 'Building basic money concepts and habits',
    color: 'green',
    icon: 'Sprout',
    features: ['Simple lessons', 'Fun games', 'Visual learning', 'Basic vocabulary'],
  },
  TEEN_SKILLS: {
    id: 'TEEN_SKILLS',
    name: 'Teen Skills',
    minAge: 13,
    maxAge: 15,
    description: 'Developing practical financial skills',
    color: 'blue',
    icon: 'Rocket',
    features: ['Budgeting basics', 'Saving strategies', 'Goal setting', 'Introduction to investing'],
  },
  LAUNCH: {
    id: 'LAUNCH',
    name: 'Launch',
    minAge: 16,
    maxAge: 22,
    description: 'Preparing for financial independence',
    color: 'indigo',
    icon: 'Target',
    features: ['Investment fundamentals', 'Credit management', 'Tax basics', 'Career planning'],
  },
  STEWARDSHIP_PRACTICUM: {
    id: 'STEWARDSHIP_PRACTICUM',
    name: 'Stewardship Practicum',
    minAge: 23,
    maxAge: 30,
    description: 'Practicing wealth stewardship',
    color: 'purple',
    icon: 'Shield',
    features: ['Portfolio management', 'Estate planning', 'Philanthropy', 'Family governance'],
  },
  LEADERSHIP: {
    id: 'LEADERSHIP',
    name: 'Leadership',
    minAge: 25,
    maxAge: 35,
    description: 'Leading family wealth decisions',
    color: 'gold',
    icon: 'Crown',
    features: ['Advanced investing', 'Family office', 'Governance leadership', 'Mentoring others'],
  },
} as const;

// Get age band from date of birth
export function getAgeBandFromDOB(
  dateOfBirth: Date | null | undefined,
  override?: AgeBand | null
): AgeBand {
  if (override) {
    return override;
  }

  if (!dateOfBirth) {
    return 'LAUNCH'; // Default
  }

  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return getAgeBandFromAge(age);
}

// Get age band from age number
export function getAgeBandFromAge(age: number): AgeBand {
  if (age >= 10 && age <= 12) return 'JUNIOR_FOUNDATIONS';
  if (age >= 13 && age <= 15) return 'TEEN_SKILLS';
  if (age >= 16 && age <= 22) return 'LAUNCH';
  if (age >= 23 && age <= 30) return 'STEWARDSHIP_PRACTICUM';
  if (age >= 25 && age <= 35) return 'LEADERSHIP';

  // Handle edge cases
  if (age < 10) return 'JUNIOR_FOUNDATIONS';
  return 'LEADERSHIP';
}

// Get age band configuration
export function getAgeBandConfig(ageBand: AgeBand) {
  return AGE_BANDS[ageBand] || AGE_BANDS.LAUNCH;
}

// Get age band display name
export function getAgeBandDisplayName(ageBand: AgeBand): string {
  return AGE_BANDS[ageBand]?.name || ageBand.replace(/_/g, ' ');
}

// Get age band color
export function getAgeBandColor(ageBand: AgeBand): string {
  return AGE_BANDS[ageBand]?.color || 'gray';
}

// Check if content is appropriate for age band
export function isContentAppropriate(contentAgeBands: AgeBand[], userAgeBand: AgeBand): boolean {
  return contentAgeBands.includes(userAgeBand);
}

// Get all age bands a user can access (includes lower age bands for older users)
export function getAccessibleAgeBands(userAgeBand: AgeBand): AgeBand[] {
  const ageBandOrder: AgeBand[] = [
    'JUNIOR_FOUNDATIONS',
    'TEEN_SKILLS',
    'LAUNCH',
    'STEWARDSHIP_PRACTICUM',
    'LEADERSHIP',
  ];

  const userIndex = ageBandOrder.indexOf(userAgeBand);
  if (userIndex === -1) return [userAgeBand];

  // User can access their band and all lower bands
  return ageBandOrder.slice(0, userIndex + 1);
}

// Age band UI themes
export const AGE_BAND_THEMES = {
  JUNIOR_FOUNDATIONS: {
    primary: 'green-500',
    secondary: 'green-100',
    accent: 'yellow-400',
    background: 'from-green-50 to-emerald-50',
    text: 'green-700',
  },
  TEEN_SKILLS: {
    primary: 'blue-500',
    secondary: 'blue-100',
    accent: 'cyan-400',
    background: 'from-blue-50 to-cyan-50',
    text: 'blue-700',
  },
  LAUNCH: {
    primary: 'indigo-500',
    secondary: 'indigo-100',
    accent: 'purple-400',
    background: 'from-indigo-50 to-purple-50',
    text: 'indigo-700',
  },
  STEWARDSHIP_PRACTICUM: {
    primary: 'purple-500',
    secondary: 'purple-100',
    accent: 'pink-400',
    background: 'from-purple-50 to-pink-50',
    text: 'purple-700',
  },
  LEADERSHIP: {
    primary: 'yellow-600',
    secondary: 'yellow-100',
    accent: 'orange-400',
    background: 'from-yellow-50 to-orange-50',
    text: 'yellow-800',
  },
};

// Get theme for age band
export function getAgeBandTheme(ageBand: AgeBand) {
  return AGE_BAND_THEMES[ageBand] || AGE_BAND_THEMES.LAUNCH;
}

// Vocabulary complexity levels per age band
export const VOCABULARY_LEVELS = {
  JUNIOR_FOUNDATIONS: 'simple',
  TEEN_SKILLS: 'intermediate',
  LAUNCH: 'standard',
  STEWARDSHIP_PRACTICUM: 'advanced',
  LEADERSHIP: 'expert',
} as const;

// Get vocabulary level for age band
export function getVocabularyLevel(ageBand: AgeBand): string {
  return VOCABULARY_LEVELS[ageBand] || 'standard';
}

// Content complexity adjustments
export const COMPLEXITY_MULTIPLIERS = {
  JUNIOR_FOUNDATIONS: 0.6,
  TEEN_SKILLS: 0.8,
  LAUNCH: 1.0,
  STEWARDSHIP_PRACTICUM: 1.2,
  LEADERSHIP: 1.4,
};

// Get complexity multiplier for XP/scoring adjustments
export function getComplexityMultiplier(ageBand: AgeBand): number {
  return COMPLEXITY_MULTIPLIERS[ageBand] || 1.0;
}

// Age-appropriate greeting
export function getGreeting(ageBand: AgeBand, firstName: string): string {
  switch (ageBand) {
    case 'JUNIOR_FOUNDATIONS':
      return `Hey ${firstName}! Ready to learn something cool? 🌟`;
    case 'TEEN_SKILLS':
      return `What's up, ${firstName}! Let's build those skills! 💪`;
    case 'LAUNCH':
      return `Welcome back, ${firstName}. Ready to level up? 🚀`;
    case 'STEWARDSHIP_PRACTICUM':
      return `Good to see you, ${firstName}. Let's continue your journey.`;
    case 'LEADERSHIP':
      return `Welcome, ${firstName}. Ready to lead today?`;
    default:
      return `Welcome back, ${firstName}!`;
  }
}

// Age-appropriate encouragement messages
export function getEncouragement(ageBand: AgeBand): string {
  const messages = {
    JUNIOR_FOUNDATIONS: [
      "You're doing awesome! 🌈",
      "Keep it up, superstar! ⭐",
      "You're learning so much! 📚",
      "Great job today! 🎉",
    ],
    TEEN_SKILLS: [
      "Nice work! You're crushing it! 💪",
      "Keep that momentum going! 🔥",
      "You're making great progress! 📈",
      "Solid effort! Keep learning! 🎯",
    ],
    LAUNCH: [
      "Excellent progress. Keep building those skills.",
      "You're developing strong financial habits.",
      "Great work on your learning journey.",
      "Stay consistent and the results will follow.",
    ],
    STEWARDSHIP_PRACTICUM: [
      "Your dedication to stewardship is commendable.",
      "Continuing to deepen your expertise.",
      "Building a strong foundation for the future.",
      "Your commitment to learning shows.",
    ],
    LEADERSHIP: [
      "Leading by example through continuous learning.",
      "Your expertise continues to grow.",
      "Setting the standard for others to follow.",
      "A true leader never stops learning.",
    ],
  };

  const ageBandMessages = messages[ageBand] || messages.LAUNCH;
  return ageBandMessages[Math.floor(Math.random() * ageBandMessages.length)];
}
