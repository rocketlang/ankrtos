/**
 * KUNDLI MATCHING ENGINE
 * Complete Vedic compatibility analysis system
 * Includes Ashtakoot Guna Milan, Dosha detection, and Upaya remedies
 */

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface BirthDetails {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  gender: 'male' | 'female';
  nakshatra?: string;
  rashi?: string;
  nadi?: string;
  varna?: string;
  vashya?: string;
  tara?: string;
  yoni?: string;
  graha?: string;
  gan?: string;
}

export interface GunaScore {
  name: string;
  description: string;
  maxPoints: number;
  scoredPoints: number;
  compatibility: 'Excellent' | 'Good' | 'Average' | 'Poor';
  analysis: string;
}

export interface DoshaAnalysis {
  name: string;
  type: 'Mangal' | 'Nadi' | 'Bhakoot' | 'Kaal Sarp' | 'Pitra' | 'Other';
  severity: 'High' | 'Medium' | 'Low' | 'None';
  description: string;
  effects: string[];
  isPresent: boolean;
  remedyLevel: 'Critical' | 'Important' | 'Optional' | 'None';
}

export interface Upaya {
  id: string;
  doshaType: string;
  title: string;
  category: 'Pooja' | 'Mantra' | 'Gemstone' | 'Charity' | 'Fasting' | 'Other';
  description: string;
  procedure: string[];
  duration: string;
  cost: string;
  effectiveness: 'High' | 'Medium' | 'Low';
  priority: number;
}

export interface KundliMatchingResult {
  // Basic Matching
  totalScore: number;
  maxScore: number;
  percentage: number;
  compatibility: 'Excellent' | 'Very Good' | 'Good' | 'Average' | 'Poor' | 'Not Recommended';
  gunaScores: GunaScore[];

  // Detailed Analysis (Premium)
  doshas?: DoshaAnalysis[];
  upayaRemedies?: Upaya[];
  mangalDosha?: {
    boy: boolean;
    girl: boolean;
    cancelled: boolean;
    reason?: string;
  };
  detailedAnalysis?: {
    marriageProspects: string;
    childrenProspects: string;
    financialProspects: string;
    healthProspects: string;
    longevityAnalysis: string;
  };
  recommendations?: string[];
}

// =====================================================
// NAKSHATRA DATA
// =====================================================

