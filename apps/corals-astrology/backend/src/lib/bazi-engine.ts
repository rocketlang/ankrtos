/**
 * Chinese BaZi (Four Pillars of Destiny) Calculation Engine
 * 四柱命理 - Ba Zi Ming Li
 */

// ==================== CONSTANTS ====================

// 10 Heavenly Stems (天干)
export const HEAVENLY_STEMS = [
  { chinese: '甲', pinyin: 'Jia', element: 'Wood', polarity: 'Yang' },
  { chinese: '乙', pinyin: 'Yi', element: 'Wood', polarity: 'Yin' },
  { chinese: '丙', pinyin: 'Bing', element: 'Fire', polarity: 'Yang' },
  { chinese: '丁', pinyin: 'Ding', element: 'Fire', polarity: 'Yin' },
  { chinese: '戊', pinyin: 'Wu', element: 'Earth', polarity: 'Yang' },
  { chinese: '己', pinyin: 'Ji', element: 'Earth', polarity: 'Yin' },
  { chinese: '庚', pinyin: 'Geng', element: 'Metal', polarity: 'Yang' },
  { chinese: '辛', pinyin: 'Xin', element: 'Metal', polarity: 'Yin' },
  { chinese: '壬', pinyin: 'Ren', element: 'Water', polarity: 'Yang' },
  { chinese: '癸', pinyin: 'Gui', element: 'Water', polarity: 'Yin' },
];

// 12 Earthly Branches (地支)
export const EARTHLY_BRANCHES = [
  { chinese: '子', pinyin: 'Zi', element: 'Water', animal: 'Rat', polarity: 'Yang', hours: [23, 1] },
  { chinese: '丑', pinyin: 'Chou', element: 'Earth', animal: 'Ox', polarity: 'Yin', hours: [1, 3] },
  { chinese: '寅', pinyin: 'Yin', element: 'Wood', animal: 'Tiger', polarity: 'Yang', hours: [3, 5] },
  { chinese: '卯', pinyin: 'Mao', element: 'Wood', animal: 'Rabbit', polarity: 'Yin', hours: [5, 7] },
  { chinese: '辰', pinyin: 'Chen', element: 'Earth', animal: 'Dragon', polarity: 'Yang', hours: [7, 9] },
  { chinese: '巳', pinyin: 'Si', element: 'Fire', animal: 'Snake', polarity: 'Yin', hours: [9, 11] },
  { chinese: '午', pinyin: 'Wu', element: 'Fire', animal: 'Horse', polarity: 'Yang', hours: [11, 13] },
  { chinese: '未', pinyin: 'Wei', element: 'Earth', animal: 'Goat', polarity: 'Yin', hours: [13, 15] },
  { chinese: '申', pinyin: 'Shen', element: 'Metal', animal: 'Monkey', polarity: 'Yang', hours: [15, 17] },
  { chinese: '酉', pinyin: 'You', element: 'Metal', animal: 'Rooster', polarity: 'Yin', hours: [17, 19] },
  { chinese: '戌', pinyin: 'Xu', element: 'Earth', animal: 'Dog', polarity: 'Yang', hours: [19, 21] },
  { chinese: '亥', pinyin: 'Hai', element: 'Water', animal: 'Pig', polarity: 'Yin', hours: [21, 23] },
];

// Hidden Stems in Earthly Branches (藏干)
export const HIDDEN_STEMS: Record<string, string[]> = {
  'Zi': ['Gui'], // 子藏癸
  'Chou': ['Ji', 'Gui', 'Xin'], // 丑藏己癸辛
  'Yin': ['Jia', 'Bing', 'Wu'], // 寅藏甲丙戊
  'Mao': ['Yi'], // 卯藏乙
  'Chen': ['Wu', 'Yi', 'Gui'], // 辰藏戊乙癸
  'Si': ['Bing', 'Wu', 'Geng'], // 巳藏丙戊庚
  'Wu': ['Ding', 'Ji'], // 午藏丁己
  'Wei': ['Ji', 'Ding', 'Yi'], // 未藏己丁乙
  'Shen': ['Geng', 'Ren', 'Wu'], // 申藏庚壬戊
  'You': ['Xin'], // 酉藏辛
  'Xu': ['Wu', 'Xin', 'Ding'], // 戌藏戊辛丁
  'Hai': ['Ren', 'Jia'], // 亥藏壬甲
};

