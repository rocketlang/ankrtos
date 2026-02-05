/**
 * Complete Kundli/Birth Chart Engine
 * Comprehensive Vedic astrology birth chart analysis with life predictions
 */

import {
  detectAllDoshas,
  DoshaAnalysis,
  analyzeCrossKundliCompatibility,
  getAllMantras,
  getPilgrimageGuides,
  getBhriguSamhitaPrediction,
  MantraDetails,
  PilgrimageGuide
} from './dosha-remedies-engine';

export interface BirthDetails {
  name: string;
  dateOfBirth: Date;
  timeOfBirth: string; // HH:MM format
  placeOfBirth: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  gender: 'male' | 'female';
}

export interface CompleteKundli {
  personalInfo: PersonalInfo;
  birthChart: BirthChart;
  planetaryPositions: PlanetaryPosition[];
  houseAnalysis: HouseAnalysis[];
  ascendantAnalysis: AscendantAnalysis;
  yogas: Yoga[];
  dashas: DashaSystem;
  lifePredictions: LifePredictions;
  doshaAnalysis: DoshaAnalysis; // NEW: Comprehensive dosha detection
  remedies: Remedy[];
  luckyElements: LuckyElements;
  strengths: string[];
  challenges: string[];
  bhriguSamhitaInsight: string; // NEW: Bhrigu Samhita predictions
  allMantras: MantraDetails[]; // NEW: All mantras with details
  pilgrimageGuides: PilgrimageGuide[]; // NEW: Temple pilgrimage information
}

interface PersonalInfo {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  age: number;
  gender: 'male' | 'female';
}

export interface BirthChart {
  ascendant: string; // Rising sign
  moonSign: string;
  sunSign: string;
  houses: House[];
  chartType: 'North Indian' | 'South Indian';
}

interface House {
  number: number;
  sign: string;
  lord: string;
  planets: string[];
  aspects: string[];
  strength: number;
  significance: string;
}

export interface PlanetaryPosition {
  planet: string;
  sign: string;
  house: number;
  degree: number;
  retrograde: boolean;
  dignity: 'Exalted' | 'Own Sign' | 'Friendly' | 'Neutral' | 'Debilitated' | 'Enemy';
  strength: number; // 0-100
  effects: string[];
}

interface HouseAnalysis {
  house: number;
  lord: string;
  lordPosition: string;
  significance: string[];
  predictions: string[];
  rating: number;
}

interface AscendantAnalysis {
  sign: string;
  lord: string;
  degree: number;
  personality: string[];
  physicalTraits: string[];
  mentalTraits: string[];
  lifeApproach: string;
}

interface Yoga {
  name: string;
  type: 'Raja Yoga' | 'Dhana Yoga' | 'Vipreet Yoga' | 'Kemadruma Yoga' | 'Other';
  planets: string[];
  description: string;
  effects: string[];
  strength: 'Strong' | 'Moderate' | 'Weak';
  timing: string;
}

interface DashaSystem {
  type: 'Vimshottari';
  currentDasha: DashaPeriod;
  upcomingDashas: DashaPeriod[];
  antardasha: DashaPeriod;
}

interface DashaPeriod {
  planet: string;
  startDate: Date;
  endDate: Date;
  duration: string;
  predictions: string[];
  rating: number;
  focus: string[];
  opportunities: string[];
  challenges: string[];
}

interface LifePredictions {
  career: CareerPrediction;
  marriage: MarriagePrediction;
  health: HealthPrediction;
  wealth: WealthPrediction;
  education: EducationPrediction;
  family: FamilyPrediction;
  foreignTravel: ForeignTravelPrediction;
  spirituality: SpiritualityPrediction;
}

interface CareerPrediction {
  suitableFields: string[];
  successPeriods: Period[];
  challengingPeriods: Period[];
  businessOrJob: string;
  peakAge: string;
  predictions: string[];
  recommendations: string[];
}

interface MarriagePrediction {
  timing: string;
  spouseCharacteristics: string[];
  marriageHappiness: string;
  childrenPrediction: string;
  relationshipAdvice: string[];
  favorablePeriods: Period[];
}