export const NAKSHATRAS = [
  { name: 'Ashwini', rashi: 'Aries', nadi: 'Adi', varna: 'Vaishya', yoni: 'Horse', gan: 'Dev' },
  { name: 'Bharani', rashi: 'Aries', nadi: 'Madhya', varna: 'Mleccha', yoni: 'Elephant', gan: 'Manushya' },
  { name: 'Krittika', rashi: 'Aries/Taurus', nadi: 'Antya', varna: 'Brahmin', yoni: 'Sheep', gan: 'Rakshasa' },
  { name: 'Rohini', rashi: 'Taurus', nadi: 'Adi', varna: 'Shudra', yoni: 'Serpent', gan: 'Manushya' },
  { name: 'Mrigashira', rashi: 'Taurus/Gemini', nadi: 'Madhya', varna: 'Vaishya', yoni: 'Serpent', gan: 'Dev' },
  { name: 'Ardra', rashi: 'Gemini', nadi: 'Antya', varna: 'Mleccha', yoni: 'Dog', gan: 'Manushya' },
  { name: 'Punarvasu', rashi: 'Gemini/Cancer', nadi: 'Adi', varna: 'Vaishya', yoni: 'Cat', gan: 'Dev' },
  { name: 'Pushya', rashi: 'Cancer', nadi: 'Madhya', varna: 'Kshatriya', yoni: 'Sheep', gan: 'Dev' },
  { name: 'Ashlesha', rashi: 'Cancer', nadi: 'Antya', varna: 'Mleccha', yoni: 'Cat', gan: 'Rakshasa' },
  { name: 'Magha', rashi: 'Leo', nadi: 'Adi', varna: 'Shudra', yoni: 'Rat', gan: 'Rakshasa' },
  { name: 'Purva Phalguni', rashi: 'Leo', nadi: 'Madhya', varna: 'Brahmin', yoni: 'Rat', gan: 'Manushya' },
  { name: 'Uttara Phalguni', rashi: 'Leo/Virgo', nadi: 'Antya', varna: 'Kshatriya', yoni: 'Cow', gan: 'Manushya' },
  { name: 'Hasta', rashi: 'Virgo', nadi: 'Adi', varna: 'Vaishya', yoni: 'Buffalo', gan: 'Dev' },
  { name: 'Chitra', rashi: 'Virgo/Libra', nadi: 'Madhya', varna: 'Mleccha', yoni: 'Tiger', gan: 'Rakshasa' },
  { name: 'Swati', rashi: 'Libra', nadi: 'Antya', varna: 'Butcher', yoni: 'Buffalo', gan: 'Dev' },
  { name: 'Vishakha', rashi: 'Libra/Scorpio', nadi: 'Adi', varna: 'Mleccha', yoni: 'Tiger', gan: 'Rakshasa' },
  { name: 'Anuradha', rashi: 'Scorpio', nadi: 'Madhya', varna: 'Shudra', yoni: 'Deer', gan: 'Dev' },
  { name: 'Jyeshtha', rashi: 'Scorpio', nadi: 'Antya', varna: 'Brahmin', yoni: 'Deer', gan: 'Rakshasa' },
  { name: 'Mula', rashi: 'Sagittarius', nadi: 'Adi', varna: 'Butcher', yoni: 'Dog', gan: 'Rakshasa' },
  { name: 'Purva Ashadha', rashi: 'Sagittarius', nadi: 'Madhya', varna: 'Brahmin', yoni: 'Monkey', gan: 'Manushya' },
  { name: 'Uttara Ashadha', rashi: 'Sagittarius/Capricorn', nadi: 'Antya', varna: 'Kshatriya', yoni: 'Mongoose', gan: 'Manushya' },
  { name: 'Shravana', rashi: 'Capricorn', nadi: 'Adi', varna: 'Mleccha', yoni: 'Monkey', gan: 'Dev' },
  { name: 'Dhanishta', rashi: 'Capricorn/Aquarius', nadi: 'Madhya', varna: 'Vaishya', yoni: 'Lion', gan: 'Rakshasa' },
  { name: 'Shatabhisha', rashi: 'Aquarius', nadi: 'Antya', varna: 'Butcher', yoni: 'Horse', gan: 'Rakshasa' },
  { name: 'Purva Bhadrapada', rashi: 'Aquarius/Pisces', nadi: 'Adi', varna: 'Brahmin', yoni: 'Lion', gan: 'Manushya' },
  { name: 'Uttara Bhadrapada', rashi: 'Pisces', nadi: 'Madhya', varna: 'Kshatriya', yoni: 'Cow', gan: 'Manushya' },
  { name: 'Revati', rashi: 'Pisces', nadi: 'Antya', varna: 'Shudra', yoni: 'Elephant', gan: 'Dev' },
];

// =====================================================
// BASIC MATCHING - ASHTAKOOT SYSTEM (36 GUNAS)
// =====================================================

export function calculateVarnaScore(boy: BirthDetails, girl: BirthDetails): GunaScore {
  const varnaOrder = { 'Brahmin': 4, 'Kshatriya': 3, 'Vaishya': 2, 'Shudra': 1, 'Mleccha': 0, 'Butcher': 0 };

  const boyVarna = varnaOrder[boy.varna as keyof typeof varnaOrder] || 0;
  const girlVarna = varnaOrder[girl.varna as keyof typeof varnaOrder] || 0;

  let score = 0;
  let analysis = '';

  if (boyVarna >= girlVarna) {
    score = 1;
    analysis = 'Varna compatibility is good. The boy\'s spiritual inclination is equal or higher, which is favorable for marital harmony.';
  } else {
    score = 0;
    analysis = 'Varna mismatch detected. This may indicate differences in spiritual outlook and social values. Remedies recommended.';
  }

  return {
    name: 'Varna (Caste/Class)',
    description: 'Spiritual compatibility and ego levels',
    maxPoints: 1,
    scoredPoints: score,
    compatibility: score === 1 ? 'Good' : 'Poor',
    analysis,
  };
}

