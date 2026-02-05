// =====================================================
// VEDIC NUMEROLOGY ENGINE (COMPREHENSIVE)
// Includes: Mulank, Bhagyank, Naamank, Lo Shu Grid
// Founded by Jyotish Acharya Rakesh Sharma
// =====================================================

import { calculateLoShuGrid, LOSHU_PLANETS } from './loshu-numerology-engine';

// ==================== VEDIC NUMBER ASSOCIATIONS ====================

export interface VedicNumber {
  number: number;
  planet: string;
  deity: string;
  element: string;
  color: string;
  gemstone: string;
  mantra: string;
  day: string;
  positive: string[];
  negative: string[];
  careers: string[];
  lucky: {
    numbers: number[];
    colors: string[];
    days: string[];
  };
  unlucky: {
    numbers: number[];
    colors: string[];
  };
}

export const VEDIC_NUMBERS: Record<number, VedicNumber> = {
  1: {
    number: 1,
    planet: 'Sun (Surya)',
    deity: 'Lord Surya',
    element: 'Fire',
    color: 'Red, Orange, Golden',
    gemstone: 'Ruby',
    mantra: 'Om Suryaya Namaha',
    day: 'Sunday',
    positive: ['Leadership', 'Authority', 'Creativity', 'Independence', 'Ambition'],
    negative: ['Ego', 'Dominating', 'Arrogance', 'Loneliness'],
    careers: ['CEO', 'Manager', 'Politician', 'Entrepreneur', 'Director'],
    lucky: {
      numbers: [1, 2, 3, 9],
      colors: ['Golden', 'Orange', 'Red'],
      days: ['Sunday', 'Monday'],
    },
    unlucky: {
      numbers: [8, 4],
      colors: ['Black', 'Grey'],
    },
  },
  2: {
    number: 2,
    planet: 'Moon (Chandra)',
    deity: 'Goddess Parvati',
    element: 'Water',
    color: 'White, Cream, Light Blue',
    gemstone: 'Pearl',
    mantra: 'Om Chandraya Namaha',
    day: 'Monday',
    positive: ['Intuitive', 'Caring', 'Diplomatic', 'Cooperative', 'Artistic'],
    negative: ['Moody', 'Oversensitive', 'Indecisive', 'Dependent'],
    careers: ['Artist', 'Counselor', 'Nurse', 'Chef', 'Hospitality'],
    lucky: {
      numbers: [1, 2, 7],
      colors: ['White', 'Cream', 'Light Green'],
      days: ['Monday', 'Friday'],
    },
    unlucky: {
      numbers: [4, 8],
      colors: ['Dark colors', 'Black'],
    },
  },
  3: {
    number: 3,
    planet: 'Jupiter (Guru)',
    deity: 'Lord Brihaspati',
    element: 'Ether',
    color: 'Yellow, Golden',
    gemstone: 'Yellow Sapphire',
    mantra: 'Om Gurave Namaha',
    day: 'Thursday',
    positive: ['Wise', 'Optimistic', 'Generous', 'Spiritual', 'Lucky'],
    negative: ['Over-confident', 'Extravagant', 'Lazy', 'Scattered'],
    careers: ['Teacher', 'Lawyer', 'Judge', 'Philosopher', 'Priest'],
    lucky: {
      numbers: [3, 6, 9],
      colors: ['Yellow', 'Orange', 'Rose'],
      days: ['Thursday', 'Friday'],
    },
    unlucky: {
      numbers: [5],
      colors: ['Green'],
    },
  },
  4: {
    number: 4,
    planet: 'Rahu',
    deity: 'Goddess Durga',
    element: 'Air',
    color: 'Grey, Blue, Black',
    gemstone: 'Hessonite (Gomed)',
    mantra: 'Om Rahave Namaha',
    day: 'Saturday',
    positive: ['Practical', 'Hardworking', 'Stable', 'Organized', 'Detail-oriented'],
    negative: ['Stubborn', 'Rigid', 'Rebellious', 'Suspicious'],
    careers: ['Engineer', 'Accountant', 'Builder', 'Scientist', 'Researcher'],
    lucky: {
      numbers: [1, 4, 6],
      colors: ['Blue', 'Grey'],
      days: ['Saturday', 'Sunday'],
    },
    unlucky: {
      numbers: [2, 8, 9],
      colors: ['Red', 'Black'],
    },
  },
  5: {
    number: 5,
    planet: 'Mercury (Budh)',
    deity: 'Lord Vishnu',
    element: 'Earth',
    color: 'Green',
    gemstone: 'Emerald',
    mantra: 'Om Budhaya Namaha',
    day: 'Wednesday',
    positive: ['Intelligent', 'Communicative', 'Adaptable', 'Quick learner', 'Versatile'],
    negative: ['Restless', 'Nervous', 'Scattered', 'Inconsistent'],
    careers: ['Writer', 'Speaker', 'Trader', 'Salesperson', 'Media'],
    lucky: {
      numbers: [5, 6, 1],
      colors: ['Green', 'White'],
      days: ['Wednesday', 'Friday'],
    },
    unlucky: {
      numbers: [3, 4],
      colors: ['Red'],
    },
  },
  6: {
    number: 6,
    planet: 'Venus (Shukra)',
    deity: 'Goddess Lakshmi',
    element: 'Water',
    color: 'White, Pink, Light Blue',
    gemstone: 'Diamond / White Sapphire',
    mantra: 'Om Shukraya Namaha',
    day: 'Friday',
    positive: ['Loving', 'Artistic', 'Harmonious', 'Charming', 'Luxurious'],
    negative: ['Materialistic', 'Lazy', 'Self-indulgent', 'Jealous'],
    careers: ['Artist', 'Designer', 'Actor', 'Musician', 'Hotelier'],
    lucky: {
      numbers: [6, 4, 5],
      colors: ['Pink', 'White', 'Light Blue'],
      days: ['Friday', 'Wednesday'],
    },
    unlucky: {
      numbers: [1, 9],
      colors: ['Red', 'Black'],
    },
  },
  7: {
    number: 7,
    planet: 'Ketu',
    deity: 'Lord Ganesha',
    element: 'Fire',
    color: 'Purple, Violet',
    gemstone: "Cat's Eye",
    mantra: 'Om Ketave Namaha',
    day: 'Tuesday',
    positive: ['Spiritual', 'Analytical', 'Philosophical', 'Intuitive', 'Researcher'],
    negative: ['Isolated', 'Secretive', 'Pessimistic', 'Aloof'],
    careers: ['Researcher', 'Scientist', 'Astrologer', 'Healer', 'Monk'],
    lucky: {
      numbers: [7, 2, 1],
      colors: ['Purple', 'Violet', 'Light Green'],
      days: ['Monday', 'Tuesday'],
    },
    unlucky: {
      numbers: [8, 9],
      colors: ['Black', 'Red'],
    },
  },
  8: {
    number: 8,
    planet: 'Saturn (Shani)',
    deity: 'Lord Shani',
    element: 'Air',
    color: 'Blue, Black',
    gemstone: 'Blue Sapphire',
    mantra: 'Om Shanaye Namaha',
    day: 'Saturday',
    positive: ['Disciplined', 'Patient', 'Organized', 'Responsible', 'Enduring'],
    negative: ['Pessimistic', 'Slow', 'Depressed', 'Restricted', 'Lonely'],
    careers: ['Administrator', 'Judge', 'Real Estate', 'Mining', 'Agriculture'],
    lucky: {
      numbers: [8, 4, 6],
      colors: ['Blue', 'Black', 'Purple'],
      days: ['Saturday'],
    },
    unlucky: {
      numbers: [1, 2, 9],
      colors: ['Red', 'Golden'],
    },
  },
  9: {
    number: 9,
    planet: 'Mars (Mangal)',
    deity: 'Lord Hanuman',
    element: 'Fire',
    color: 'Red, Maroon',
    gemstone: 'Red Coral',
    mantra: 'Om Mangalaya Namaha',
    day: 'Tuesday',
    positive: ['Courageous', 'Energetic', 'Passionate', 'Determined', 'Protective'],
    negative: ['Aggressive', 'Impatient', 'Impulsive', 'Short-tempered'],
    careers: ['Military', 'Police', 'Surgeon', 'Athlete', 'Engineer'],
    lucky: {
      numbers: [9, 3, 1],
      colors: ['Red', 'Maroon', 'Pink'],
      days: ['Tuesday', 'Thursday'],
    },
    unlucky: {
      numbers: [2, 8],
      colors: ['Black', 'Blue'],
    },
  },
};

