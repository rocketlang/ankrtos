// =====================================================
// LO SHU GRID - VEDIC NUMEROLOGY ENGINE
// Ancient Indian Numerology System
// Founded by Jyotish Acharya Rakesh Sharma
// =====================================================

// ==================== LO SHU GRID STRUCTURE ====================

/**
 * The Lo Shu Grid is a 3x3 magic square
 * Each position has significance
 *
 *  4  9  2
 *  3  5  7
 *  8  1  6
 *
 * Sum of each row, column, diagonal = 15
 */

export interface LoShuGrid {
  grid: number[][];           // 3x3 grid with counts
  birthDate: Date;
  dateString: string;         // "15-08-1990"
  allNumbers: number[];       // All digits from birth date
  presentNumbers: number[];   // Unique numbers present (1-9)
  missingNumbers: number[];   // Missing numbers (1-9)
  repeatedNumbers: {          // Numbers that appear more than once
    number: number;
    count: number;
  }[];

  // Core Numbers
  mulank: number;             // Root number (day reduced)
  bhagyank: number;           // Destiny number (full date reduced)
  naamank?: number;           // Name number (optional)

  // Planetary Analysis
  planetaryRulers: {
    number: number;
    planet: string;
    strength: 'very strong' | 'strong' | 'moderate' | 'weak' | 'absent';
    count: number;
  }[];

  // Arrows
  arrows: {
    name: string;
    type: 'positive' | 'negative';
    numbers: number[];
    present: boolean;
    meaning: string;
    impact: string;
  }[];

  // Planes
  planes: {
    name: string;
    numbers: number[];
    count: number;
    strength: 'strong' | 'moderate' | 'weak';
    meaning: string;
  }[];

  // Analysis
  strengths: string[];
  weaknesses: string[];
  personality: string;
  career: string[];
  relationships: string;
  health: string[];

  // Remedies
  remedies: {
    missingNumber: number;
    planet: string;
    gemstone: string;
    mantra: string;
    color: string;
    day: string;
    charity: string[];
  }[];
}

// ==================== PLANETARY ASSOCIATIONS ====================

export const LOSHU_PLANETS = {
  1: {
    planet: 'Sun',
    sanskrit: 'Surya',
    element: 'Fire',
    quality: 'Leadership, authority, self-confidence',
    positive: 'Leader, confident, independent, creative',
    negative: 'Egoistic, dominating, arrogant',
    gemstone: 'Ruby',
    color: 'Red, Orange, Golden',
    day: 'Sunday',
    mantra: 'Om Suryaya Namaha',
    deity: 'Lord Surya',
  },
  2: {
    planet: 'Moon',
    sanskrit: 'Chandra',
    element: 'Water',
    quality: 'Emotions, intuition, sensitivity',
    positive: 'Intuitive, caring, diplomatic, artistic',
    negative: 'Moody, oversensitive, indecisive',
    gemstone: 'Pearl',
    color: 'White, Cream, Light Blue',
    day: 'Monday',
    mantra: 'Om Chandraya Namaha',
    deity: 'Goddess Parvati',
  },
  3: {
    planet: 'Jupiter',
    sanskrit: 'Guru',
    element: 'Ether',
    quality: 'Wisdom, expansion, optimism',
    positive: 'Wise, optimistic, generous, spiritual',
    negative: 'Over-confident, extravagant, lazy',
    gemstone: 'Yellow Sapphire',
    color: 'Yellow, Golden',
    day: 'Thursday',
    mantra: 'Om Gurave Namaha',
    deity: 'Lord Brihaspati',
  },
  4: {
    planet: 'Rahu',
    sanskrit: 'Rahu',
    element: 'Air',
    quality: 'Materialism, practicality, innovation',
    positive: 'Practical, hardworking, detail-oriented, innovative',
    negative: 'Stubborn, rigid, rebellious',
    gemstone: 'Hessonite (Gomed)',
    color: 'Grey, Brown, Black',
    day: 'Saturday',
    mantra: 'Om Rahave Namaha',
    deity: 'Goddess Durga',
  },
  5: {
    planet: 'Mercury',
    sanskrit: 'Budh',
    element: 'Earth',
    quality: 'Communication, intellect, versatility',
    positive: 'Intelligent, communicative, adaptable, quick learner',
    negative: 'Restless, nervous, scattered',
    gemstone: 'Emerald',
    color: 'Green',
    day: 'Wednesday',
    mantra: 'Om Budhaya Namaha',
    deity: 'Lord Vishnu',
  },
  6: {
    planet: 'Venus',
    sanskrit: 'Shukra',
    element: 'Water',
    quality: 'Love, luxury, beauty, harmony',
    positive: 'Loving, artistic, harmonious, charming',
    negative: 'Materialistic, lazy, self-indulgent',
    gemstone: 'Diamond / White Sapphire',
    color: 'White, Pink, Light Blue',
    day: 'Friday',
    mantra: 'Om Shukraya Namaha',
    deity: 'Goddess Lakshmi',
  },
  7: {
    planet: 'Ketu',
    sanskrit: 'Ketu',
    element: 'Fire',
    quality: 'Spirituality, introspection, mysticism',
    positive: 'Spiritual, analytical, philosophical, researcher',
    negative: 'Isolated, secretive, pessimistic',
    gemstone: "Cat's Eye",
    color: 'Purple, Violet',
    day: 'Tuesday',
    mantra: 'Om Ketave Namaha',
    deity: 'Lord Ganesha',
  },
  8: {
    planet: 'Saturn',
    sanskrit: 'Shani',
    element: 'Air',
    quality: 'Discipline, karma, hard work',
    positive: 'Disciplined, responsible, patient, organized',
    negative: 'Pessimistic, slow, depressed, restricted',
    gemstone: 'Blue Sapphire',
    color: 'Blue, Black',
    day: 'Saturday',
    mantra: 'Om Shanaye Namaha',
    deity: 'Lord Shani',
  },
  9: {
    planet: 'Mars',
    sanskrit: 'Mangal',
    element: 'Fire',
    quality: 'Energy, courage, action',
    positive: 'Courageous, energetic, passionate, determined',
    negative: 'Aggressive, impatient, impulsive, short-tempered',
    gemstone: 'Red Coral',
    color: 'Red, Maroon',
    day: 'Tuesday',
    mantra: 'Om Mangalaya Namaha',
    deity: 'Lord Hanuman',
  },
};

