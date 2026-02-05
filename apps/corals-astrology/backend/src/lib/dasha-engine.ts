// =====================================================
// ADVANCED DASHA CALCULATION ENGINE
// Vimshottari, Yogini, Jaimini (Chara), and More
// Founded by Jyotish Acharya Rakesh Sharma
// =====================================================

// ==================== VIMSHOTTARI DASHA SYSTEM ====================

/**
 * The most popular dasha system in Vedic Astrology
 * Total cycle: 120 years
 * Based on Moon's nakshatra at birth
 */

export interface DashaPeriod {
  planet: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
  durationDays: number;
}

export interface Antardasha extends DashaPeriod {
  mahaDasha: string;
}

export interface Pratyantardasha extends DashaPeriod {
  mahaDasha: string;
  antarDasha: string;
}

export interface SookshmaDasha extends DashaPeriod {
  mahaDasha: string;
  antarDasha: string;
  pratyantarDasha: string;
}

export interface PranaDasha extends DashaPeriod {
  mahaDasha: string;
  antarDasha: string;
  pratyantarDasha: string;
  sookshmaDasha: string;
}

// Vimshottari Dasha Years for each planet
export const VIMSHOTTARI_YEARS: Record<string, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

// Dasha sequence in Vimshottari
export const VIMSHOTTARI_SEQUENCE = [
  'Ketu',
  'Venus',
  'Sun',
  'Moon',
  'Mars',
  'Rahu',
  'Jupiter',
  'Saturn',
  'Mercury',
];

// Nakshatra to Dasha Lord mapping
export const NAKSHATRA_DASHA_LORD: Record<number, string> = {
  1: 'Ketu',    // Ashwini
  2: 'Venus',   // Bharani
  3: 'Sun',     // Krittika
  4: 'Moon',    // Rohini
  5: 'Mars',    // Mrigashira
  6: 'Rahu',    // Ardra
  7: 'Jupiter', // Punarvasu
  8: 'Saturn',  // Pushya
  9: 'Mercury', // Ashlesha
  10: 'Ketu',   // Magha
  11: 'Venus',  // Purva Phalguni
  12: 'Sun',    // Uttara Phalguni
  13: 'Moon',   // Hasta
  14: 'Mars',   // Chitra
  15: 'Rahu',   // Swati
  16: 'Jupiter',// Vishakha
  17: 'Saturn', // Anuradha
  18: 'Mercury',// Jyeshtha
  19: 'Ketu',   // Mula
  20: 'Venus',  // Purva Ashadha
  21: 'Sun',    // Uttara Ashadha
  22: 'Moon',   // Shravana
  23: 'Mars',   // Dhanishta
  24: 'Rahu',   // Shatabhisha
  25: 'Jupiter',// Purva Bhadrapada
  26: 'Saturn', // Uttara Bhadrapada
  27: 'Mercury',// Revati
};

/**
 * Calculate the birth nakshatra from Moon's longitude
 */
export function calculateNakshatra(moonLongitude: number): {
  nakshatra: number;
  nakshatraName: string;
  pada: number;
  dashaLord: string;
  completedPortion: number; // 0 to 1
} {
  const NAKSHATRA_NAMES = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni',
    'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha',
    'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha',
    'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
    'Uttara Bhadrapada', 'Revati',
  ];

  const nakshatraLength = 360 / 27; // 13.333... degrees
  const nakshatraIndex = Math.floor(moonLongitude / nakshatraLength);
  const nakshatra = nakshatraIndex + 1;

  const nakshatraStart = nakshatraIndex * nakshatraLength;
  const completedPortion = (moonLongitude - nakshatraStart) / nakshatraLength;

  const padaLength = nakshatraLength / 4;
  const pada = Math.floor((moonLongitude - nakshatraStart) / padaLength) + 1;

  return {
    nakshatra,
    nakshatraName: NAKSHATRA_NAMES[nakshatraIndex],
    pada,
    dashaLord: NAKSHATRA_DASHA_LORD[nakshatra],
    completedPortion,
  };
}

/**
 * Calculate Vimshottari Mahadasha sequence from birth
 */