// ==================== MASTER NUMBERS ====================

export const VEDIC_MASTER_NUMBERS = {
  11: {
    number: 11,
    meaning: 'Master Spiritual Number',
    qualities: ['Intuition', 'Enlightenment', 'Spiritual Teacher', 'Visionary'],
    challenges: ['Nervous tension', 'Over-sensitivity', 'Impractical'],
    careers: ['Spiritual Teacher', 'Psychic', 'Artist', 'Inventor'],
  },
  22: {
    number: 22,
    meaning: 'Master Builder',
    qualities: ['Practical idealism', 'Large-scale achievement', 'Power', 'Vision'],
    challenges: ['Pressure', 'Self-doubt', 'Overwhelming responsibility'],
    careers: ['Architect', 'Engineer', 'International Business', 'Diplomat'],
  },
  33: {
    number: 33,
    meaning: 'Master Teacher',
    qualities: ['Compassion', 'Healing', 'Teaching', 'Nurturing humanity'],
    challenges: ['Martyrdom', 'Over-giving', 'Escapism'],
    careers: ['Healer', 'Spiritual Guide', 'Social Worker', 'Humanitarian'],
  },
};

// ==================== COMPATIBILITY ====================

export interface VedicCompatibility {
  mulank1: number;
  mulank2: number;
  score: number;
  level: 'Excellent' | 'Good' | 'Moderate' | 'Challenging' | 'Difficult';
  description: string;
  strengths: string[];
  challenges: string[];
  advice: string[];
}