interface HealthPrediction {
  generalHealth: string;
  vulnerableAreas: string[];
  strongAreas: string[];
  criticalPeriods: Period[];
  longevity: string;
  healthAdvice: string[];
}

interface WealthPrediction {
  financialStability: string;
  wealthSources: string[];
  peakWealthPeriod: string;
  savingsAbility: string;
  inheritance: string;
  financialAdvice: string[];
}

interface EducationPrediction {
  academicStrength: string;
  suitableFields: string[];
  higherEducation: string;
  focusPeriods: Period[];
  studyAdvice: string[];
}

interface FamilyPrediction {
  parentsRelation: string;
  siblingsRelation: string;
  familySupport: string;
  ancestralProperty: string;
  familyAdvice: string[];
}

interface ForeignTravelPrediction {
  likelihood: string;
  favorablePeriods: Period[];
  purposes: string[];
  settlement: string;
}

interface SpiritualityPrediction {
  spiritualInclination: string;
  enlightenmentPath: string;
  religiousObservance: string;
  spiritualPractices: string[];
}

interface Period {
  description: string;
  timeframe: string;
}

interface Remedy {
  type: 'Gemstone' | 'Mantra' | 'Pooja' | 'Charity' | 'Fasting' | 'Yantra';
  planet: string;
  item: string;
  procedure: string;
  benefit: string;
  cost?: string;
  frequency: string;
}

interface LuckyElements {
  numbers: number[];
  colors: string[];
  days: string[];
  directions: string[];
  gemstones: string[];
}

// Zodiac signs
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Planetary lords of signs
const SIGN_LORDS: Record<string, string> = {
  'Aries': 'Mars',
  'Taurus': 'Venus',
  'Gemini': 'Mercury',
  'Cancer': 'Moon',
  'Leo': 'Sun',
  'Virgo': 'Mercury',
  'Libra': 'Venus',
  'Scorpio': 'Mars',
  'Sagittarius': 'Jupiter',
  'Capricorn': 'Saturn',
  'Aquarius': 'Saturn',
  'Pisces': 'Jupiter',
};

/**
 * Generate complete Kundli report
 */
export function generateCompleteKundli(birthDetails: BirthDetails): CompleteKundli {
  // Calculate basic chart elements
  const birthChart = calculateBirthChart(birthDetails);
  const planetaryPositions = calculatePlanetaryPositions(birthDetails);
  const houseAnalysis = analyzeHouses(birthChart, planetaryPositions);
  const ascendantAnalysis = analyzeAscendant(birthChart.ascendant);
  const yogas = detectYogas(planetaryPositions, birthChart);
  const dashas = calculateDashaSystem(birthDetails, planetaryPositions);
  const lifePredictions = generateLifePredictions(birthChart, planetaryPositions, dashas);

  // NEW: Comprehensive Dosha Analysis
  const doshaAnalysis = detectAllDoshas(planetaryPositions, birthChart, birthDetails);

  const remedies = generateRemedies(planetaryPositions, yogas);
  const luckyElements = generateLuckyElements(birthChart);
  const strengths = identifyStrengths(planetaryPositions, yogas);
  const challenges = identifyChallenges(planetaryPositions, yogas);

  // NEW: Bhrigu Samhita Predictions
  const bhriguSamhitaInsight = getBhriguSamhitaPrediction(planetaryPositions, birthChart);

  // NEW: All Mantras and Pilgrimage Guides
  const allMantras = getAllMantras();
  const pilgrimageGuides = getPilgrimageGuides();

  return {
    personalInfo: {
      name: birthDetails.name,
      dateOfBirth: birthDetails.dateOfBirth.toLocaleDateString('en-IN'),
      timeOfBirth: birthDetails.timeOfBirth,
      placeOfBirth: `${birthDetails.placeOfBirth.city}, ${birthDetails.placeOfBirth.country}`,
      age: calculateAge(birthDetails.dateOfBirth),
      gender: birthDetails.gender,
    },
    birthChart,
    planetaryPositions,
    houseAnalysis,
    ascendantAnalysis,
    yogas,
    dashas,
    lifePredictions,
    doshaAnalysis,
    remedies,
    luckyElements,
    strengths,
    challenges,
    bhriguSamhitaInsight,
    allMantras,
    pilgrimageGuides,
  };
}