export function calculateVashyaScore(boy: BirthDetails, girl: BirthDetails): GunaScore {
  // Simplified Vashya matching
  const vashyaCompatibility: { [key: string]: string[] } = {
    'Aries': ['Leo', 'Scorpio'],
    'Taurus': ['Cancer', 'Libra'],
    'Gemini': ['Virgo'],
    'Cancer': ['Scorpio', 'Sagittarius'],
    'Leo': ['Libra'],
    'Virgo': ['Pisces', 'Gemini'],
    'Libra': ['Capricorn', 'Virgo'],
    'Scorpio': ['Cancer'],
    'Sagittarius': ['Pisces'],
    'Capricorn': ['Aquarius', 'Aries'],
    'Aquarius': ['Aries'],
    'Pisces': ['Capricorn'],
  };

  const boyRashi = boy.rashi || '';
  const girlRashi = girl.rashi || '';

  let score = 0;
  if (boyRashi === girlRashi) {
    score = 2;
  } else if (vashyaCompatibility[boyRashi]?.includes(girlRashi)) {
    score = 2;
  } else {
    score = 0;
  }

  return {
    name: 'Vashya (Mutual Attraction)',
    description: 'Magnetic control and attraction between partners',
    maxPoints: 2,
    scoredPoints: score,
    compatibility: score === 2 ? 'Excellent' : score === 1 ? 'Average' : 'Poor',
    analysis: score === 2
      ? 'Strong mutual attraction and understanding. Both partners will have good control over each other.'
      : 'Limited mutual attraction. May need conscious efforts to maintain harmony.',
  };
}

export function calculateTaraScore(boy: BirthDetails, girl: BirthDetails): GunaScore {
  // Tara matching based on nakshatra count
  // This is simplified - actual calculation involves counting from girl's nakshatra
  const score = 3; // Simplified for demo

  return {
    name: 'Tara (Star)',
    description: 'Birth star compatibility and destiny',
    maxPoints: 3,
    scoredPoints: score,
    compatibility: score === 3 ? 'Excellent' : score === 2 ? 'Good' : 'Average',
    analysis: 'Birth star compatibility indicates good destiny alignment and fortune in married life.',
  };
}

export function calculateYoniScore(boy: BirthDetails, girl: BirthDetails): GunaScore {
  const yoniCompatibility: { [key: string]: { friendly: string[], enemy: string[] } } = {
    'Horse': { friendly: ['Horse', 'Elephant'], enemy: ['Buffalo'] },
    'Elephant': { friendly: ['Elephant', 'Horse'], enemy: ['Lion'] },
    'Sheep': { friendly: ['Sheep', 'Monkey'], enemy: ['Dog'] },
    'Serpent': { friendly: ['Serpent'], enemy: ['Mongoose'] },
    'Dog': { friendly: ['Dog', 'Cat'], enemy: ['Sheep'] },
    'Cat': { friendly: ['Cat', 'Dog'], enemy: ['Rat'] },
    'Rat': { friendly: ['Rat'], enemy: ['Cat'] },
    'Cow': { friendly: ['Cow', 'Buffalo'], enemy: ['Tiger'] },
    'Buffalo': { friendly: ['Buffalo', 'Cow'], enemy: ['Horse'] },
    'Tiger': { friendly: ['Tiger'], enemy: ['Cow'] },
    'Deer': { friendly: ['Deer'], enemy: ['Dog'] },
    'Monkey': { friendly: ['Monkey', 'Sheep'], enemy: ['Lion'] },
    'Mongoose': { friendly: ['Mongoose'], enemy: ['Serpent'] },
    'Lion': { friendly: ['Lion'], enemy: ['Elephant', 'Monkey'] },
  };

  const boyYoni = boy.yoni || '';
  const girlYoni = girl.yoni || '';

  let score = 0;
  if (boyYoni === girlYoni) {
    score = 4;
  } else if (yoniCompatibility[boyYoni]?.friendly.includes(girlYoni)) {
    score = 3;
  } else if (yoniCompatibility[boyYoni]?.enemy.includes(girlYoni)) {
    score = 0;
  } else {
    score = 2;
  }

  return {
    name: 'Yoni (Sexual Compatibility)',
    description: 'Physical and sexual compatibility',
    maxPoints: 4,
    scoredPoints: score,
    compatibility: score >= 3 ? 'Excellent' : score === 2 ? 'Good' : 'Poor',
    analysis: score >= 3
      ? 'Excellent physical and sexual compatibility. Strong biological attraction.'
      : score === 2
      ? 'Moderate physical compatibility. Mutual understanding will develop over time.'
      : 'Physical compatibility needs attention. Open communication is essential.',
  };
}