export function calculateMahaDashas(
  birthDate: Date,
  moonLongitude: number
): DashaPeriod[] {
  const { nakshatra, dashaLord, completedPortion } = calculateNakshatra(moonLongitude);

  const dashas: DashaPeriod[] = [];
  let currentDate = new Date(birthDate);

  // Find starting dasha index
  let startIndex = VIMSHOTTARI_SEQUENCE.indexOf(dashaLord);

  // Calculate balance of first dasha
  const firstDashaFullYears = VIMSHOTTARI_YEARS[dashaLord];
  const firstDashaRemainingYears = firstDashaFullYears * (1 - completedPortion);
  const firstDashaDays = Math.floor(firstDashaRemainingYears * 365.25);

  // Add first dasha (balance period)
  const firstDashaEnd = new Date(currentDate);
  firstDashaEnd.setDate(firstDashaEnd.getDate() + firstDashaDays);

  dashas.push({
    planet: dashaLord,
    startDate: new Date(currentDate),
    endDate: firstDashaEnd,
    durationYears: firstDashaRemainingYears,
    durationDays: firstDashaDays,
  });

  currentDate = new Date(firstDashaEnd);

  // Add remaining dashas in sequence
  for (let i = 1; i < 9; i++) {
    const planetIndex = (startIndex + i) % 9;
    const planet = VIMSHOTTARI_SEQUENCE[planetIndex];
    const years = VIMSHOTTARI_YEARS[planet];
    const days = Math.floor(years * 365.25);

    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + days);

    dashas.push({
      planet,
      startDate: new Date(currentDate),
      endDate,
      durationYears: years,
      durationDays: days,
    });

    currentDate = new Date(endDate);
  }

  return dashas;
}

/**
 * Calculate Antardashas (sub-periods) within a Mahadasha
 */
export function calculateAntarDashas(mahaDasha: DashaPeriod): Antardasha[] {
  const antarDashas: Antardasha[] = [];
  let currentDate = new Date(mahaDasha.startDate);

  const mahaPlanet = mahaDasha.planet;
  const mahaDashaIndex = VIMSHOTTARI_SEQUENCE.indexOf(mahaPlanet);

  const totalMahaDashaDays = mahaDasha.durationDays;

  for (let i = 0; i < 9; i++) {
    const antarPlanetIndex = (mahaDashaIndex + i) % 9;
    const antarPlanet = VIMSHOTTARI_SEQUENCE[antarPlanetIndex];

    const mahaYears = mahaDasha.durationYears;
    const antarYears = VIMSHOTTARI_YEARS[antarPlanet];

    // Antardasha duration = (Maha years × Antar years × 365.25) / 120
    const antarDays = Math.floor((mahaYears * antarYears * 365.25) / 120);

    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + antarDays);

    // Don't exceed Mahadasha end date
    if (endDate > mahaDasha.endDate) {
      endDate.setTime(mahaDasha.endDate.getTime());
    }

    antarDashas.push({
      planet: antarPlanet,
      mahaDasha: mahaPlanet,
      startDate: new Date(currentDate),
      endDate,
      durationYears: antarDays / 365.25,
      durationDays: antarDays,
    });

    currentDate = new Date(endDate);

    if (currentDate >= mahaDasha.endDate) break;
  }

  return antarDashas;
}

/**
 * Calculate Pratyantardashas (sub-sub-periods) within an Antardasha
 */
export function calculatePratyantarDashas(antarDasha: Antardasha): Pratyantardasha[] {
  const pratyantarDashas: Pratyantardasha[] = [];
  let currentDate = new Date(antarDasha.startDate);

  const antarPlanet = antarDasha.planet;
  const antarIndex = VIMSHOTTARI_SEQUENCE.indexOf(antarPlanet);

  for (let i = 0; i < 9; i++) {
    const pratyantarPlanetIndex = (antarIndex + i) % 9;
    const pratyantarPlanet = VIMSHOTTARI_SEQUENCE[pratyantarPlanetIndex];

    const antarYears = antarDasha.durationYears;
    const pratyantarYears = VIMSHOTTARI_YEARS[pratyantarPlanet];

    // Pratyantardasha = (Antar years × Pratyantardasha years × 365.25) / 120
    const pratyantarDays = Math.floor((antarYears * pratyantarYears * 365.25) / 120);

    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + pratyantarDays);

    if (endDate > antarDasha.endDate) {
      endDate.setTime(antarDasha.endDate.getTime());
    }

    pratyantarDashas.push({
      planet: pratyantarPlanet,
      mahaDasha: antarDasha.mahaDasha,
      antarDasha: antarPlanet,
      startDate: new Date(currentDate),
      endDate,
      durationYears: pratyantarDays / 365.25,
      durationDays: pratyantarDays,
    });

    currentDate = new Date(endDate);

    if (currentDate >= antarDasha.endDate) break;
  }

  return pratyantarDashas;
}

