/**
 * Numerology Calculation Engine
 * Pythagorean and Chaldean systems
 */

// ==================== CONSTANTS ====================

// Pythagorean Number-Letter Chart
export const PYTHAGOREAN_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

// Chaldean Number-Letter Chart (alternative system)
export const CHALDEAN_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2,
  S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7,
};

// Master Numbers (don't reduce these)
export const MASTER_NUMBERS = [11, 22, 33, 44];

// Karmic Debt Numbers
export const KARMIC_DEBT_NUMBERS = [13, 14, 16, 19];

// Number Meanings
export const NUMBER_MEANINGS = {
  1: {
    keywords: ['Leadership', 'Independence', 'Innovation', 'Ambition'],
    traits: 'Leader, pioneer, creative, confident, ambitious',
    career: ['Entrepreneur', 'CEO', 'Inventor', 'Designer', 'Director'],
    challenges: 'Can be domineering, stubborn, impatient',
    element: 'Fire',
    planet: 'Sun',
  },
  2: {
    keywords: ['Cooperation', 'Harmony', 'Diplomacy', 'Sensitivity'],
    traits: 'Peacemaker, intuitive, cooperative, gentle, patient',
    career: ['Counselor', 'Mediator', 'Teacher', 'Musician', 'Artist'],
    challenges: 'Can be indecisive, overly sensitive, dependent',
    element: 'Water',
    planet: 'Moon',
  },
  3: {
    keywords: ['Creativity', 'Expression', 'Joy', 'Communication'],
    traits: 'Creative, expressive, optimistic, social, entertaining',
    career: ['Writer', 'Performer', 'Designer', 'Marketer', 'Entertainer'],
    challenges: 'Can be scattered, superficial, indulgent',
    element: 'Fire',
    planet: 'Jupiter',
  },
  4: {
    keywords: ['Stability', 'Organization', 'Hard work', 'Discipline'],
    traits: 'Practical, organized, reliable, methodical, builder',
    career: ['Engineer', 'Accountant', 'Manager', 'Architect', 'Analyst'],
    challenges: 'Can be rigid, stubborn, narrow-minded',
    element: 'Earth',
    planet: 'Rahu',
  },
  5: {
    keywords: ['Freedom', 'Adventure', 'Change', 'Versatility'],
    traits: 'Adventurous, versatile, curious, freedom-loving, dynamic',
    career: ['Travel Agent', 'Sales', 'Journalist', 'Consultant', 'Entrepreneur'],
    challenges: 'Can be restless, irresponsible, scattered',
    element: 'Air',
    planet: 'Mercury',
  },
  6: {
    keywords: ['Responsibility', 'Nurturing', 'Service', 'Harmony'],
    traits: 'Caring, responsible, nurturing, harmonious, domestic',
    career: ['Teacher', 'Nurse', 'Counselor', 'Chef', 'Interior Designer'],
    challenges: 'Can be controlling, self-righteous, worrisome',
    element: 'Earth',
    planet: 'Venus',
  },
  7: {
    keywords: ['Spirituality', 'Analysis', 'Introspection', 'Wisdom'],
    traits: 'Spiritual, analytical, introspective, mysterious, seeker',
    career: ['Researcher', 'Scientist', 'Philosopher', 'Analyst', 'Spiritual Teacher'],
    challenges: 'Can be aloof, secretive, pessimistic',
    element: 'Water',
    planet: 'Ketu',
  },
  8: {
    keywords: ['Power', 'Success', 'Material', 'Authority'],
    traits: 'Ambitious, powerful, successful, authoritative, business-minded',
    career: ['Executive', 'Banker', 'Politician', 'Real Estate', 'CEO'],
    challenges: 'Can be materialistic, controlling, workaholic',
    element: 'Earth',
    planet: 'Saturn',
  },
  9: {
    keywords: ['Completion', 'Compassion', 'Humanitarianism', 'Wisdom'],
    traits: 'Compassionate, humanitarian, wise, idealistic, selfless',
    career: ['Healer', 'Activist', 'Artist', 'Teacher', 'Counselor'],
    challenges: 'Can be impractical, emotional, scattered',
    element: 'Fire',
    planet: 'Mars',
  },
  11: {
    keywords: ['Intuition', 'Inspiration', 'Enlightenment', 'Idealism'],
    traits: 'Intuitive, spiritual, inspirational, idealistic, visionary',
    career: ['Spiritual Leader', 'Inventor', 'Artist', 'Healer', 'Teacher'],
    challenges: 'Can be anxious, impractical, overly sensitive',
    element: 'Air',
    planet: 'Moon (elevated)',
    masterNumber: true,
  },
  22: {
    keywords: ['Master Builder', 'Vision', 'Practical Idealism', 'Achievement'],
    traits: 'Visionary, builder, practical idealist, powerful, transformative',
    career: ['Architect', 'Engineer', 'Leader', 'Planner', 'Builder'],
    challenges: 'Can be overwhelmed, arrogant, controlling',
    element: 'Earth (elevated)',
    planet: 'Uranus',
    masterNumber: true,
  },
  33: {
    keywords: ['Master Teacher', 'Compassion', 'Healing', 'Guidance'],
    traits: 'Master teacher, healer, nurturing, compassionate, selfless',
    career: ['Teacher', 'Healer', 'Counselor', 'Spiritual Guide', 'Artist'],
    challenges: 'Can be martyrdom, overly responsible, burned out',
    element: 'Water (elevated)',
    planet: 'Neptune',
    masterNumber: true,
  },
};