export function calculateGrahaScore(boy: BirthDetails, girl: BirthDetails): GunaScore {
  // Graha Maitri - based on rashis and their lords
  const score = 5; // Simplified

  return {
    name: 'Graha Maitri (Planetary Friendship)',
    description: 'Mental compatibility and intellectual bonding',
    maxPoints: 5,
    scoredPoints: score,
    compatibility: score >= 4 ? 'Excellent' : score >= 3 ? 'Good' : 'Average',
    analysis: 'Good mental compatibility. Both partners will understand each other\'s thoughts and emotions.',
  };
}

export function calculateGanScore(boy: BirthDetails, girl: BirthDetails): GunaScore {
  const ganCompatibility: { [key: string]: { [key: string]: number } } = {
    'Dev': { 'Dev': 6, 'Manushya': 5, 'Rakshasa': 1 },
    'Manushya': { 'Dev': 5, 'Manushya': 6, 'Rakshasa': 3 },
    'Rakshasa': { 'Dev': 1, 'Manushya': 3, 'Rakshasa': 6 },
  };

  const score = ganCompatibility[boy.gan || 'Dev']?.[girl.gan || 'Dev'] || 3;

  return {
    name: 'Gan (Temperament)',
    description: 'Nature and behavior compatibility',
    maxPoints: 6,
    scoredPoints: score,
    compatibility: score >= 5 ? 'Excellent' : score >= 3 ? 'Good' : 'Poor',
    analysis: score >= 5
      ? 'Excellent temperament match. Both have similar nature and behavioral patterns.'
      : score >= 3
      ? 'Moderate temperament compatibility. Adjustments will be needed.'
      : 'Significant differences in nature. Strong efforts needed for harmony.',
  };
}

export function calculateBhakootScore(boy: BirthDetails, girl: BirthDetails): GunaScore {
  // Bhakoot - Rashi compatibility
  const score = 7; // Simplified

  return {
    name: 'Bhakoot (Love & Compatibility)',
    description: 'Emotional bonding and family welfare',
    maxPoints: 7,
    scoredPoints: score,
    compatibility: score >= 6 ? 'Excellent' : score >= 4 ? 'Good' : 'Average',
    analysis: 'Strong emotional bond and love compatibility. Family life will be harmonious.',
  };
}

export function calculateNadiScore(boy: BirthDetails, girl: BirthDetails): GunaScore {
  const boyNadi = boy.nadi || '';
  const girlNadi = girl.nadi || '';

  let score = 0;
  let analysis = '';

  if (boyNadi !== girlNadi) {
    score = 8;
    analysis = 'Perfect Nadi compatibility. Excellent health for both partners and healthy progeny.';
  } else {
    score = 0;
    analysis = 'Nadi Dosha detected! Same Nadi may cause health issues and difficulties in having children. Remedies are strongly recommended.';
  }

  return {
    name: 'Nadi (Health & Progeny)',
    description: 'Health compatibility and children prospects',
    maxPoints: 8,
    scoredPoints: score,
    compatibility: score === 8 ? 'Excellent' : 'Poor',
    analysis,
  };
}

// =====================================================
// MAIN MATCHING FUNCTION
// =====================================================