/**
 * Calculate birth chart with houses and ascendant
 */
function calculateBirthChart(birthDetails: BirthDetails): BirthChart {
  // Simplified calculation - in production, use Swiss Ephemeris
  const birthTime = parseInt(birthDetails.timeOfBirth.split(':')[0]);
  const birthMonth = birthDetails.dateOfBirth.getMonth();

  // Calculate ascendant based on time and date (simplified)
  const ascendantIndex = (birthTime + birthMonth) % 12;
  const ascendant = ZODIAC_SIGNS[ascendantIndex];

  // Calculate moon sign (simplified)
  const moonSignIndex = (birthDetails.dateOfBirth.getDate() + birthMonth) % 12;
  const moonSign = ZODIAC_SIGNS[moonSignIndex];

  // Calculate sun sign (simplified)
  const sunSignIndex = birthMonth % 12;
  const sunSign = ZODIAC_SIGNS[sunSignIndex];

  // Generate houses
  const houses: House[] = [];
  for (let i = 1; i <= 12; i++) {
    const signIndex = (ascendantIndex + i - 1) % 12;
    const sign = ZODIAC_SIGNS[signIndex];
    const lord = SIGN_LORDS[sign];

    houses.push({
      number: i,
      sign,
      lord,
      planets: [], // Will be populated by planetary positions
      aspects: [],
      strength: 60 + Math.floor(Math.random() * 40),
      significance: getHouseSignificance(i),
    });
  }

  return {
    ascendant,
    moonSign,
    sunSign,
    houses,
    chartType: 'North Indian',
  };
}

/**
 * Calculate planetary positions
 */
function calculatePlanetaryPositions(birthDetails: BirthDetails): PlanetaryPosition[] {
  const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

  return planets.map((planet, index) => {
    const signIndex = (birthDetails.dateOfBirth.getMonth() + index) % 12;
    const sign = ZODIAC_SIGNS[signIndex];
    const house = (index + 1) % 12 + 1;
    const degree = Math.floor(Math.random() * 30);
    const retrograde = Math.random() > 0.8; // 20% chance

    return {
      planet,
      sign,
      house,
      degree,
      retrograde,
      dignity: calculateDignity(planet, sign),
      strength: 50 + Math.floor(Math.random() * 50),
      effects: getPlanetaryEffects(planet, sign, house),
    };
  });
}

/**
 * Calculate planetary dignity
 */
function calculateDignity(planet: string, sign: string): 'Exalted' | 'Own Sign' | 'Friendly' | 'Neutral' | 'Debilitated' | 'Enemy' {
  const exaltations: Record<string, string> = {
    'Sun': 'Aries',
    'Moon': 'Taurus',
    'Mars': 'Capricorn',
    'Mercury': 'Virgo',
    'Jupiter': 'Cancer',
    'Venus': 'Pisces',
    'Saturn': 'Libra',
  };

  if (exaltations[planet] === sign) return 'Exalted';
  if (SIGN_LORDS[sign] === planet) return 'Own Sign';

  // Simplified - in reality, check planetary friendships
  return 'Neutral';
}

/**
 * Get planetary effects based on position
 */
function getPlanetaryEffects(planet: string, sign: string, house: number): string[] {
  const effects: Record<string, string[]> = {
    'Sun': ['Leadership qualities', 'Confidence', 'Authority', 'Father figure influence'],
    'Moon': ['Emotional nature', 'Mental peace', 'Mother influence', 'Public relations'],
    'Mars': ['Energy and courage', 'Property matters', 'Siblings', 'Technical skills'],
    'Mercury': ['Intelligence', 'Communication', 'Business acumen', 'Analytical mind'],
    'Jupiter': ['Wisdom', 'Good fortune', 'Spiritual growth', 'Higher education'],
    'Venus': ['Relationships', 'Artistic talents', 'Luxury', 'Marital happiness'],
    'Saturn': ['Discipline', 'Hard work', 'Delays but permanence', 'Karmic lessons'],
    'Rahu': ['Ambition', 'Foreign connections', 'Sudden changes', 'Technology'],
    'Ketu': ['Spirituality', 'Detachment', 'Past life karma', 'Research abilities'],
  };

  return effects[planet] || [];
}