// Compatibility Matrix
export const COMPATIBILITY_MATRIX: Record<number, number[]> = {
  1: [1, 5, 7], // Good matches
  2: [2, 4, 6, 8],
  3: [3, 6, 9],
  4: [2, 4, 7, 8],
  5: [1, 3, 5, 7, 9],
  6: [2, 3, 6, 9],
  7: [1, 4, 5, 7],
  8: [2, 4, 6, 8],
  9: [3, 5, 6, 9],
};

// ==================== INTERFACES ====================

export interface NumerologyInput {
  fullName: string;
  birthDate: Date;
  preferredName?: string;
}

export interface NumerologyChart {
  // Core Numbers
  lifePathNumber: number;
  destinyNumber: number;
  soulUrgeNumber: number;
  personalityNumber: number;
  birthdayNumber: number;
  maturityNumber: number;

  // Master & Karmic
  hasMasterNumber: boolean;
  masterNumbers: number[];
  hasKarmicDebt: boolean;
  karmicDebtNumbers: number[];

  // Personal Cycles
  currentPersonalYear: number;
  currentPersonalMonth: number;
  currentPersonalDay: number;

  // Pinnacles & Challenges
  pinnacles: any[];
  challenges: any[];

  // Lucky Elements
  luckyNumbers: number[];
  luckyColors: string[];
  luckyGemstones: string[];

  // Interpretations
  analysis: string;
  strengths: string[];
  weaknesses: string[];
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Reduce a number to single digit or master number
 */
function reduceNumber(num: number, keepMaster: boolean = true): number {
  while (num > 9) {
    // Check if it's a master number
    if (keepMaster && MASTER_NUMBERS.includes(num)) {
      return num;
    }

    // Reduce
    const digits = num.toString().split('');
    num = digits.reduce((sum, digit) => sum + parseInt(digit), 0);
  }

  return num;
}

/**
 * Calculate number value of a name
 */
function calculateNameValue(name: string, system: 'pythagorean' | 'chaldean' = 'pythagorean'): number {
  const values = system === 'pythagorean' ? PYTHAGOREAN_VALUES : CHALDEAN_VALUES;
  const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');

  let total = 0;
  for (const char of cleanName) {
    total += values[char] || 0;
  }

  return total;
}

/**
 * Get vowels from name
 */
function getVowels(name: string): string {
  return name.toUpperCase().replace(/[^AEIOU]/g, '');
}

/**
 * Get consonants from name
 */
function getConsonants(name: string): string {
  return name.toUpperCase().replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/g, '');
}

/**
 * Calculate Life Path Number (from birth date)
 */
function calculateLifePath(birthDate: Date): number {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();

  // Reduce each component
  const dayReduced = reduceNumber(day);
  const monthReduced = reduceNumber(month);
  const yearReduced = reduceNumber(year);

  // Add and reduce again
  const total = dayReduced + monthReduced + yearReduced;
  return reduceNumber(total);
}