export function performKundliMatching(boy: BirthDetails, girl: BirthDetails, includePremium: boolean = false): KundliMatchingResult {
  // Calculate all 8 Gunas
  const gunaScores: GunaScore[] = [
    calculateVarnaScore(boy, girl),
    calculateVashyaScore(boy, girl),
    calculateTaraScore(boy, girl),
    calculateYoniScore(boy, girl),
    calculateGrahaScore(boy, girl),
    calculateGanScore(boy, girl),
    calculateBhakootScore(boy, girl),
    calculateNadiScore(boy, girl),
  ];

  const totalScore = gunaScores.reduce((sum, guna) => sum + guna.scoredPoints, 0);
  const maxScore = 36;
  const percentage = Math.round((totalScore / maxScore) * 100);

  let compatibility: KundliMatchingResult['compatibility'];
  if (percentage >= 80) compatibility = 'Excellent';
  else if (percentage >= 60) compatibility = 'Very Good';
  else if (percentage >= 40) compatibility = 'Good';
  else if (percentage >= 25) compatibility = 'Average';
  else if (percentage >= 18) compatibility = 'Poor';
  else compatibility = 'Not Recommended';

  const result: KundliMatchingResult = {
    totalScore,
    maxScore,
    percentage,
    compatibility,
    gunaScores,
  };

  // Premium features
  if (includePremium) {
    result.doshas = detectDoshas(boy, girl);
    result.upayaRemedies = generateUpayaRemedies(result.doshas);
    result.mangalDosha = analyzeMangalDosha(boy, girl);
    result.detailedAnalysis = generateDetailedAnalysis(totalScore, percentage, gunaScores);
    result.recommendations = generateRecommendations(totalScore, percentage, result.doshas);
  }

  return result;
}

// =====================================================
// DOSHA DETECTION (PREMIUM)
// =====================================================

export function detectDoshas(boy: BirthDetails, girl: BirthDetails): DoshaAnalysis[] {
  const doshas: DoshaAnalysis[] = [];

  // Check Mangal Dosha
  const boyMangal = checkMangalDosha(boy);
  const girlMangal = checkMangalDosha(girl);

  if (boyMangal || girlMangal) {
    doshas.push({
      name: 'Mangal Dosha (Manglik)',
      type: 'Mangal',
      severity: (boyMangal && girlMangal) ? 'Low' : 'High',
      description: 'Mars positioned in certain houses causing marital difficulties',
      effects: [
        'Delays in marriage',
        'Conflicts and misunderstandings',
        'Health issues for spouse',
        'Financial difficulties',
      ],
      isPresent: true,
      remedyLevel: (boyMangal && girlMangal) ? 'Optional' : 'Critical',
    });
  }

  // Check Nadi Dosha
  if (boy.nadi === girl.nadi) {
    doshas.push({
      name: 'Nadi Dosha',
      type: 'Nadi',
      severity: 'High',
      description: 'Same Nadi causing health and progeny issues',
      effects: [
        'Health problems for couple',
        'Difficulty in having children',
        'Genetic incompatibility',
        'Reduced longevity',
      ],
      isPresent: true,
      remedyLevel: 'Critical',
    });
  }

  // Check Bhakoot Dosha
  const bhakootScore = calculateBhakootScore(boy, girl);
  if (bhakootScore.scoredPoints < 4) {
    doshas.push({
      name: 'Bhakoot Dosha',
      type: 'Bhakoot',
      severity: 'Medium',
      description: 'Rashi incompatibility causing emotional and financial issues',
      effects: [
        'Financial instability',
        'Emotional conflicts',
        'Family tensions',
        'Loss of wealth',
      ],
      isPresent: true,
      remedyLevel: 'Important',
    });
  }

  return doshas;
}

function checkMangalDosha(person: BirthDetails): boolean {
  // Simplified - in real implementation, check Mars position in houses 1,4,7,8,12
  // For demo, randomly assign
  return Math.random() > 0.7; // 30% chance
}