/**
 * Get current running Mahadasha, Antardasha, Pratyantardasha for a date
 */
export function getCurrentDashas(
  birthDate: Date,
  moonLongitude: number,
  currentDate: Date = new Date()
): {
  mahaDasha: DashaPeriod | null;
  antarDasha: Antardasha | null;
  pratyantarDasha: Pratyantardasha | null;
} {
  const mahaDashas = calculateMahaDashas(birthDate, moonLongitude);

  // Find current Mahadasha
  const currentMaha = mahaDashas.find(
    (dasha) => currentDate >= dasha.startDate && currentDate <= dasha.endDate
  );

  if (!currentMaha) {
    return { mahaDasha: null, antarDasha: null, pratyantarDasha: null };
  }

  // Find current Antardasha
  const antarDashas = calculateAntarDashas(currentMaha);
  const currentAntar = antarDashas.find(
    (dasha) => currentDate >= dasha.startDate && currentDate <= dasha.endDate
  );

  if (!currentAntar) {
    return { mahaDasha: currentMaha, antarDasha: null, pratyantarDasha: null };
  }

  // Find current Pratyantardasha
  const pratyantarDashas = calculatePratyantarDashas(currentAntar);
  const currentPratyantardasha = pratyantarDashas.find(
    (dasha) => currentDate >= dasha.startDate && currentDate <= dasha.endDate
  );

  return {
    mahaDasha: currentMaha,
    antarDasha: currentAntar,
    pratyantarDasha: currentPratyantardasha || null,
  };
}

// ==================== YOGINI DASHA SYSTEM ====================

/**
 * Yogini Dasha: 36-year cycle
 * Based on Moon's nakshatra
 */

export const YOGINI_DASHA_YEARS: Record<string, number> = {
  Mangala: 1,
  Pingala: 2,
  Dhanya: 3,
  Bhramari: 4,
  Bhadrika: 5,
  Ulka: 6,
  Siddha: 7,
  Sankata: 8,
};

export const YOGINI_SEQUENCE = [
  'Mangala',
  'Pingala',
  'Dhanya',
  'Bhramari',
  'Bhadrika',
  'Ulka',
  'Siddha',
  'Sankata',
];

export const NAKSHATRA_YOGINI: Record<number, string> = {
  1: 'Mangala',  // Ashwini
  2: 'Pingala',  // Bharani
  3: 'Dhanya',   // Krittika
  4: 'Bhramari', // Rohini
  5: 'Bhadrika', // Mrigashira
  6: 'Ulka',     // Ardra
  7: 'Siddha',   // Punarvasu
  8: 'Sankata',  // Pushya
  9: 'Mangala',  // Ashlesha
  10: 'Pingala', // Magha
  11: 'Dhanya',  // Purva Phalguni
  12: 'Bhramari',// Uttara Phalguni
  13: 'Bhadrika',// Hasta
  14: 'Ulka',    // Chitra
  15: 'Siddha',  // Swati
  16: 'Sankata', // Vishakha
  17: 'Mangala', // Anuradha
  18: 'Pingala', // Jyeshtha
  19: 'Dhanya',  // Mula
  20: 'Bhramari',// Purva Ashadha
  21: 'Bhadrika',// Uttara Ashadha
  22: 'Ulka',    // Shravana
  23: 'Siddha',  // Dhanishta
  24: 'Sankata', // Shatabhisha
  25: 'Mangala', // Purva Bhadrapada
  26: 'Pingala', // Uttara Bhadrapada
  27: 'Dhanya',  // Revati
};