// ==================== ARROWS IN LO SHU GRID ====================

export const LOSHU_ARROWS = {
  // POSITIVE ARROWS (Strengths)
  Planner: {
    type: 'positive' as const,
    numbers: [1, 2, 3],
    direction: 'horizontal-bottom',
    meaning: 'Mental/Thinking Plane - Planning ability',
    impact: 'Excellent at planning, organizing, and thinking ahead. Strategic mindset.',
  },
  Will: {
    type: 'positive' as const,
    numbers: [4, 5, 6],
    direction: 'horizontal-middle',
    meaning: 'Emotional/Soul Plane - Willpower',
    impact: 'Strong willpower and emotional stability. Can achieve goals through determination.',
  },
  Action: {
    type: 'positive' as const,
    numbers: [7, 8, 9],
    direction: 'horizontal-top',
    meaning: 'Physical/Practical Plane - Action oriented',
    impact: 'Highly action-oriented. Gets things done. Practical and grounded.',
  },
  Determination: {
    type: 'positive' as const,
    numbers: [1, 5, 9],
    direction: 'diagonal-main',
    meaning: 'Determination Arrow - Strong willpower',
    impact: 'Extremely determined. Never gives up. Strong sense of purpose.',
  },
  Spiritual: {
    type: 'positive' as const,
    numbers: [3, 5, 7],
    direction: 'diagonal-anti',
    meaning: 'Spiritual Arrow - Enlightenment path',
    impact: 'Spiritual inclination. Philosophical. Seeks deeper meaning in life.',
  },
  Intellect: {
    type: 'positive' as const,
    numbers: [4, 5, 6],
    direction: 'vertical-middle',
    meaning: 'Intellect Arrow - Mental brilliance',
    impact: 'High intellectual capacity. Quick learner. Academic success.',
  },
  Emotional: {
    type: 'positive' as const,
    numbers: [2, 5, 8],
    direction: 'vertical-middle',
    meaning: 'Emotional Sensitivity Arrow',
    impact: 'Emotionally intelligent. Empathetic. Good in counseling/healing.',
  },
  Activity: {
    type: 'positive' as const,
    numbers: [1, 4, 7],
    direction: 'vertical-left',
    meaning: 'Physical Activity Arrow',
    impact: 'Very active physically. Enjoys sports. High energy levels.',
  },

  // NEGATIVE ARROWS (Weaknesses - when numbers are MISSING)
  Confusion: {
    type: 'negative' as const,
    numbers: [1, 2, 3],
    direction: 'horizontal-bottom',
    meaning: 'Confusion in planning and thinking',
    impact: 'Difficulty in planning. Scattered thinking. Needs to work on focus.',
  },
  Frustration: {
    type: 'negative' as const,
    numbers: [4, 5, 6],
    direction: 'horizontal-middle',
    meaning: 'Emotional frustration and instability',
    impact: 'Emotional ups and downs. Frustration. Needs emotional healing.',
  },
  Lethargy: {
    type: 'negative' as const,
    numbers: [7, 8, 9],
    direction: 'horizontal-top',
    meaning: 'Physical lethargy and inaction',
    impact: 'Lacks physical energy. Procrastination. Needs motivation.',
  },
  MemoryIssues: {
    type: 'negative' as const,
    numbers: [3, 6, 9],
    direction: 'vertical-right',
    meaning: 'Poor memory and concentration',
    impact: 'Memory issues. Difficulty focusing. Needs mental exercises.',
  },
};