/**
 * Analyze houses
 */
function analyzeHouses(birthChart: BirthChart, positions: PlanetaryPosition[]): HouseAnalysis[] {
  const analyses: HouseAnalysis[] = [];

  for (const house of birthChart.houses) {
    const planetsInHouse = positions.filter(p => p.house === house.number).map(p => p.planet);

    analyses.push({
      house: house.number,
      lord: house.lord,
      lordPosition: 'To be calculated',
      significance: getHouseSignificances(house.number),
      predictions: getHousePredictions(house.number, planetsInHouse),
      rating: house.strength / 20, // Convert to 1-5
    });
  }

  return analyses;
}

/**
 * Get house significance
 */
function getHouseSignificance(houseNumber: number): string {
  const significances: Record<number, string> = {
    1: 'Self, Personality, Health, Appearance',
    2: 'Wealth, Family, Speech, Food',
    3: 'Siblings, Courage, Short Travels, Communication',
    4: 'Mother, Home, Vehicles, Education, Happiness',
    5: 'Children, Intelligence, Romance, Speculation',
    6: 'Health Issues, Enemies, Debts, Service',
    7: 'Marriage, Partnerships, Business, Spouse',
    8: 'Longevity, Transformation, Inheritance, Occult',
    9: 'Fortune, Father, Religion, Higher Education, Long Journeys',
    10: 'Career, Status, Authority, Profession',
    11: 'Gains, Income, Friends, Fulfillment of Desires',
    12: 'Losses, Expenses, Foreign Lands, Spirituality, Isolation',
  };

  return significances[houseNumber] || '';
}

/**
 * Get detailed house significances
 */
function getHouseSignificances(houseNumber: number): string[] {
  const details: Record<number, string[]> = {
    1: ['Physical appearance and health', 'Personality and character', 'General life direction', 'Self-confidence'],
    2: ['Family wealth and possessions', 'Speech and voice', 'Food habits', 'Early childhood'],
    3: ['Siblings and their well-being', 'Courage and valor', 'Short distance travels', 'Communication skills'],
    4: ['Mother and maternal happiness', 'Home and real estate', 'Vehicles and conveyances', 'Inner happiness'],
    5: ['Children and progeny', 'Romance and love affairs', 'Intelligence and wisdom', 'Creative expression'],
    6: ['Health problems and diseases', 'Enemies and obstacles', 'Debts and litigation', 'Service and employment'],
    7: ['Marriage and spouse', 'Business partnerships', 'Foreign travels for business', 'Public image'],
    8: ['Longevity and death', 'Sudden events and transformations', 'Inheritance and legacies', 'Occult knowledge'],
    9: ['Fortune and luck', 'Father and paternal influence', 'Higher education and philosophy', 'Long journeys abroad'],
    10: ['Career and profession', 'Status and fame', 'Authority and power', 'Government connections'],
    11: ['Income and gains', 'Fulfillment of desires', 'Friends and social circle', 'Elder siblings'],
    12: ['Expenses and losses', 'Foreign residence', 'Spiritual liberation', 'Isolation and solitude'],
  };

  return details[houseNumber] || [];
}

/**
 * Get house predictions based on planets
 */
function getHousePredictions(houseNumber: number, planets: string[]): string[] {
  if (planets.length === 0) {
    return ['House is empty but receives aspects from other planets'];
  }

  const predictions: string[] = [];

  if (planets.includes('Jupiter')) {
    predictions.push('Jupiter brings expansion and growth to this area');
  }
  if (planets.includes('Saturn')) {
    predictions.push('Saturn may cause delays but ensures lasting results');
  }
  if (planets.includes('Mars')) {
    predictions.push('Mars provides energy and courage in this domain');
  }

  return predictions.length > 0 ? predictions : ['Positive influences from planetary positions'];
}