// ==================== JAIMINI CHARA DASHA ====================

/**
 * Jaimini's Chara Dasha System
 * Based on sign-based calculations
 * Uses signs, not planets
 */

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export const CHARA_DASHA_YEARS: Record<ZodiacSign, number> = {
  Aries: 1,
  Taurus: 2,
  Gemini: 3,
  Cancer: 4,
  Leo: 5,
  Virgo: 6,
  Libra: 7,
  Scorpio: 8,
  Sagittarius: 9,
  Capricorn: 10,
  Aquarius: 11,
  Pisces: 12,
};

export interface CharaDasha {
  sign: ZodiacSign;
  startDate: Date;
  endDate: Date;
  durationYears: number;
  durationDays: number;
  isReverse: boolean; // Forward or reverse order
}

/**
 * Calculate if Chara Dasha runs in reverse (for even signs)
 */
export function isCharaDashaReverse(ascendantSign: ZodiacSign): boolean {
  const evenSigns: ZodiacSign[] = ['Taurus', 'Cancer', 'Virgo', 'Scorpio', 'Capricorn', 'Pisces'];
  return evenSigns.includes(ascendantSign);
}

/**
 * Calculate Jaimini Chara Dasha periods
 */
export function calculateCharaDashas(
  birthDate: Date,
  ascendantSign: ZodiacSign
): CharaDasha[] {
  const dashas: CharaDasha[] = [];
  let currentDate = new Date(birthDate);

  const signs = Object.keys(CHARA_DASHA_YEARS) as ZodiacSign[];
  const startIndex = signs.indexOf(ascendantSign);
  const isReverse = isCharaDashaReverse(ascendantSign);

  for (let i = 0; i < 12; i++) {
    let signIndex: number;

    if (isReverse) {
      signIndex = (startIndex - i + 12) % 12;
    } else {
      signIndex = (startIndex + i) % 12;
    }

    const sign = signs[signIndex];
    const years = CHARA_DASHA_YEARS[sign];
    const days = Math.floor(years * 365.25);

    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + days);

    dashas.push({
      sign,
      startDate: new Date(currentDate),
      endDate,
      durationYears: years,
      durationDays: days,
      isReverse,
    });

    currentDate = new Date(endDate);
  }

  return dashas;
}

// ==================== ASHTOTTARI DASHA ====================

/**
 * Ashtottari Dasha: 108-year cycle
 * Used when Rahu is NOT in Lagna (1st), 7th, or 9th house
 */

export const ASHTOTTARI_YEARS: Record<string, number> = {
  Sun: 6,
  Moon: 15,
  Mars: 8,
  Mercury: 17,
  Saturn: 10,
  Jupiter: 19,
  Rahu: 12,
  Venus: 21,
};

export const ASHTOTTARI_SEQUENCE = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Saturn',
  'Jupiter',
  'Rahu',
  'Venus',
];

// ==================== KALACHAKRA DASHA ====================

/**
 * Kalachakra Dasha: Time-wheel dasha
 * Specialized for timing events
 */

export const KALACHAKRA_YEARS: Record<string, number> = {
  Sun: 4,
  Moon: 4,
  Mars: 4,
  Mercury: 4,
  Jupiter: 4,
  Venus: 4,
  Saturn: 4,
  Rahu: 4,
  Ketu: 4,
};

// ==================== DASHA EFFECTS & PREDICTIONS ====================

export interface DashaEffect {
  planet: string;
  positiveEffects: string[];
  negativeEffects: string[];
  remedies: string[];
  lifeAreas: string[];
}