/**
 * Calculate compatibility between two Mulank numbers
 */
export function calculateVedicCompatibility(
  mulank1: number,
  mulank2: number
): VedicCompatibility {
  // Compatibility matrix (simplified)
  const compatibilityScores: { [key: string]: number } = {
    '1-1': 50, '1-2': 90, '1-3': 85, '1-4': 40, '1-5': 75, '1-6': 60, '1-7': 70, '1-8': 30, '1-9': 95,
    '2-2': 80, '2-3': 75, '2-4': 45, '2-5': 70, '2-6': 85, '2-7': 90, '2-8': 40, '2-9': 60,
    '3-3': 85, '3-4': 50, '3-5': 65, '3-6': 90, '3-7': 70, '3-8': 45, '3-9': 95,
    '4-4': 70, '4-5': 60, '4-6': 85, '4-7': 55, '4-8': 50, '4-9': 40,
    '5-5': 75, '5-6': 90, '5-7': 65, '5-8': 50, '5-9': 70,
    '6-6': 85, '6-7': 75, '6-8': 55, '6-9': 65,
    '7-7': 80, '7-8': 45, '7-9': 60,
    '8-8': 75, '8-9': 40,
    '9-9': 85,
  };

  const key1 = `${Math.min(mulank1, mulank2)}-${Math.max(mulank1, mulank2)}`;
  const score = compatibilityScores[key1] || 50;

  let level: VedicCompatibility['level'];
  if (score >= 85) level = 'Excellent';
  else if (score >= 70) level = 'Good';
  else if (score >= 55) level = 'Moderate';
  else if (score >= 40) level = 'Challenging';
  else level = 'Difficult';

  const num1Data = VEDIC_NUMBERS[mulank1];
  const num2Data = VEDIC_NUMBERS[mulank2];

  return {
    mulank1,
    mulank2,
    score,
    level,
    description: `${num1Data.planet} and ${num2Data.planet} combination`,
    strengths: [
      `${num1Data.positive[0]} meets ${num2Data.positive[0]}`,
      'Complementary energies',
    ],
    challenges: [
      `${num1Data.negative[0]} may clash with ${num2Data.negative[0]}`,
      'Different approaches to life',
    ],
    advice: [
      `${num1Data.planet} should respect ${num2Data.planet}'s nature`,
      'Practice mutual understanding',
      'Celebrate differences',
    ],
  };
}