/**
 * Analyze ascendant
 */
function analyzeAscendant(ascendant: string): AscendantAnalysis {
  const analyses: Record<string, any> = {
    'Aries': {
      personality: ['Dynamic and energetic', 'Natural leader', 'Impulsive decision maker', 'Competitive spirit'],
      physicalTraits: ['Athletic build', 'Sharp features', 'Good height', 'Energetic appearance'],
      mentalTraits: ['Quick thinking', 'Courageous', 'Sometimes impatient', 'Action-oriented'],
      lifeApproach: 'Direct and straightforward approach to life. Takes initiative but needs to develop patience.',
    },
    'Taurus': {
      personality: ['Stable and reliable', 'Practical nature', 'Patient and persistent', 'Appreciation for beauty'],
      physicalTraits: ['Strong build', 'Attractive features', 'Good complexion', 'Pleasant voice'],
      mentalTraits: ['Patient thinker', 'Stubborn at times', 'Practical approach', 'Sensory oriented'],
      lifeApproach: 'Steady and methodical progress. Values security and comfort. Loyal and dependable.',
    },
    // Add more signs...
  };

  const defaultAnalysis = {
    personality: ['Unique personality traits', 'Balanced approach', 'Good interpersonal skills'],
    physicalTraits: ['Healthy appearance', 'Good features', 'Average build'],
    mentalTraits: ['Analytical mind', 'Balanced thinking', 'Good memory'],
    lifeApproach: 'Balanced approach to life with focus on personal growth.',
  };

  const analysis = analyses[ascendant] || defaultAnalysis;

  return {
    sign: ascendant,
    lord: SIGN_LORDS[ascendant],
    degree: 15, // Simplified
    ...analysis,
  };
}

/**
 * Detect yogas (planetary combinations)
 */
function detectYogas(positions: PlanetaryPosition[], chart: BirthChart): Yoga[] {
  const yogas: Yoga[] = [];

  // Example: Raja Yoga (lords of trine and angle together)
  yogas.push({
    name: 'Gajakesari Yoga',
    type: 'Raja Yoga',
    planets: ['Jupiter', 'Moon'],
    description: 'Jupiter and Moon in mutual angle creates this auspicious yoga',
    effects: ['Fame and recognition', 'Wealth and prosperity', 'Good character', 'Leadership abilities'],
    strength: 'Strong',
    timing: 'Active during Jupiter and Moon dasha periods',
  });

  // Add more yogas based on actual calculations

  return yogas;
}

/**
 * Calculate Vimshottari Dasha system
 */