export const DASHA_EFFECTS: Record<string, DashaEffect> = {
  Sun: {
    planet: 'Sun',
    positiveEffects: [
      'Career advancement and recognition',
      'Government favor and authority',
      'Leadership opportunities',
      'Improved health and vitality',
      'Father\'s blessings',
      'Success in politics or administration',
    ],
    negativeEffects: [
      'Ego clashes with authority',
      'Health issues (heart, eyes, bones)',
      'Conflicts with father',
      'Over-confidence leading to failures',
      'Heat-related problems',
    ],
    remedies: [
      'Chant Gayatri Mantra',
      'Surya Namaskar daily',
      'Wear Ruby (3-5 carats)',
      'Donate wheat, jaggery on Sundays',
      'Offer water to Sun at sunrise',
    ],
    lifeAreas: ['Career', 'Authority', 'Father', 'Health', 'Vitality'],
  },

  Moon: {
    planet: 'Moon',
    positiveEffects: [
      'Emotional stability and peace',
      'Good relationship with mother',
      'Improved mental health',
      'Travel opportunities (especially water)',
      'Public recognition and popularity',
      'Intuition and psychic abilities',
    ],
    negativeEffects: [
      'Mood swings and depression',
      'Digestive problems',
      'Insomnia and anxiety',
      'Conflicts with mother',
      'Over-sensitivity',
      'Hormonal imbalances',
    ],
    remedies: [
      'Chant Chandra Mantra',
      'Wear Pearl (5-7 carats)',
      'Donate white rice, milk on Mondays',
      'Fast on Mondays',
      'Keep silver near water',
    ],
    lifeAreas: ['Mind', 'Mother', 'Emotions', 'Public', 'Travel'],
  },

  Mars: {
    planet: 'Mars',
    positiveEffects: [
      'Courage and confidence',
      'Victory over enemies and competition',
      'Success in sports and physical activities',
      'Property and land acquisition',
      'Good relationship with siblings',
      'Energy and stamina',
    ],
    negativeEffects: [
      'Accidents and injuries',
      'Conflicts and aggression',
      'Blood disorders',
      'Property disputes',
      'Surgical operations',
      'Impulsiveness',
    ],
    remedies: [
      'Chant Mangal Mantra',
      'Wear Red Coral (6-9 carats)',
      'Donate red lentils on Tuesdays',
      'Hanuman Chalisa recitation',
      'Avoid spicy food and anger',
    ],
    lifeAreas: ['Courage', 'Property', 'Siblings', 'Energy', 'Competition'],
  },

  Mercury: {
    planet: 'Mercury',
    positiveEffects: [
      'Intelligence and communication skills',
      'Business and trade success',
      'Education and learning',
      'Writing and speaking abilities',
      'Good friendships',
      'Technology and mathematics',
    ],
    negativeEffects: [
      'Nervous disorders',
      'Speech problems',
      'Skin diseases',
      'Business losses',
      'Over-thinking and anxiety',
      'Respiratory issues',
    ],
    remedies: [
      'Chant Budh Mantra',
      'Wear Emerald (3-5 carats)',
      'Donate green vegetables on Wednesdays',
      'Read spiritual books',
      'Help students and teachers',
    ],
    lifeAreas: ['Communication', 'Business', 'Education', 'Friends', 'Skills'],
  },

  Jupiter: {
    planet: 'Jupiter',
    positiveEffects: [
      'Wealth and prosperity',
      'Spiritual growth and wisdom',
      'Marriage and children',
      'Higher education',
      'Good luck and fortune',
      'Teacher\'s blessings',
    ],
    negativeEffects: [
      'Over-optimism and complacency',
      'Weight gain and diabetes',
      'Financial over-expansion',
      'Liver problems',
      'Delays in marriage or children',
    ],
    remedies: [
      'Chant Guru Mantra',
      'Wear Yellow Sapphire (3-5 carats)',
      'Donate yellow items on Thursdays',
      'Respect teachers and elders',
      'Study scriptures',
    ],
    lifeAreas: ['Wealth', 'Marriage', 'Children', 'Wisdom', 'Fortune'],
  },

  Venus: {
    planet: 'Venus',
    positiveEffects: [
      'Love and romance',
      'Material comforts and luxury',
      'Artistic talents',
      'Beauty and attractiveness',
      'Vehicle acquisition',
      'Happy married life',
    ],
    negativeEffects: [
      'Relationship problems',
      'Over-indulgence in pleasures',
      'Kidney and reproductive issues',
      'Extravagance',
      'Laziness',
      'Diabetes',
    ],
    remedies: [
      'Chant Shukra Mantra',
      'Wear Diamond/White Sapphire (1 carat)',
      'Donate white items on Fridays',
      'Worship Goddess Lakshmi',
      'Maintain cleanliness',
    ],
    lifeAreas: ['Love', 'Luxury', 'Art', 'Marriage', 'Comfort'],
  },

  Saturn: {
    planet: 'Saturn',
    positiveEffects: [
      'Discipline and hard work rewards',
      'Spiritual progress',
      'Justice in legal matters',
      'Longevity',
      'Servant leadership',
      'Detachment and wisdom',
    ],
    negativeEffects: [
      'Delays and obstacles',
      'Depression and isolation',
      'Joint and bone problems',
      'Career setbacks',
      'Loss and separation',
      'Chronic diseases',
    ],
    remedies: [
      'Chant Shani Mantra',
      'Wear Blue Sapphire (ONLY after trial - 3 days)',
      'Donate black sesame, iron on Saturdays',
      'Serve poor and handicapped',
      'Hanuman worship',
    ],
    lifeAreas: ['Discipline', 'Karma', 'Hardship', 'Longevity', 'Service'],
  },

  Rahu: {
    planet: 'Rahu',
    positiveEffects: [
      'Sudden gains and lottery',
      'Foreign travel and settlement',
      'Political success',
      'Research and innovation',
      'Unconventional career success',
      'Technology expertise',
    ],
    negativeEffects: [
      'Confusion and deception',
      'Addictions',
      'Illusions and hallucinations',
      'Skin diseases and allergies',
      'Sudden losses',
      'Mental instability',
    ],
    remedies: [
      'Chant Rahu Mantra',
      'Wear Hessonite (5-8 carats)',
      'Donate mustard oil on Saturdays',
      'Durga worship',
      'Avoid alcohol and drugs',
    ],
    lifeAreas: ['Foreign', 'Technology', 'Politics', 'Sudden Events', 'Illusion'],
  },

  Ketu: {
    planet: 'Ketu',
    positiveEffects: [
      'Spiritual liberation (Moksha)',
      'Occult and psychic abilities',
      'Detachment from materialism',
      'Healing powers',
      'Past life wisdom',
      'Research abilities',
    ],
    negativeEffects: [
      'Confusion about life direction',
      'Isolation and loneliness',
      'Mysterious diseases',
      'Accidents',
      'Loss of interest in worldly affairs',
      'Digestive problems',
    ],
    remedies: [
      'Chant Ketu Mantra',
      'Wear Cat\'s Eye (5-7 carats)',
      'Donate sesame, blankets on Tuesdays',
      'Ganesha worship',
      'Meditation and yoga',
    ],
    lifeAreas: ['Spirituality', 'Moksha', 'Occult', 'Detachment', 'Healing'],
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Format dasha period for display
 */
export function formatDashaPeriod(dasha: DashaPeriod): string {
  const years = Math.floor(dasha.durationYears);
  const remainingDays = dasha.durationDays - (years * 365);
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;

  return `${years}Y ${months}M ${days}D`;
}

/**
 * Get dasha interpretation
 */
export function interpretDasha(planet: string): string {
  const effect = DASHA_EFFECTS[planet];
  if (!effect) return 'No interpretation available';

  return `During ${planet} dasha, expect focus on: ${effect.lifeAreas.join(', ')}.
Positive: ${effect.positiveEffects.slice(0, 2).join('; ')}.
Watch for: ${effect.negativeEffects.slice(0, 2).join('; ')}.`;
}

/**
 * Check if current dasha is favorable based on planet strength
 */
export function isDashaFavorable(planet: string, planetStrength: number): boolean {
  // planetStrength: 0-100 scale
  return planetStrength >= 60;
}

// ==================== EXPORT ALL ====================

export default {
  calculateNakshatra,
  calculateMahaDashas,
  calculateAntarDashas,
  calculatePratyantarDashas,
  getCurrentDashas,
  calculateCharaDashas,
  formatDashaPeriod,
  interpretDasha,
  isDashaFavorable,
  VIMSHOTTARI_YEARS,
  VIMSHOTTARI_SEQUENCE,
  YOGINI_DASHA_YEARS,
  CHARA_DASHA_YEARS,
  DASHA_EFFECTS,
};