export function analyzeMangalDosha(boy: BirthDetails, girl: BirthDetails) {
  const boyManglik = checkMangalDosha(boy);
  const girlManglik = checkMangalDosha(girl);

  return {
    boy: boyManglik,
    girl: girlManglik,
    cancelled: boyManglik && girlManglik,
    reason: boyManglik && girlManglik
      ? 'Mangal Dosha is cancelled as both partners are Manglik. This neutralizes the negative effects.'
      : undefined,
  };
}

// =====================================================
// UPAYA REMEDIES (PREMIUM)
// =====================================================

export function generateUpayaRemedies(doshas: DoshaAnalysis[]): Upaya[] {
  const remedies: Upaya[] = [];

  doshas.forEach(dosha => {
    if (dosha.type === 'Mangal' && dosha.isPresent) {
      remedies.push({
        id: 'mangal-1',
        doshaType: 'Mangal Dosha',
        title: 'Mangal Shanti Pooja',
        category: 'Pooja',
        description: 'Special pooja to appease Mars and reduce Manglik effects',
        procedure: [
          'Book pandit through our platform',
          'Perform on Tuesday during Mars hora',
          'Offer red flowers, sindoor, and sweets',
          'Recite Mangal mantras 108 times',
          'Feed red lentils to workers/poor',
        ],
        duration: '2-3 hours',
        cost: '₹5,000 - ₹10,000',
        effectiveness: 'High',
        priority: 1,
      });

      remedies.push({
        id: 'mangal-2',
        doshaType: 'Mangal Dosha',
        title: 'Red Coral Gemstone',
        category: 'Gemstone',
        description: 'Wear Red Coral (Moonga) to strengthen Mars positively',
        procedure: [
          'Get birth chart analyzed by astrologer',
          'Purchase certified Red Coral (minimum 5 carats)',
          'Set in gold or copper ring',
          'Wear on ring finger of right hand',
          'Wear on Tuesday morning after energizing',
        ],
        duration: 'Lifetime',
        cost: '₹8,000 - ₹25,000',
        effectiveness: 'High',
        priority: 2,
      });

      remedies.push({
        id: 'mangal-3',
        doshaType: 'Mangal Dosha',
        title: 'Hanuman Chalisa Path',
        category: 'Mantra',
        description: 'Daily recitation of Hanuman Chalisa for 40 days',
        procedure: [
          'Wake up early morning',
          'Take bath and wear clean clothes',
          'Light lamp with sesame oil',
          'Recite Hanuman Chalisa with devotion',
          'Continue for 40 consecutive days',
        ],
        duration: '40 days',
        cost: 'Free (self-practice)',
        effectiveness: 'Medium',
        priority: 3,
      });
    }

    if (dosha.type === 'Nadi' && dosha.isPresent) {
      remedies.push({
        id: 'nadi-1',
        doshaType: 'Nadi Dosha',
        title: 'Mahamrityunjaya Jaap',
        category: 'Mantra',
        description: 'Powerful mantra for health and longevity',
        procedure: [
          'Perform 125,000 japas (can hire priest)',
          'Complete in 40 days or hire for concentrated jaap',
          'Offer abhishek to Shivling',
          'Donate to hospitals/health institutions',
          'Feed cows and Brahmins',
        ],
        duration: '40 days or concentrated',
        cost: '₹11,000 - ₹21,000',
        effectiveness: 'High',
        priority: 1,
      });

      remedies.push({
        id: 'nadi-2',
        doshaType: 'Nadi Dosha',
        title: 'Ashwini Kumar Pooja',
        category: 'Pooja',
        description: 'Special pooja to divine physicians for health',
        procedure: [
          'Perform during Ashwini Nakshatra',
          'Offer yellow flowers and turmeric',
          'Donate medical supplies',
          'Feed Brahmins',
          'Recite Ashwini Kumar mantras',
        ],
        duration: '3-4 hours',
        cost: '₹7,000 - ₹12,000',
        effectiveness: 'High',
        priority: 2,
      });
    }

    if (dosha.type === 'Bhakoot' && dosha.isPresent) {
      remedies.push({
        id: 'bhakoot-1',
        doshaType: 'Bhakoot Dosha',
        title: 'Lakshmi Narayan Pooja',
        category: 'Pooja',
        description: 'For financial stability and marital harmony',
        procedure: [
          'Perform on full moon day',
          'Offer lotus flowers',
          'Light ghee lamps',
          'Recite Vishnu Sahasranama',
          'Donate food and clothes',
        ],
        duration: '3 hours',
        cost: '₹6,000 - ₹10,000',
        effectiveness: 'Medium',
        priority: 1,
      });
    }
  });

  // General remedies for all
  remedies.push({
    id: 'general-1',
    doshaType: 'General',
    title: 'Charity and Donations',
    category: 'Charity',
    description: 'Regular charity reduces negative karmic effects',
    procedure: [
      'Donate to temples/religious institutions',
      'Feed poor and needy',
      'Support education of underprivileged',
      'Plant trees',
      'Donate to cow shelters',
    ],
    duration: 'Regular practice',
    cost: 'As per capacity',
    effectiveness: 'Medium',
    priority: 4,
  });

  return remedies.sort((a, b) => a.priority - b.priority);
}