function calculateDashaSystem(birthDetails: BirthDetails, positions: PlanetaryPosition[]): DashaSystem {
  const now = new Date();
  const birthDate = birthDetails.dateOfBirth;

  // Simplified dasha calculation
  const dashaLords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
  const dashaYears = [7, 20, 6, 10, 7, 18, 16, 19, 17];

  // Current dasha (simplified)
  const currentDashaIndex = 4; // Mars for example
  const currentDasha: DashaPeriod = {
    planet: dashaLords[currentDashaIndex],
    startDate: new Date(now.getFullYear() - 1, 0, 1),
    endDate: new Date(now.getFullYear() + dashaYears[currentDashaIndex] - 1, 11, 31),
    duration: `${dashaYears[currentDashaIndex]} years`,
    predictions: [
      'Period of action and energy',
      'Good for property matters',
      'Focus on career advancement',
      'Watch for impulsive decisions',
    ],
    rating: 4,
    focus: ['Career', 'Property', 'Courage'],
    opportunities: ['Real estate gains', 'Leadership roles', 'New ventures'],
    challenges: ['Conflicts possible', 'Need patience', 'Health care needed'],
  };

  // Upcoming dashas
  const upcomingDashas: DashaPeriod[] = [];
  let startYear = now.getFullYear() + dashaYears[currentDashaIndex];

  for (let i = (currentDashaIndex + 1) % 9; upcomingDashas.length < 3; i = (i + 1) % 9) {
    upcomingDashas.push({
      planet: dashaLords[i],
      startDate: new Date(startYear, 0, 1),
      endDate: new Date(startYear + dashaYears[i] - 1, 11, 31),
      duration: `${dashaYears[i]} years`,
      predictions: [`${dashaLords[i]} dasha brings its characteristic results`],
      rating: 3,
      focus: ['To be analyzed'],
      opportunities: ['Period specific opportunities'],
      challenges: ['Period specific challenges'],
    });
    startYear += dashaYears[i];
  }

  return {
    type: 'Vimshottari',
    currentDasha,
    upcomingDashas,
    antardasha: {
      planet: 'Moon',
      startDate: now,
      endDate: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()),
      duration: '3 months',
      predictions: ['Sub-period of emotional focus'],
      rating: 3,
      focus: ['Emotions', 'Family'],
      opportunities: ['Family bonding'],
      challenges: ['Mood fluctuations'],
    },
  };
}

/**
 * Generate comprehensive life predictions
 */
function generateLifePredictions(
  chart: BirthChart,
  positions: PlanetaryPosition[],
  dashas: DashaSystem
): LifePredictions {
  return {
    career: {
      suitableFields: [
        'Technology and IT',
        'Business and Finance',
        'Education and Teaching',
        'Government Service',
      ],
      successPeriods: [
        { description: 'Major career breakthrough', timeframe: 'Age 28-35' },
        { description: 'Peak professional period', timeframe: 'Age 40-50' },
      ],
      challengingPeriods: [
        { description: 'Career uncertainty', timeframe: 'Age 25-27' },
      ],
      businessOrJob: 'Both suitable, but business after age 30 is highly favorable',
      peakAge: '38-45 years',
      predictions: [
        'Strong career growth indicated',
        'Leadership positions likely',
        'International opportunities possible',
        'Multiple income sources',
      ],
      recommendations: [
        'Focus on skill development',
        'Build strong professional network',
        'Consider entrepreneurship after age 30',
        'Invest in continuous learning',
      ],
    },
    marriage: {
      timing: 'Age 25-28 for favorable marriage',
      spouseCharacteristics: [
        'Well-educated partner',
        'Supportive and understanding nature',
        'From good family background',
        'Spiritual inclination',
      ],
      marriageHappiness: 'Very good marital happiness indicated. Minor adjustments needed initially.',
      childrenPrediction: '2-3 children, first child likely to be successful',
      relationshipAdvice: [
        'Communicate openly with partner',
        'Respect each other\'s space',
        'Maintain work-life balance',
        'Celebrate small moments together',
      ],
      favorablePeriods: [
        { description: 'Best time for marriage', timeframe: 'This year to next 2 years' },
      ],
    },
    health: {
      generalHealth: 'Generally good health with strong immunity',
      vulnerableAreas: ['Digestive system', 'Stress-related issues'],
      strongAreas: ['Heart', 'Bones', 'Overall vitality'],
      criticalPeriods: [
        { description: 'Extra care needed for health', timeframe: 'Age 42-44' },
      ],
      longevity: 'Long and healthy life indicated with proper care',
      healthAdvice: [
        'Regular exercise routine essential',
        'Yoga and meditation highly beneficial',
        'Avoid excessive oily and spicy food',
        'Regular health check-ups after age 40',
        'Adequate sleep crucial',
      ],
    },
    wealth: {
      financialStability: 'Excellent financial prospects with multiple income sources',
      wealthSources: [
        'Salary/Business income',
        'Property investments',
        'Stock market gains',
        'Inheritance possible',
      ],
      peakWealthPeriod: 'Age 38-55 years',
      savingsAbility: 'Good savings ability. Tendency to invest wisely.',
      inheritance: 'Likely to receive ancestral property or wealth',
      financialAdvice: [
        'Start investing early in life',
        'Diversify investments',
        'Real estate investments favorable',
        'Avoid risky speculations before age 35',
        'Build emergency fund',
        'Plan for retirement systematically',
      ],
    },
    education: {
      academicStrength: 'Strong academic abilities, especially in technical/scientific subjects',
      suitableFields: [
        'Engineering and Technology',
        'Science and Research',
        'Business Administration',
        'Medicine and Healthcare',
      ],
      higherEducation: 'Masters or PhD education indicated and beneficial',
      focusPeriods: [
        { description: 'Best period for higher studies', timeframe: 'Age 22-26' },
      ],
      studyAdvice: [
        'Pursue higher education for career growth',
        'Foreign education opportunities likely',
        'Research-oriented fields suit you',
        'Continuous learning mindset important',
      ],
    },
    family: {
      parentsRelation: 'Good relationship with parents, especially with mother',
      siblingsRelation: 'Supportive siblings, may need to help them occasionally',
      familySupport: 'Strong family support throughout life',
      ancestralProperty: 'Likely to benefit from ancestral property',
      familyAdvice: [
        'Maintain close family bonds',
        'Respect elders for blessings',
        'Support siblings when needed',
        'Create happy memories together',
      ],
    },
    foreignTravel: {
      likelihood: 'High probability of foreign travel and possible settlement',
      favorablePeriods: [
        { description: 'Best time for foreign opportunities', timeframe: 'Age 28-35' },
        { description: 'Settlement abroad possible', timeframe: 'Age 32-40' },
      ],
      purposes: [
        'Higher education',
        'Career opportunities',
        'Business expansion',
        'Spiritual journeys',
      ],
      settlement: 'Foreign settlement possible and favorable if pursued',
    },
    spirituality: {
      spiritualInclination: 'Growing spiritual inclination, especially after age 35',
      enlightenmentPath: 'Bhakti (devotional) and Karma (action) yoga paths suit you',
      religiousObservance: 'Regular worship and religious practices beneficial',
      spiritualPractices: [
        'Daily meditation recommended',
        'Mantra chanting beneficial',
        'Pilgrimage to holy places',
        'Study of scriptures',
        'Service to humanity',
      ],
    },
  };
}