// Five Elements Relationships
export const ELEMENT_CYCLE = {
  Wood: { generates: 'Fire', controls: 'Earth', controlledBy: 'Metal', drainedBy: 'Fire' },
  Fire: { generates: 'Earth', controls: 'Metal', controlledBy: 'Water', drainedBy: 'Earth' },
  Earth: { generates: 'Metal', controls: 'Water', controlledBy: 'Wood', drainedBy: 'Metal' },
  Metal: { generates: 'Water', controls: 'Wood', controlledBy: 'Fire', drainedBy: 'Water' },
  Water: { generates: 'Wood', controls: 'Fire', controlledBy: 'Earth', drainedBy: 'Wood' },
};

// Ten Gods (十神) based on relationship to Day Master
export const TEN_GODS = {
  same: 'Companion (比肩)',
  samePolarityDiff: 'Rob Wealth (劫财)',
  generates: 'Eating God (食神)',
  generatesDiff: 'Hurting Officer (伤官)',
  drains: 'Indirect Wealth (偏财)',
  drainsDiff: 'Direct Wealth (正财)',
  controls: 'Seven Killings (七杀)',
  controlsDiff: 'Direct Officer (正官)',
  supports: 'Indirect Resource (偏印)',
  supportsDiff: 'Direct Resource (正印)',
};

// ==================== INTERFACES ====================

export interface BaZiInput {
  birthDate: Date;
  birthTime: string; // HH:mm format
  birthLat: number;
  birthLng: number;
  timezone: string;
  gender: 'Male' | 'Female';
}

export interface Pillar {
  stem: string;
  branch: string;
  stemElement: string;
  branchElement: string;
  stemPolarity: string;
  branchPolarity: string;
  hiddenStems: string[];
  tenGod?: string;
}

export interface BaZiChart {
  // Birth info
  birthDate: Date;
  solarDate: { year: number; month: number; day: number; hour: number };

  // Four Pillars
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar;

  // Day Master
  dayMaster: string;
  dayMasterElement: string;

  // Element analysis
  elementStrengths: {
    Wood: number;
    Fire: number;
    Earth: number;
    Metal: number;
    Water: number;
  };
  strongestElement: string;
  weakestElement: string;

  // Gods
  usefulGod: string;
  harmfulGod: string;

  // Special features
  specialStars: string[];
  clashes: string[];
  combinations: string[];

  // Luck Pillars
  luckPillars: LuckPillar[];

  // Analysis
  chartStrength: 'Strong' | 'Weak' | 'Balanced';
  analysis: string;
}