// ==================== CALCULATION FUNCTIONS ====================

/**
 * Extract all digits from birth date
 */
export function extractDigits(birthDate: Date): number[] {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();

  const dateString = `${day}${month}${year}`;
  return dateString.split('').map(d => parseInt(d)).filter(d => d !== 0); // Ignore 0
}

/**
 * Calculate Mulank (Root Number) - Birth day reduced to single digit
 */
export function calculateMulank(birthDate: Date): number {
  let day = birthDate.getDate();

  while (day > 9 && day !== 11 && day !== 22 && day !== 33) {
    day = day.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  }

  return day;
}

/**
 * Calculate Bhagyank (Destiny Number) - Full birth date reduced
 */
export function calculateBhagyank(birthDate: Date): number {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();

  let sum = day + month + year;

  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((total, digit) => total + parseInt(digit), 0);
  }

  return sum;
}

/**
 * Create Lo Shu Grid with number placements
 */
export function createLoShuGrid(digits: number[]): number[][] {
  // Initialize 3x3 grid with zeros
  const grid = [
    [0, 0, 0],  // Row 0: positions for 4, 9, 2
    [0, 0, 0],  // Row 1: positions for 3, 5, 7
    [0, 0, 0],  // Row 2: positions for 8, 1, 6
  ];

  // Lo Shu positions (1-indexed)
  const positions: { [key: number]: [number, number] } = {
    4: [0, 0], 9: [0, 1], 2: [0, 2],
    3: [1, 0], 5: [1, 1], 7: [1, 2],
    8: [2, 0], 1: [2, 1], 6: [2, 2],
  };

  // Count occurrences of each digit
  for (const digit of digits) {
    if (digit >= 1 && digit <= 9) {
      const [row, col] = positions[digit];
      grid[row][col]++;
    }
  }

  return grid;
}

/**
 * Analyze which numbers are present and missing
 */
export function analyzeNumbers(digits: number[]): {
  presentNumbers: number[];
  missingNumbers: number[];
  repeatedNumbers: { number: number; count: number }[];
} {
  const counts: { [key: number]: number } = {};

  for (let i = 1; i <= 9; i++) {
    counts[i] = 0;
  }

  for (const digit of digits) {
    if (digit >= 1 && digit <= 9) {
      counts[digit]++;
    }
  }

  const presentNumbers = Object.keys(counts)
    .filter(n => counts[parseInt(n)] > 0)
    .map(n => parseInt(n));

  const missingNumbers = Object.keys(counts)
    .filter(n => counts[parseInt(n)] === 0)
    .map(n => parseInt(n));

  const repeatedNumbers = Object.keys(counts)
    .filter(n => counts[parseInt(n)] > 1)
    .map(n => ({ number: parseInt(n), count: counts[parseInt(n)] }));

  return { presentNumbers, missingNumbers, repeatedNumbers };
}

/**
 * Analyze planetary strengths
 */