/**
 * Generate remedies
 */
function generateRemedies(positions: PlanetaryPosition[], yogas: Yoga[]): Remedy[] {
  const remedies: Remedy[] = [];

  // Check weak planets and suggest remedies
  const weakPlanets = positions.filter(p => p.strength < 50);

  for (const planet of weakPlanets) {
    remedies.push(generateRemedyForPlanet(planet.planet));
  }

  return remedies;
}

/**
 * Generate remedy for specific planet
 */
function generateRemedyForPlanet(planet: string): Remedy {
  const remedyDetails: Record<string, any> = {
    'Sun': {
      gemstone: 'Ruby (Manik)',
      mantra: 'Om Suryaya Namaha',
      pooja: 'Surya Puja on Sundays',
      charity: 'Donate wheat and jaggery on Sundays',
      fasting: 'Fast on Sundays',
    },
    'Moon': {
      gemstone: 'Pearl (Moti)',
      mantra: 'Om Chandraya Namaha',
      pooja: 'Chandra Puja on Mondays',
      charity: 'Donate white items on Mondays',
      fasting: 'Fast on Mondays',
    },
    'Mars': {
      gemstone: 'Red Coral (Moonga)',
      mantra: 'Om Mangalaya Namaha',
      pooja: 'Hanuman Puja on Tuesdays',
      charity: 'Donate red lentils on Tuesdays',
      fasting: 'Fast on Tuesdays',
    },
    'Mercury': {
      gemstone: 'Emerald (Panna)',
      mantra: 'Om Budhaya Namaha',
      pooja: 'Vishnu Puja on Wednesdays',
      charity: 'Donate green items on Wednesdays',
      fasting: 'Fast on Wednesdays',
    },
    'Jupiter': {
      gemstone: 'Yellow Sapphire (Pukhraj)',
      mantra: 'Om Gurave Namaha',
      pooja: 'Guru Puja on Thursdays',
      charity: 'Donate yellow items to priests',
      fasting: 'Fast on Thursdays',
    },
    'Venus': {
      gemstone: 'Diamond (Heera) or White Sapphire',
      mantra: 'Om Shukraya Namaha',
      pooja: 'Lakshmi Puja on Fridays',
      charity: 'Donate white items on Fridays',
      fasting: 'Fast on Fridays',
    },
    'Saturn': {
      gemstone: 'Blue Sapphire (Neelam)',
      mantra: 'Om Shanaye Namaha',
      pooja: 'Shani Puja on Saturdays',
      charity: 'Donate black items on Saturdays',
      fasting: 'Fast on Saturdays',
    },
    'Rahu': {
      gemstone: 'Hessonite (Gomed)',
      mantra: 'Om Rahave Namaha',
      pooja: 'Durga Puja on Saturdays',
      charity: 'Donate to the poor',
      fasting: 'Fast on Saturdays',
    },
    'Ketu': {
      gemstone: 'Cat\'s Eye (Lehsunia)',
      mantra: 'Om Ketave Namaha',
      pooja: 'Ganesha Puja on Tuesdays',
      charity: 'Donate to spiritual causes',
      fasting: 'Fast on Tuesdays',
    },
  };

  const details = remedyDetails[planet];

  return {
    type: 'Gemstone',
    planet,
    item: details.gemstone,
    procedure: `Wear ${details.gemstone} in ring finger after proper energization by priest`,
    benefit: `Strengthens ${planet} and reduces negative effects`,
    cost: 'Varies based on quality (₹5,000 - ₹50,000)',
    frequency: 'Wear continuously after wearing',
  };
}