/**
 * Calculate Destiny Number (from full name)
 */
function calculateDestiny(fullName: string): number {
  const value = calculateNameValue(fullName);
  return reduceNumber(value);
}

/**
 * Calculate Soul Urge Number (from vowels)
 */
function calculateSoulUrge(fullName: string): number {
  const vowels = getVowels(fullName);
  const value = calculateNameValue(vowels);
  return reduceNumber(value);
}

/**
 * Calculate Personality Number (from consonants)
 */
function calculatePersonality(fullName: string): number {
  const consonants = getConsonants(fullName);
  const value = calculateNameValue(consonants);
  return reduceNumber(value);
}

/**
 * Calculate Birthday Number (day of birth)
 */
function calculateBirthday(birthDate: Date): number {
  return reduceNumber(birthDate.getDate());
}

/**
 * Calculate Maturity Number (Life Path + Destiny)
 */
function calculateMaturity(lifePath: number, destiny: number): number {
  return reduceNumber(lifePath + destiny);
}

/**
 * Calculate Personal Year
 */
function calculatePersonalYear(birthDate: Date, year: number): number {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;

  const dayReduced = reduceNumber(day);
  const monthReduced = reduceNumber(month);
  const yearReduced = reduceNumber(year);

  return reduceNumber(dayReduced + monthReduced + yearReduced);
}

/**
 * Calculate Pinnacle Numbers
 */
function calculatePinnacles(birthDate: Date): any[] {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();

  const dayReduced = reduceNumber(day);
  const monthReduced = reduceNumber(month);
  const yearReduced = reduceNumber(year);

  // First Pinnacle: Month + Day
  const first = reduceNumber(monthReduced + dayReduced);

  // Second Pinnacle: Day + Year
  const second = reduceNumber(dayReduced + yearReduced);

  // Third Pinnacle: First + Second
  const third = reduceNumber(first + second);

  // Fourth Pinnacle: Month + Year
  const fourth = reduceNumber(monthReduced + yearReduced);

  // Calculate ages (simplified)
  const lifePath = calculateLifePath(birthDate);
  const firstAge = 36 - lifePath;

  return [
    { number: first, startAge: 0, endAge: firstAge },
    { number: second, startAge: firstAge, endAge: firstAge + 9 },
    { number: third, startAge: firstAge + 9, endAge: firstAge + 18 },
    { number: fourth, startAge: firstAge + 18, endAge: 999 },
  ];
}

/**
 * Determine lucky colors for a number
 */
function getLuckyColors(number: number): string[] {
  const colorMap: Record<number, string[]> = {
    1: ['Red', 'Orange', 'Yellow'],
    2: ['White', 'Cream', 'Pale Green'],
    3: ['Yellow', 'Purple', 'Mauve'],
    4: ['Blue', 'Grey', 'Black'],
    5: ['Light Colors', 'Grey', 'White'],
    6: ['Pink', 'Blue', 'Green'],
    7: ['Green', 'White', 'Light Yellow'],
    8: ['Dark Blue', 'Black', 'Purple'],
    9: ['Red', 'Crimson', 'Pink'],
  };

  return colorMap[number] || ['White'];
}

/**
 * Determine lucky gemstones for a number
 */
function getLuckyGemstones(number: number): string[] {
  const gemMap: Record<number, string[]> = {
    1: ['Ruby', 'Garnet', 'Red Coral'],
    2: ['Pearl', 'Moonstone', 'White Coral'],
    3: ['Yellow Sapphire', 'Topaz', 'Citrine'],
    4: ['Hessonite', 'Gomed', 'Turquoise'],
    5: ['Emerald', 'Green Tourmaline', 'Jade'],
    6: ['Diamond', 'White Sapphire', 'Opal'],
    7: ["Cat's Eye", 'Amethyst', 'Moonstone'],
    8: ['Blue Sapphire', 'Lapis Lazuli', 'Black Onyx'],
    9: ['Red Coral', 'Carnelian', 'Bloodstone'],
  };

  return gemMap[number] || ['Crystal'];
}