export function analyzePlanetaryRulers(
  presentNumbers: number[],
  repeatedNumbers: { number: number; count: number }[]
): {
  number: number;
  planet: string;
  strength: 'very strong' | 'strong' | 'moderate' | 'weak' | 'absent';
  count: number;
}[] {
  const rulers = [];

  for (let i = 1; i <= 9; i++) {
    const repeated = repeatedNumbers.find(r => r.number === i);
    const count = repeated ? repeated.count : (presentNumbers.includes(i) ? 1 : 0);

    let strength: 'very strong' | 'strong' | 'moderate' | 'weak' | 'absent';
    if (count === 0) strength = 'absent';
    else if (count === 1) strength = 'moderate';
    else if (count === 2) strength = 'strong';
    else strength = 'very strong';

    rulers.push({
      number: i,
      planet: LOSHU_PLANETS[i as keyof typeof LOSHU_PLANETS].planet,
      strength,
      count,
    });
  }

  return rulers;
}

/**
 * Check which arrows are present
 */
export function analyzeArrows(presentNumbers: number[]): typeof LOSHU_ARROWS[keyof typeof LOSHU_ARROWS] & { present: boolean }[] {
  const arrows = [];

  for (const [name, arrow] of Object.entries(LOSHU_ARROWS)) {
    const present = arrow.numbers.every(n => presentNumbers.includes(n));
    arrows.push({
      name,
      ...arrow,
      present,
    });
  }

  return arrows;
}

/**
 * Analyze the three planes (Mental, Emotional, Physical)
 */
export function analyzePlanes(grid: number[][]): {
  name: string;
  numbers: number[];
  count: number;
  strength: 'strong' | 'moderate' | 'weak';
  meaning: string;
}[] {
  return [
    {
      name: 'Mental Plane',
      numbers: [1, 2, 3],
      count: grid[2][1] + grid[0][2] + grid[1][0],
      strength: (grid[2][1] + grid[0][2] + grid[1][0]) >= 3 ? 'strong' :
                (grid[2][1] + grid[0][2] + grid[1][0]) >= 1 ? 'moderate' : 'weak',
      meaning: 'Thinking, planning, mental abilities',
    },
    {
      name: 'Emotional Plane',
      numbers: [4, 5, 6],
      count: grid[0][0] + grid[1][1] + grid[2][2],
      strength: (grid[0][0] + grid[1][1] + grid[2][2]) >= 3 ? 'strong' :
                (grid[0][0] + grid[1][1] + grid[2][2]) >= 1 ? 'moderate' : 'weak',
      meaning: 'Emotions, willpower, soul expression',
    },
    {
      name: 'Physical Plane',
      numbers: [7, 8, 9],
      count: grid[1][2] + grid[2][0] + grid[0][1],
      strength: (grid[1][2] + grid[2][0] + grid[0][1]) >= 3 ? 'strong' :
                (grid[1][2] + grid[2][0] + grid[0][1]) >= 1 ? 'moderate' : 'weak',
      meaning: 'Action, physical expression, material world',
    },
  ];
}

/**
 * Generate remedies for missing numbers
 */
export function generateRemedies(missingNumbers: number[]): LoShuGrid['remedies'] {
  return missingNumbers.map(num => {
    const planetInfo = LOSHU_PLANETS[num as keyof typeof LOSHU_PLANETS];
    return {
      missingNumber: num,
      planet: planetInfo.planet,
      gemstone: planetInfo.gemstone,
      mantra: planetInfo.mantra,
      color: planetInfo.color,
      day: planetInfo.day,
      charity: [`Donate on ${planetInfo.day}`, `Wear ${planetInfo.color}`, `Feed ${planetInfo.planet} related items`],
    };
  });
}

/**
 * Generate personality analysis
 */
export function generatePersonalityAnalysis(
  planetaryRulers: LoShuGrid['planetaryRulers'],
  arrows: LoShuGrid['arrows']
): string {
  const strongPlanets = planetaryRulers.filter(p => p.strength === 'strong' || p.strength === 'very strong');
  const presentArrows = arrows.filter(a => a.present && a.type === 'positive');

  let analysis = 'Based on your Lo Shu Grid:\n\n';

  if (strongPlanets.length > 0) {
    analysis += `Strong Planetary Influences:\n`;
    strongPlanets.forEach(p => {
      const planetInfo = LOSHU_PLANETS[p.number as keyof typeof LOSHU_PLANETS];
      analysis += `- ${planetInfo.planet}: ${planetInfo.positive}\n`;
    });
    analysis += '\n';
  }

  if (presentArrows.length > 0) {
    analysis += `Active Arrows:\n`;
    presentArrows.forEach(a => {
      analysis += `- ${a.name}: ${a.impact}\n`;
    });
  }

  return analysis;
}