// ==================== LIFE CYCLES (PINNACLES) ====================

export interface LifeCycle {
  cycleNumber: number;
  startAge: number;
  endAge: number | null;
  pinnacleNumber: number;
  challenges: number;
  theme: string;
  opportunities: string[];
  lessons: string[];
}

/**
 * Calculate Vedic Life Cycles (3 major periods)
 */
export function calculateLifeCycles(birthDate: Date): LifeCycle[] {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();

  // Reduce to single digits
  const reduceNumber = (n: number): number => {
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
      n = n.toString().split('').reduce((sum, d) => sum + parseInt(d), 0);
    }
    return n;
  };

  const dayReduced = reduceNumber(day);
  const monthReduced = reduceNumber(month);
  const yearReduced = reduceNumber(year);

  // First Cycle: 0-27 years (influenced by Month + Day)
  const firstPinnacle = reduceNumber(monthReduced + dayReduced);

  // Second Cycle: 28-54 years (influenced by Day + Year)
  const secondPinnacle = reduceNumber(dayReduced + yearReduced);

  // Third Cycle: 55+ years (influenced by Month + Year)
  const thirdPinnacle = reduceNumber(monthReduced + yearReduced);

  const cycles: LifeCycle[] = [
    {
      cycleNumber: 1,
      startAge: 0,
      endAge: 27,
      pinnacleNumber: firstPinnacle,
      challenges: reduceNumber(Math.abs(dayReduced - monthReduced)),
      theme: 'Foundation & Learning',
      opportunities: VEDIC_NUMBERS[firstPinnacle]?.positive || [],
      lessons: ['Build foundation', 'Learn basic skills', 'Form personality'],
    },
    {
      cycleNumber: 2,
      startAge: 28,
      endAge: 54,
      pinnacleNumber: secondPinnacle,
      challenges: reduceNumber(Math.abs(dayReduced - yearReduced)),
      theme: 'Productivity & Achievement',
      opportunities: VEDIC_NUMBERS[secondPinnacle]?.positive || [],
      lessons: ['Career building', 'Family creation', 'Material success'],
    },
    {
      cycleNumber: 3,
      startAge: 55,
      endAge: null,
      pinnacleNumber: thirdPinnacle,
      challenges: reduceNumber(Math.abs(monthReduced - yearReduced)),
      theme: 'Wisdom & Contribution',
      opportunities: VEDIC_NUMBERS[thirdPinnacle]?.positive || [],
      lessons: ['Share wisdom', 'Spiritual growth', 'Legacy creation'],
    },
  ];

  return cycles;
}

// ==================== PERSONAL YEAR/MONTH/DAY ====================

/**
 * Calculate Personal Year (changes every birthday)
 */
export function calculatePersonalYear(birthDate: Date, currentYear: number): number {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;

  let sum = day + month + currentYear;

  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((total, d) => total + parseInt(d), 0);
  }

  return sum;
}

/**
 * Calculate Personal Month
 */
export function calculatePersonalMonth(personalYear: number, month: number): number {
  let sum = personalYear + month;

  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((total, d) => total + parseInt(d), 0);
  }

  return sum;
}

/**
 * Calculate Personal Day
 */
export function calculatePersonalDay(personalMonth: number, day: number): number {
  let sum = personalMonth + day;

  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((total, d) => total + parseInt(d), 0);
  }

  return sum;
}

// ==================== COMPREHENSIVE VEDIC READING ====================

export interface VedicNumerologyReading {
  // Core Numbers
  mulank: number;           // Driver (birth day)
  bhagyank: number;         // Conductor (full birth date)
  naamank?: number;         // Name number (optional)

  // Lo Shu Grid (integrated)
  loShuGrid: ReturnType<typeof calculateLoShuGrid>;