export interface LuckPillar {
  startAge: number;
  endAge: number;
  stem: string;
  branch: string;
  element: string;
  analysis: string;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert Gregorian date to Chinese Solar Calendar
 * Uses simplified calculation (accurate enough for most cases)
 */
function toSolarCalendar(date: Date): { year: number; month: number; day: number } {
  // Simplified: Use Gregorian as approximation
  // For production, use Chinese calendar library
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return { year, month, day };
}

/**
 * Get Heavenly Stem for a number (year/month/day/hour)
 */
function getStem(n: number): typeof HEAVENLY_STEMS[0] {
  const index = (n - 4) % 10; // Offset to align with traditional calculation
  return HEAVENLY_STEMS[index >= 0 ? index : index + 10];
}

/**
 * Get Earthly Branch for a number
 */
function getBranch(n: number): typeof EARTHLY_BRANCHES[0] {
  const index = (n - 4) % 12;
  return EARTHLY_BRANCHES[index >= 0 ? index : index + 12];
}

/**
 * Get Hour Branch from time
 */
function getHourBranch(hour: number): typeof EARTHLY_BRANCHES[0] {
  const adjustedHour = (hour + 1) % 24; // Adjust for Chinese hour system
  const branchIndex = Math.floor(adjustedHour / 2);
  return EARTHLY_BRANCHES[branchIndex];
}

/**
 * Calculate Year Pillar
 */
function getYearPillar(year: number): Pillar {
  const stem = getStem(year);
  const branch = getBranch(year);

  return {
    stem: stem.pinyin,
    branch: branch.pinyin,
    stemElement: stem.element,
    branchElement: branch.element,
    stemPolarity: stem.polarity,
    branchPolarity: branch.polarity,
    hiddenStems: HIDDEN_STEMS[branch.pinyin] || [],
  };
}

/**
 * Calculate Month Pillar
 * Month pillar depends on year stem and month
 */
function getMonthPillar(year: number, month: number): Pillar {
  const yearStem = getStem(year);

  // Month stem calculation based on year stem
  const monthStemBase = {
    'Jia': 2, 'Yi': 4, 'Bing': 6, 'Ding': 8, 'Wu': 0,
    'Ji': 2, 'Geng': 4, 'Xin': 6, 'Ren': 8, 'Gui': 0,
  }[yearStem.pinyin] || 0;

  const monthStemIndex = (monthStemBase + month - 1) % 10;
  const stem = HEAVENLY_STEMS[monthStemIndex];

  // Month branch is fixed
  const monthBranchIndex = (month + 1) % 12;
  const branch = EARTHLY_BRANCHES[monthBranchIndex];

  return {
    stem: stem.pinyin,
    branch: branch.pinyin,
    stemElement: stem.element,
    branchElement: branch.element,
    stemPolarity: stem.polarity,
    branchPolarity: branch.polarity,
    hiddenStems: HIDDEN_STEMS[branch.pinyin] || [],
  };
}

/**
 * Calculate Day Pillar
 * Uses Julian Day Number for accurate calculation
 */
function getDayPillar(date: Date): Pillar {
  // Simplified JDN calculation
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
              Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  const stem = getStem(jdn);
  const branch = getBranch(jdn);

  return {
    stem: stem.pinyin,
    branch: branch.pinyin,
    stemElement: stem.element,
    branchElement: branch.element,
    stemPolarity: stem.polarity,
    branchPolarity: branch.polarity,
    hiddenStems: HIDDEN_STEMS[branch.pinyin] || [],
  };
}

/**
 * Calculate Hour Pillar
 */
function getHourPillar(date: Date, dayStem: string): Pillar {
  const hour = date.getHours();
  const branch = getHourBranch(hour);

  // Hour stem based on day stem
  const hourStemBase = {
    'Jia': 0, 'Yi': 2, 'Bing': 4, 'Ding': 6, 'Wu': 8,
    'Ji': 0, 'Geng': 2, 'Xin': 4, 'Ren': 6, 'Gui': 8,
  }[dayStem] || 0;

  const branchIndex = EARTHLY_BRANCHES.findIndex(b => b.pinyin === branch.pinyin);
  const stemIndex = (hourStemBase + branchIndex) % 10;
  const stem = HEAVENLY_STEMS[stemIndex];

  return {
    stem: stem.pinyin,
    branch: branch.pinyin,
    stemElement: stem.element,
    branchElement: branch.element,
    stemPolarity: stem.polarity,
    branchPolarity: branch.polarity,
    hiddenStems: HIDDEN_STEMS[branch.pinyin] || [],
  };
}

/**
 * Calculate element strengths in the chart
 */
function calculateElementStrengths(
  yearPillar: Pillar,
  monthPillar: Pillar,
  dayPillar: Pillar,
  hourPillar: Pillar
): Record<string, number> {
  const strengths = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

  // Count from stems (stronger influence)
  [yearPillar, monthPillar, dayPillar, hourPillar].forEach((pillar) => {
    strengths[pillar.stemElement] += 30;
    strengths[pillar.branchElement] += 20;

    // Add hidden stems (weaker influence)
    pillar.hiddenStems.forEach((hiddenStem) => {
      const element = HEAVENLY_STEMS.find(s => s.pinyin === hiddenStem)?.element;
      if (element) {
        strengths[element] += 10;
      }
    });
  });

  // Month has extra weight (seasonal influence)
  strengths[monthPillar.branchElement] += 20;

  return strengths;
}

/**
 * Determine useful and harmful gods based on day master and chart balance
 */
function determineGods(dayMasterElement: string, strengths: Record<string, number>): {
  usefulGod: string;
  harmfulGod: string;
} {
  const dayMasterStrength = strengths[dayMasterElement];
  const totalStrength = Object.values(strengths).reduce((a, b) => a + b, 0);
  const averageStrength = totalStrength / 5;

  // If day master is strong, need elements that weaken it
  // If day master is weak, need elements that strengthen it
  const isStrong = dayMasterStrength > averageStrength * 1.2;

  if (isStrong) {
    // Need elements that drain or control day master
    const cycle = ELEMENT_CYCLE[dayMasterElement];
    const usefulGod = strengths[cycle.drainedBy] < strengths[cycle.controlledBy]
      ? cycle.drainedBy
      : cycle.controlledBy;
    const harmfulGod = cycle.generates; // Elements that make it stronger

    return { usefulGod, harmfulGod };
  } else {
    // Need elements that support day master
    const cycle = ELEMENT_CYCLE[dayMasterElement];
    const usefulGod = cycle.generates === dayMasterElement
      ? Object.keys(ELEMENT_CYCLE).find(e => ELEMENT_CYCLE[e].generates === dayMasterElement) || 'Wood'
      : dayMasterElement;
    const harmfulGod = cycle.controlledBy; // Elements that weaken it

    return { usefulGod, harmfulGod };
  }
}

/**
 * Calculate Ten God relationship between day master and another stem
 */
function getTenGod(dayMasterStem: string, targetStem: string): string {
  const dayMaster = HEAVENLY_STEMS.find(s => s.pinyin === dayMasterStem);
  const target = HEAVENLY_STEMS.find(s => s.pinyin === targetStem);

  if (!dayMaster || !target) return 'Unknown';

  const sameElement = dayMaster.element === target.element;
  const samePolarity = dayMaster.polarity === target.polarity;

  if (sameElement) {
    return samePolarity ? TEN_GODS.same : TEN_GODS.samePolarityDiff;
  }

  const cycle = ELEMENT_CYCLE[dayMaster.element];

  if (cycle.generates === target.element) {
    return samePolarity ? TEN_GODS.generates : TEN_GODS.generatesDiff;
  } else if (cycle.drainedBy === target.element) {
    return samePolarity ? TEN_GODS.drains : TEN_GODS.drainsDiff;
  } else if (cycle.controls === target.element) {
    return samePolarity ? TEN_GODS.controls : TEN_GODS.controlsDiff;
  } else if (cycle.controlledBy === target.element) {
    return samePolarity ? TEN_GODS.supports : TEN_GODS.supportsDiff;
  }

  return 'Unknown';
}

/**
 * Calculate Luck Pillars (大运)
 */
function calculateLuckPillars(
  gender: 'Male' | 'Female',
  yearPillar: Pillar,
  monthPillar: Pillar
): LuckPillar[] {
  const luckPillars: LuckPillar[] = [];
  const yangMale = gender === 'Male' && yearPillar.stemPolarity === 'Yang';
  const yinFemale = gender === 'Female' && yearPillar.stemPolarity === 'Yin';
  const forward = yangMale || yinFemale;

  const monthStemIndex = HEAVENLY_STEMS.findIndex(s => s.pinyin === monthPillar.stem);
  const monthBranchIndex = EARTHLY_BRANCHES.findIndex(b => b.pinyin === monthPillar.branch);

  for (let i = 0; i < 8; i++) {
    const age = 10 + i * 10; // Start at 10, each pillar lasts 10 years

    const stemIndex = forward
      ? (monthStemIndex + i + 1) % 10
      : (monthStemIndex - i - 1 + 10) % 10;
    const branchIndex = forward
      ? (monthBranchIndex + i + 1) % 12
      : (monthBranchIndex - i - 1 + 12) % 12;

    const stem = HEAVENLY_STEMS[stemIndex];
    const branch = EARTHLY_BRANCHES[branchIndex];

    luckPillars.push({
      startAge: age,
      endAge: age + 9,
      stem: stem.pinyin,
      branch: branch.pinyin,
      element: stem.element,
      analysis: `${stem.chinese}${branch.chinese} (${stem.element}/${branch.element}) - Ages ${age}-${age + 9}`,
    });
  }

  return luckPillars;
}

// ==================== MAIN FUNCTION ====================

/**
 * Generate complete BaZi chart
 */
export async function generateBaZiChart(input: BaZiInput): Promise<BaZiChart> {
  const { birthDate, gender } = input;

  // Convert to solar calendar
  const solar = toSolarCalendar(birthDate);

  // Calculate Four Pillars
  const yearPillar = getYearPillar(solar.year);
  const monthPillar = getMonthPillar(solar.year, solar.month);
  const dayPillar = getDayPillar(birthDate);
  const hourPillar = getHourPillar(birthDate, dayPillar.stem);

  // Day Master
  const dayMaster = dayPillar.stem;
  const dayMasterElement = dayPillar.stemElement;

  // Calculate Ten Gods for each pillar
  yearPillar.tenGod = getTenGod(dayMaster, yearPillar.stem);
  monthPillar.tenGod = getTenGod(dayMaster, monthPillar.stem);
  dayPillar.tenGod = 'Self (日主)';
  hourPillar.tenGod = getTenGod(dayMaster, hourPillar.stem);

  // Element analysis
  const elementStrengths = calculateElementStrengths(yearPillar, monthPillar, dayPillar, hourPillar);
  const strongestElement = Object.entries(elementStrengths)
    .reduce((a, b) => a[1] > b[1] ? a : b)[0];
  const weakestElement = Object.entries(elementStrengths)
    .reduce((a, b) => a[1] < b[1] ? a : b)[0];

  // Useful/Harmful Gods
  const { usefulGod, harmfulGod } = determineGods(dayMasterElement, elementStrengths);

  // Luck Pillars
  const luckPillars = calculateLuckPillars(gender, yearPillar, monthPillar);

  // Chart strength
  const dayMasterStrength = elementStrengths[dayMasterElement];
  const avgStrength = Object.values(elementStrengths).reduce((a, b) => a + b) / 5;
  const chartStrength: 'Strong' | 'Weak' | 'Balanced' =
    dayMasterStrength > avgStrength * 1.3 ? 'Strong' :
    dayMasterStrength < avgStrength * 0.7 ? 'Weak' : 'Balanced';

  // Generate analysis
  const analysis = `Your BaZi chart shows a ${chartStrength} Day Master (${dayMaster} - ${dayMasterElement}). ` +
    `The strongest element is ${strongestElement} and weakest is ${weakestElement}. ` +
    `Your Useful God is ${usefulGod}, which brings balance and opportunities. ` +
    `Avoid excess ${harmfulGod} as it creates imbalance.`;

  return {
    birthDate,
    solarDate: solar,
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster,
    dayMasterElement,
    elementStrengths,
    strongestElement,
    weakestElement,
    usefulGod,
    harmfulGod,
    specialStars: [], // TODO: Implement special stars
    clashes: [], // TODO: Implement clash detection
    combinations: [], // TODO: Implement combination detection
    luckPillars,
    chartStrength,
    analysis,
  };
}

/**
 * Analyze element therapy recommendations
 */
export function getElementTherapy(usefulGod: string, harmfulGod: string) {
  const therapies: Record<string, any> = {
    Wood: {
      colors: ['Green', 'Teal', 'Brown'],
      directions: ['East', 'Southeast'],
      industries: ['Agriculture', 'Forestry', 'Publishing', 'Education', 'Textiles'],
      foods: ['Vegetables', 'Fruits', 'Grains'],
      materials: ['Wood', 'Paper', 'Plants'],
    },
    Fire: {
      colors: ['Red', 'Orange', 'Purple', 'Pink'],
      directions: ['South'],
      industries: ['Energy', 'Entertainment', 'Technology', 'Marketing'],
      foods: ['Spicy food', 'Red meat', 'Coffee'],
      materials: ['Candles', 'Lights', 'Electronics'],
    },
    Earth: {
      colors: ['Yellow', 'Brown', 'Beige'],
      directions: ['Center', 'Southwest', 'Northeast'],
      industries: ['Real Estate', 'Construction', 'Mining', 'Pottery'],
      foods: ['Root vegetables', 'Grains', 'Sweet foods'],
      materials: ['Clay', 'Stone', 'Ceramics'],
    },
    Metal: {
      colors: ['White', 'Gold', 'Silver', 'Gray'],
      directions: ['West', 'Northwest'],
      industries: ['Finance', 'Banking', 'Jewelry', 'Machinery'],
      foods: ['White foods', 'Nuts', 'Protein'],
      materials: ['Metal', 'Crystals', 'Minerals'],
    },
    Water: {
      colors: ['Black', 'Blue', 'Navy'],
      directions: ['North'],
      industries: ['Shipping', 'Beverages', 'Aquaculture', 'Communication'],
      foods: ['Seafood', 'Soup', 'Water'],
      materials: ['Glass', 'Mirrors', 'Water features'],
    },
  };

  return {
    enhance: therapies[usefulGod] || {},
    avoid: therapies[harmfulGod] || {},
  };
}