/**
 * Generate lucky elements
 */
function generateLuckyElements(chart: BirthChart): LuckyElements {
  const ascendantIndex = ZODIAC_SIGNS.indexOf(chart.ascendant);

  return {
    numbers: [(ascendantIndex + 1), (ascendantIndex + 5), (ascendantIndex + 9)],
    colors: ['Red', 'Yellow', 'Orange', 'White'],
    days: ['Thursday', 'Tuesday', 'Sunday'],
    directions: ['East', 'North-East', 'South'],
    gemstones: ['Ruby', 'Yellow Sapphire', 'Red Coral'],
  };
}

/**
 * Identify strengths
 */
function identifyStrengths(positions: PlanetaryPosition[], yogas: Yoga[]): string[] {
  return [
    'Strong leadership abilities',
    'Good analytical and decision-making skills',
    'Excellent communication talents',
    'Natural business acumen',
    'Strong family support system',
    'Good health and vitality',
    'Spiritual inclination and wisdom',
  ];
}

/**
 * Identify challenges
 */
function identifyChallenges(positions: PlanetaryPosition[], yogas: Yoga[]): string[] {
  return [
    'Tendency to be impatient at times',
    'Need to manage stress better',
    'Should avoid overconfidence in decisions',
    'Work-life balance needs attention',
    'Financial planning requires discipline',
  ];
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Compare two kundlis for compatibility (wrapper function)
 */
export function compareKundlis(
  kundli1: CompleteKundli,
  kundli2: CompleteKundli
): {
  compatibilityScore: number;
  matchingGunas: number;
  issues: string[];
  recommendations: string[];
} {
  return analyzeCrossKundliCompatibility(kundli1, kundli2);
}

/**
 * Get all available remedies from a kundli
 */
export function getAllRemediesFromKundli(kundli: CompleteKundli): {
  doshaRemedies: any[];
  planetaryRemedies: Remedy[];
  mantras: MantraDetails[];
  pilgrimages: PilgrimageGuide[];
} {
  return {
    doshaRemedies: kundli.doshaAnalysis.doshas.flatMap(d => d.remedies),
    planetaryRemedies: kundli.remedies,
    mantras: kundli.allMantras,
    pilgrimages: kundli.pilgrimageGuides,
  };
}