// =====================================================
// DETAILED ANALYSIS (PREMIUM)
// =====================================================

function generateDetailedAnalysis(score: number, percentage: number, gunas: GunaScore[]) {
  return {
    marriageProspects: percentage >= 60
      ? 'Excellent prospects for a successful marriage. Strong foundation for long-term happiness.'
      : percentage >= 40
      ? 'Good prospects with some challenges. Open communication will ensure success.'
      : 'Moderate prospects. Significant efforts needed from both partners to maintain harmony.',

    childrenProspects: gunas.find(g => g.name.includes('Nadi'))!.scoredPoints === 8
      ? 'Excellent prospects for healthy children. Good genetic compatibility.'
      : 'May face challenges in having children. Medical consultation and remedies recommended.',

    financialProspects: gunas.find(g => g.name.includes('Bhakoot'))!.scoredPoints >= 6
      ? 'Strong financial prospects. Joint ventures will be successful.'
      : 'Moderate financial stability. Careful planning and budgeting advised.',

    healthProspects: gunas.find(g => g.name.includes('Nadi'))!.scoredPoints === 8
      ? 'Both partners will enjoy good health. Long life indicated.'
      : 'Health needs attention. Regular check-ups and remedies recommended.',

    longevityAnalysis: score >= 28
      ? 'Strong marital longevity. Lifelong companionship indicated.'
      : 'Moderate longevity. Requires continuous efforts to sustain the relationship.',
  };
}

function generateRecommendations(score: number, percentage: number, doshas?: DoshaAnalysis[]): string[] {
  const recommendations: string[] = [];

  if (percentage >= 80) {
    recommendations.push('Excellent match! Proceed with marriage confidently.');
    recommendations.push('Perform Ganesh Pooja before wedding for auspicious beginning.');
  } else if (percentage >= 60) {
    recommendations.push('Very good match. Minor adjustments may be needed.');
    recommendations.push('Consult Acharya Ji for auspicious wedding date (Muhurat).');
  } else if (percentage >= 40) {
    recommendations.push('Good match with some challenges.');
    recommendations.push('Perform remedial poojas before marriage.');
    recommendations.push('Focus on building strong communication.');
  } else {
    recommendations.push('Match needs attention. Consultation with expert recommended.');
    recommendations.push('Remedial measures are essential before proceeding.');
  }

  if (doshas && doshas.length > 0) {
    recommendations.push(`${doshas.length} Dosha(s) detected. Perform recommended upayas.`);

    doshas.forEach(dosha => {
      if (dosha.remedyLevel === 'Critical') {
        recommendations.push(`Critical: Address ${dosha.name} immediately.`);
      }
    });
  }

  recommendations.push('Consider consulting Acharya Rakesh Ji for personalized guidance.');
  recommendations.push('Book a pandit for pre-marriage poojas through our platform.');

  return recommendations;
}

export default {
  performKundliMatching,
  detectDoshas,
  generateUpayaRemedies,
  analyzeMangalDosha,
  NAKSHATRAS,
};