  // Detailed Analysis
  mulankDetails: VedicNumber;
  bhagyankDetails: VedicNumber;
  naamankDetails?: VedicNumber;

  // Master Number
  isMasterNumber: boolean;
  masterNumberDetails?: typeof VEDIC_MASTER_NUMBERS[11];

  // Life Cycles
  lifeCycles: LifeCycle[];
  currentCycle?: LifeCycle;

  // Current Influences
  currentYear: number;
  personalYear: number;
  personalYearDetails: VedicNumber;

  // Compatibility
  friendlyNumbers: number[];
  enemyNumbers: number[];
  neutralNumbers: number[];

  // Predictions
  currentPhase: string;
  opportunities: string[];
  challenges: string[];
  recommendations: string[];

  // Remedies
  primaryRemedy: {
    planet: string;
    gemstone: string;
    mantra: string;
    color: string;
    day: string;
  };
  secondaryRemedies: string[];
}

/**
 * Generate complete Vedic Numerology reading
 */
export function generateVedicReading(
  birthDate: Date,
  fullName?: string
): VedicNumerologyReading {
  // Calculate core numbers
  const mulank = calculateLoShuGrid(birthDate).mulank;
  const bhagyank = calculateLoShuGrid(birthDate).bhagyank;

  // Lo Shu Grid
  const loShuGrid = calculateLoShuGrid(birthDate, fullName);

  // Details
  const mulankDetails = VEDIC_NUMBERS[mulank];
  const bhagyankDetails = VEDIC_NUMBERS[bhagyank];

  // Master number check
  const isMasterNumber = [11, 22, 33].includes(mulank) || [11, 22, 33].includes(bhagyank);
  const masterNumberDetails = isMasterNumber
    ? VEDIC_MASTER_NUMBERS[mulank as 11 | 22 | 33] || VEDIC_MASTER_NUMBERS[bhagyank as 11 | 22 | 33]
    : undefined;

  // Life cycles
  const lifeCycles = calculateLifeCycles(birthDate);
  const currentAge = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const currentCycle = lifeCycles.find(c => currentAge >= c.startAge && (c.endAge === null || currentAge <= c.endAge));

  // Personal year
  const currentYear = new Date().getFullYear();
  const personalYear = calculatePersonalYear(birthDate, currentYear);
  const personalYearDetails = VEDIC_NUMBERS[personalYear] || VEDIC_NUMBERS[1];

  // Friendly/Enemy numbers
  const friendlyNumbers = mulankDetails.lucky.numbers;
  const enemyNumbers = mulankDetails.unlucky.numbers;
  const neutralNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
    n => !friendlyNumbers.includes(n) && !enemyNumbers.includes(n)
  );

  return {
    mulank,
    bhagyank,
    loShuGrid,
    mulankDetails,
    bhagyankDetails,
    isMasterNumber,
    masterNumberDetails,
    lifeCycles,
    currentCycle,
    currentYear,
    personalYear,
    personalYearDetails,
    friendlyNumbers,
    enemyNumbers,
    neutralNumbers,
    currentPhase: currentCycle?.theme || 'Transition',
    opportunities: personalYearDetails.positive,
    challenges: personalYearDetails.negative,
    recommendations: [
      `Wear ${mulankDetails.gemstone}`,
      `Chant ${mulankDetails.mantra} daily`,
      `Donate on ${mulankDetails.day}`,
      `Use ${mulankDetails.color} colors`,
    ],
    primaryRemedy: {
      planet: mulankDetails.planet,
      gemstone: mulankDetails.gemstone,
      mantra: mulankDetails.mantra,
      color: mulankDetails.color,
      day: mulankDetails.day,
    },
    secondaryRemedies: loShuGrid.remedies.map(r => `${r.gemstone} for missing ${r.planet}`),
  };
}

// ==================== EXPORT ALL ====================

export default {
  generateVedicReading,
  calculateVedicCompatibility,
  calculateLifeCycles,
  calculatePersonalYear,
  calculatePersonalMonth,
  calculatePersonalDay,
  VEDIC_NUMBERS,
  VEDIC_MASTER_NUMBERS,
};