// ==================== MAIN FUNCTION ====================

/**
 * Generate complete Numerology Chart
 */
export async function generateNumerologyChart(input: NumerologyInput): Promise<NumerologyChart> {
  const { fullName, birthDate, preferredName } = input;

  // Core Numbers
  const lifePathNumber = calculateLifePath(birthDate);
  const destinyNumber = calculateDestiny(fullName);
  const soulUrgeNumber = calculateSoulUrge(fullName);
  const personalityNumber = calculatePersonality(fullName);
  const birthdayNumber = calculateBirthday(birthDate);
  const maturityNumber = calculateMaturity(lifePathNumber, destinyNumber);

  // Check for Master Numbers
  const allNumbers = [lifePathNumber, destinyNumber, soulUrgeNumber, personalityNumber, maturityNumber];
  const masterNumbers = allNumbers.filter((n) => MASTER_NUMBERS.includes(n));
  const hasMasterNumber = masterNumbers.length > 0;

  // Check for Karmic Debt
  const karmicDebtNumbers: number[] = [];
  const hasKarmicDebt = karmicDebtNumbers.length > 0;

  // Current Cycles
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();

  const currentPersonalYear = calculatePersonalYear(birthDate, currentYear);
  const currentPersonalMonth = reduceNumber(currentPersonalYear + currentMonth);
  const currentPersonalDay = reduceNumber(currentPersonalMonth + currentDay);

  // Pinnacles & Challenges
  const pinnacles = calculatePinnacles(birthDate);
  const challenges: any[] = []; // Simplified

  // Lucky Elements
  const luckyNumbers = [lifePathNumber, destinyNumber, birthdayNumber];
  const luckyColors = getLuckyColors(lifePathNumber);
  const luckyGemstones = getLuckyGemstones(lifePathNumber);

  // Analysis
  const lifePathMeaning = NUMBER_MEANINGS[lifePathNumber] || NUMBER_MEANINGS[1];
  const destinyMeaning = NUMBER_MEANINGS[destinyNumber] || NUMBER_MEANINGS[1];

  const analysis = `Your Life Path Number is ${lifePathNumber}, indicating ${lifePathMeaning.traits}. ` +
    `Your Destiny Number is ${destinyNumber}, showing talents in ${destinyMeaning.career.join(', ')}. ` +
    `You are currently in Personal Year ${currentPersonalYear}.`;

  const strengths = lifePathMeaning.keywords;
  const weaknesses = [lifePathMeaning.challenges];

  return {
    lifePathNumber,
    destinyNumber,
    soulUrgeNumber,
    personalityNumber,
    birthdayNumber,
    maturityNumber,
    hasMasterNumber,
    masterNumbers,
    hasKarmicDebt,
    karmicDebtNumbers,
    currentPersonalYear,
    currentPersonalMonth,
    currentPersonalDay,
    pinnacles,
    challenges,
    luckyNumbers,
    luckyColors,
    luckyGemstones,
    analysis,
    strengths,
    weaknesses,
  };
}

/**
 * Calculate compatibility between two numbers
 */
export function calculateCompatibility(number1: number, number2: number): number {
  const compatible = COMPATIBILITY_MATRIX[number1] || [];
  if (compatible.includes(number2)) {
    return 85; // High compatibility
  } else if (Math.abs(number1 - number2) <= 2) {
    return 60; // Moderate compatibility
  } else {
    return 40; // Low compatibility
  }
}

/**
 * Analyze name change impact
 */
export function analyzeNameChange(currentName: string, newName: string) {
  const currentDestiny = calculateDestiny(currentName);
  const newDestiny = calculateDestiny(newName);

  const currentMeaning = NUMBER_MEANINGS[currentDestiny];
  const newMeaning = NUMBER_MEANINGS[newDestiny];

  return {
    currentDestiny,
    newDestiny,
    improvement: newDestiny > currentDestiny,
    analysis: `Changing from ${currentName} (${currentDestiny}) to ${newName} (${newDestiny}) ` +
      `will shift your energy from ${currentMeaning?.keywords.join(', ')} to ${newMeaning?.keywords.join(', ')}.`,
  };
}