/**
 * Main function to calculate complete Lo Shu Grid
 */
export function calculateLoShuGrid(birthDate: Date, fullName?: string): LoShuGrid {
  const digits = extractDigits(birthDate);
  const grid = createLoShuGrid(digits);
  const { presentNumbers, missingNumbers, repeatedNumbers } = analyzeNumbers(digits);
  const planetaryRulers = analyzePlanetaryRulers(presentNumbers, repeatedNumbers);
  const arrows = analyzeArrows(presentNumbers);
  const planes = analyzePlanes(grid);
  const remedies = generateRemedies(missingNumbers);

  const mulank = calculateMulank(birthDate);
  const bhagyank = calculateBhagyank(birthDate);

  const dateString = `${birthDate.getDate()}-${birthDate.getMonth() + 1}-${birthDate.getFullYear()}`;

  // Generate analysis
  const personality = generatePersonalityAnalysis(planetaryRulers, arrows);

  const strongPlanets = planetaryRulers.filter(p => p.strength !== 'absent');
  const strengths = strongPlanets.map(p => {
    const info = LOSHU_PLANETS[p.number as keyof typeof LOSHU_PLANETS];
    return info.positive;
  });

  const weaknesses = missingNumbers.map(n => {
    const info = LOSHU_PLANETS[n as keyof typeof LOSHU_PLANETS];
    return `Lacks ${info.quality}`;
  });

  const career = strongPlanets.map(p => {
    const careerMap: { [key: string]: string } = {
      'Sun': 'Leadership, Government, Politics',
      'Moon': 'Arts, Hospitality, Counseling',
      'Jupiter': 'Teaching, Law, Philosophy',
      'Rahu': 'Technology, Research, Innovation',
      'Mercury': 'Communication, Business, Writing',
      'Venus': 'Arts, Fashion, Entertainment',
      'Ketu': 'Spirituality, Research, Healing',
      'Saturn': 'Engineering, Construction, Organization',
      'Mars': 'Military, Sports, Surgery',
    };
    return careerMap[p.planet] || 'General career';
  });

  const relationships = arrows.find(a => a.name === 'Emotional' && a.present)
    ? 'Emotionally intelligent. Good in relationships. Empathetic partner.'
    : 'May need to work on emotional expression. Practice empathy.';

  const health = missingNumbers.includes(1)
    ? ['Monitor heart and eye health', 'Need vitality boost']
    : missingNumbers.includes(8)
    ? ['Watch for bone and joint issues', 'Saturn-related health concerns']
    : ['Generally balanced health'];

  return {
    grid,
    birthDate,
    dateString,
    allNumbers: digits,
    presentNumbers,
    missingNumbers,
    repeatedNumbers,
    mulank,
    bhagyank,
    planetaryRulers,
    arrows,
    planes,
    strengths,
    weaknesses,
    personality,
    career,
    relationships,
    health,
    remedies,
  };
}

/**
 * Format grid for display
 */
export function formatGridDisplay(grid: number[][]): string {
  let display = '\nLo Shu Grid:\n';
  display += '┌───┬───┬───┐\n';

  for (let i = 0; i < 3; i++) {
    display += '│';
    for (let j = 0; j < 3; j++) {
      const count = grid[i][j];
      display += count > 0 ? ` ${count} ` : ' - ';
      display += '│';
    }
    display += '\n';
    if (i < 2) display += '├───┼───┼───┤\n';
  }

  display += '└───┴───┴───┘\n';
  display += ' 4   9   2\n';
  display += ' 3   5   7\n';
  display += ' 8   1   6\n';

  return display;
}

// ==================== EXPORT ALL ====================

export default {
  calculateLoShuGrid,
  calculateMulank,
  calculateBhagyank,
  extractDigits,
  createLoShuGrid,
  analyzeNumbers,
  analyzePlanetaryRulers,
  analyzeArrows,
  analyzePlanes,
  generateRemedies,
  formatGridDisplay,
  LOSHU_PLANETS,
  LOSHU_ARROWS,
};
