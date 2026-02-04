/**
 * Lal Kitab (Red Book) Astrology Engine
 * Unique Indian system with practical remedies
 */

import { generateKundli } from './vedic-engine';

// ==================== LAL KITAB CONSTANTS ====================

// Lal Kitab House Lords (different from Vedic)
const LAL_KITAB_HOUSE_LORDS: { [key: number]: string } = {
  1: 'Mars',    // Self, personality
  2: 'Jupiter', // Wealth, family
  3: 'Mercury', // Siblings, courage
  4: 'Moon',    // Mother, property
  5: 'Sun',     // Children, intelligence
  6: 'Mercury', // Enemies, diseases
  7: 'Venus',   // Marriage, partnerships
  8: 'Saturn',  // Longevity, mysteries
  9: 'Jupiter', // Father, fortune
  10: 'Saturn', // Career, status
  11: 'Jupiter', // Gains, friends
  12: 'Saturn', // Losses, expenses
};

// Pakka (Strong) Houses for each planet
const PAKKA_HOUSES: { [key: string]: number[] } = {
  Sun: [1, 2, 4, 5, 7, 9, 10],
  Moon: [1, 2, 4, 5, 7, 9, 10, 11],
  Mars: [1, 3, 6, 10, 11],
  Mercury: [2, 4, 6, 7, 9, 10, 11],
  Jupiter: [1, 2, 4, 5, 7, 9, 10, 11],
  Venus: [1, 2, 4, 5, 7, 8, 9, 12],
  Saturn: [2, 3, 6, 7, 8, 10, 11],
  Rahu: [3, 6, 10, 11],
  Ketu: [3, 6, 9, 12],
};

// Kaccha (Weak) Houses for each planet
const KACCHA_HOUSES: { [key: string]: number[] } = {
  Sun: [3, 6, 8, 11, 12],
  Moon: [3, 6, 8, 12],
  Mars: [2, 4, 5, 7, 8, 9, 12],
  Mercury: [1, 3, 5, 8, 12],
  Jupiter: [3, 6, 8, 12],
  Venus: [3, 6, 10, 11],
  Saturn: [1, 4, 5, 9, 12],
  Rahu: [1, 2, 4, 5, 7, 8, 9, 12],
  Ketu: [1, 2, 4, 5, 7, 8, 10, 11],
};

// Lal Kitab Aspects (different from Vedic)
const LAL_KITAB_ASPECTS: { [key: string]: number[] } = {
  Sun: [7],      // Only opposite house
  Moon: [7],
  Mars: [4, 7, 8], // 4th, 7th, 8th from its position
  Mercury: [7],
  Jupiter: [5, 7, 9], // 5th, 7th, 9th
  Venus: [7],
  Saturn: [3, 7, 10], // 3rd, 7th, 10th
  Rahu: [5, 7, 9, 12],
  Ketu: [5, 7, 9],
};

// ==================== DEBT (RINA) DETECTION ====================

/**
 * Check for Father Debt (Pitri Rina)
 */
export function checkFatherDebt(planets: any): boolean {
  // Sun in 6th, 8th, or 12th house indicates father debt
  const sunHouse = planets.SUN.house;
  if ([6, 8, 12].includes(sunHouse)) return true;

  // Sun with malefics (Rahu, Ketu, Saturn)
  const sunSign = planets.SUN.sign;
  const rahuSign = planets.RAHU?.sign;
  const ketuSign = planets.KETU?.sign;
  const saturnSign = planets.SATURN?.sign;

  if (sunSign === rahuSign || sunSign === ketuSign || sunSign === saturnSign) {
    return true;
  }

  return false;
}

/**
 * Check for Mother Debt (Matri Rina)
 */
export function checkMotherDebt(planets: any): boolean {
  // Moon afflicted indicates mother debt
  const moonHouse = planets.MOON.house;
  if ([6, 8, 12].includes(moonHouse)) return true;

  // Moon with malefics
  const moonSign = planets.MOON.sign;
  const rahuSign = planets.RAHU?.sign;
  const ketuSign = planets.KETU?.sign;

  if (moonSign === rahuSign || moonSign === ketuSign) {
    return true;
  }

  return false;
}

/**
 * Check for Brother Debt (Bhratri Rina)
 */
export function checkBrotherDebt(planets: any): boolean {
  // Mars in certain houses
  const marsHouse = planets.MARS.house;
  if ([6, 8, 12].includes(marsHouse)) return true;

  // 3rd house afflictions
  // Check if 3rd house lord is afflicted
  return false;
}

/**
 * Check for Woman Debt (Stri Rina)
 */
export function checkWomanDebt(planets: any): boolean {
  // Venus afflicted
  const venusHouse = planets.VENUS.house;
  if ([6, 8, 12].includes(venusHouse)) return true;

  // Venus with malefics
  const venusSign = planets.VENUS.sign;
  const rahuSign = planets.RAHU?.sign;
  const saturnSign = planets.SATURN?.sign;

  if (venusSign === rahuSign || venusSign === saturnSign) {
    return true;
  }

  return false;
}

/**
 * Check for Self Debt (Atma Rina)
 */
export function checkSelfDebt(planets: any): boolean {
  // Ascendant lord afflicted or in bad house
  // Ketu in 1st house
  const ketuHouse = planets.KETU?.house;
  if (ketuHouse === 1) return true;

  return false;
}

// ==================== BLIND & SLEEPING PLANETS ====================

/**
 * Identify Blind Planets (Andhe Grah)
 * Planets that cannot see/aspect properly
 */
export function identifyBlindPlanets(planets: any): string[] {
  const blind: string[] = [];

  for (const [name, planet] of Object.entries(planets)) {
    const p = planet as any;

    // Planet in 12th house from Sun is blind
    const sunHouse = planets.SUN.house;
    if (p.house === (sunHouse === 1 ? 12 : sunHouse - 1)) {
      blind.push(name);
    }
  }

  return blind;
}

/**
 * Identify Sleeping Planets (Sone Grah)
 */
export function identifySleepingPlanets(planets: any): string[] {
  const sleeping: string[] = [];

  for (const [name, planet] of Object.entries(planets)) {
    const p = planet as any;

    // Planet in Kaccha house is sleeping
    const kacchaHouses = KACCHA_HOUSES[name];
    if (kacchaHouses && kacchaHouses.includes(p.house)) {
      sleeping.push(name);
    }
  }

  return sleeping;
}

// ==================== LAL KITAB YOGAS ====================

/**
 * Detect Lal Kitab specific yogas
 */
export function detectLalKitabYogas(planets: any): any[] {
  const yogas: any[] = [];

  // 1. Kalsarp Yoga (all planets between Rahu-Ketu)
  // (Already implemented in vedic-engine)

  // 2. Buddhaaditya Yoga (Mercury + Sun in same house)
  if (planets.SUN.house === planets.MERCURY.house) {
    yogas.push({
      name: 'Buddhaaditya Yoga',
      description: 'Sun and Mercury together - Intelligence and eloquence',
      strength: 'Medium',
      house: planets.SUN.house,
    });
  }

  // 3. Chandra Mangal Yoga (Moon + Mars)
  if (planets.MOON.house === planets.MARS.house) {
    yogas.push({
      name: 'Chandra Mangal Yoga',
      description: 'Moon and Mars together - Wealth from property',
      strength: 'Strong',
      house: planets.MOON.house,
    });
  }

  // 4. Guru Chandal Yoga (Jupiter + Rahu)
  if (planets.JUPITER.house === planets.RAHU?.house) {
    yogas.push({
      name: 'Guru Chandal Yoga',
      description: 'Jupiter and Rahu - Challenges in wisdom, requires remedies',
      strength: 'Challenging',
      house: planets.JUPITER.house,
    });
  }

  // 5. Empty Houses (considered good in Lal Kitab)
  const occupiedHouses = new Set(Object.values(planets).map((p: any) => p.house));
  const emptyHouses = [];
  for (let i = 1; i <= 12; i++) {
    if (!occupiedHouses.has(i)) {
      emptyHouses.push(i);
    }
  }

  if (emptyHouses.length > 0) {
    yogas.push({
      name: 'Empty Houses',
      description: 'Empty houses are neutral and good in Lal Kitab',
      houses: emptyHouses,
      strength: 'Neutral',
    });
  }

  return yogas;
}

// ==================== REMEDIES GENERATION ====================

/**
 * Generate Lal Kitab remedies based on afflictions
 */
export function generateLalKitabRemedies(
  planets: any,
  debts: any,
  blindPlanets: string[],
  sleepingPlanets: string[]
): any[] {
  const remedies: any[] = [];

  // Remedies for Father Debt
  if (debts.fatherDebt) {
    remedies.push({
      issue: 'Father Debt (Pitri Rina)',
      affectedPlanet: 'Sun',
      type: 'DONATION',
      title: 'Feed Jaggery to Cow',
      description: 'Offer jaggery (gur) to a cow every Sunday for 43 days',
      instructions: ['Wake up early on Sunday', 'Buy fresh jaggery', 'Feed a cow', 'Do not eat anything before'],
      materials: ['Jaggery (250g)'],
      startDay: 'Sunday',
      duration: 43,
      estimatedCost: '₹10 per week',
      difficulty: 'VERY_EASY',
      effectiveness: 8,
    });
  }

  // Remedies for Mother Debt
  if (debts.motherDebt) {
    remedies.push({
      issue: 'Mother Debt (Matri Rina)',
      affectedPlanet: 'Moon',
      type: 'WATER_REMEDY',
      title: 'Flow Milk in Running Water',
      description: 'Pour milk in running water (river/stream) on Mondays',
      instructions: ['Buy fresh milk', 'Go to a river or stream', 'Pour milk while praying', 'Do for 43 Mondays'],
      materials: ['Fresh milk (500ml)'],
      startDay: 'Monday',
      duration: 43,
      estimatedCost: '₹50 per week',
      difficulty: 'EASY',
      effectiveness: 9,
    });
  }

  // Remedies for Blind Planets
  blindPlanets.forEach(planet => {
    remedies.push({
      issue: `Blind ${planet}`,
      affectedPlanet: planet,
      type: 'FEEDING',
      title: `Feed ${planet === 'MARS' ? 'Red Lentils to Birds' : 'Appropriate Food'}`,
      description: `Awaken blind ${planet} by regular feeding`,
      instructions: ['Feed daily for 40 days', 'Feed before you eat', 'Maintain consistency'],
      materials: getLalKitabMaterialForPlanet(planet),
      duration: 40,
      difficulty: 'EASY',
      effectiveness: 7,
    });
  });

  // Remedies for Sleeping Planets
  sleepingPlanets.forEach(planet => {
    remedies.push({
      issue: `Sleeping ${planet}`,
      affectedPlanet: planet,
      type: 'BURIAL',
      title: `Bury Items for ${planet}`,
      description: `Bury specific items to activate sleeping ${planet}`,
      instructions: ['Bury on the appropriate day', 'Bury in your home compound', 'Bury before sunrise'],
      materials: getBurialItemsForPlanet(planet),
      difficulty: 'MODERATE',
      effectiveness: 8,
    });
  });

  // Generic Money Remedy
  remedies.push({
    issue: 'Financial Prosperity',
    affectedPlanet: 'Jupiter',
    type: 'FEEDING',
    title: 'Feed Flour Balls to Fish',
    description: 'Make flour balls and feed fish in a pond or river',
    instructions: [
      'Make small balls from wheat flour',
      'Go to a pond/river',
      'Feed fish on Thursdays',
      'Do for 43 consecutive Thursdays'
    ],
    materials: ['Wheat flour (1 cup)'],
    startDay: 'Thursday',
    duration: 43,
    estimatedCost: 'Free',
    difficulty: 'VERY_EASY',
    effectiveness: 7,
  });

  return remedies;
}

function getLalKitabMaterialForPlanet(planet: string): string[] {
  const materials: { [key: string]: string[] } = {
    SUN: ['Wheat', 'Jaggery'],
    MOON: ['Rice', 'Milk'],
    MARS: ['Red Lentils', 'Jaggery'],
    MERCURY: ['Green Gram'],
    JUPITER: ['Yellow Gram', 'Turmeric'],
    VENUS: ['White Rice', 'Sugar'],
    SATURN: ['Black Sesame Seeds', 'Mustard Oil'],
    RAHU: ['Coconut'],
    KETU: ['Black Blanket for Dogs'],
  };
  return materials[planet] || ['Appropriate items'];
}

function getBurialItemsForPlanet(planet: string): string[] {
  const items: { [key: string]: string[] } = {
    SUN: ['Copper coin'],
    MOON: ['Silver item'],
    MARS: ['Red coral or red cloth'],
    MERCURY: ['Green items'],
    JUPITER: ['Yellow items, turmeric'],
    VENUS: ['White items'],
    SATURN: ['Iron items'],
    RAHU: ['Coconut'],
    KETU: ['White sesame seeds'],
  };
  return items[planet] || ['Appropriate items'];
}

// ==================== MAIN LAL KITAB GENERATION ====================

export interface LalKitabInput {
  birthDate: Date;
  birthTime: string;
  birthPlace: string;
  birthLat: number;
  birthLng: number;
  timezone?: string;
}

export async function generateLalKitabKundli(input: LalKitabInput) {
  // First generate Vedic Kundli (Lal Kitab uses same planetary positions)
  const vedicKundli = await generateKundli({
    ...input,
    ayanamsa: 'LAHIRI', // Lal Kitab uses Lahiri ayanamsa
  });

  const planets = vedicKundli.planets;

  // Check for Debts (Rinas)
  const debts = {
    fatherDebt: checkFatherDebt(planets),
    motherDebt: checkMotherDebt(planets),
    brotherDebt: checkBrotherDebt(planets),
    womanDebt: checkWomanDebt(planets),
    selfDebt: checkSelfDebt(planets),
  };

  // Identify Blind and Sleeping Planets
  const blindPlanets = identifyBlindPlanets(planets);
  const sleepingPlanets = identifySleepingPlanets(planets);

  // Identify Pakka and Kaccha Houses
  const pakkaHouses: number[] = [];
  const kacchaHouses: number[] = [];

  for (const [name, planet] of Object.entries(planets)) {
    const p = planet as any;
    if (PAKKA_HOUSES[name]?.includes(p.house)) {
      pakkaHouses.push(p.house);
    }
    if (KACCHA_HOUSES[name]?.includes(p.house)) {
      kacchaHouses.push(p.house);
    }
  }

  // Detect Yogas
  const yogas = detectLalKitabYogas(planets);

  // Generate Remedies
  const remedies = generateLalKitabRemedies(planets, debts, blindPlanets, sleepingPlanets);

  // Generate Predictions
  const predictions = generateLalKitabPredictions(planets, debts, yogas);

  return {
    birthDetails: input,
    planets,
    houses: vedicKundli.houseCusps,
    debts,
    debtsAnalysis: analyzeDebts(debts),
    blindPlanets,
    sleepingPlanets,
    pakkaHouses: [...new Set(pakkaHouses)],
    kacchaHouses: [...new Set(kacchaHouses)],
    yogas,
    remedies,
    predictions,
    warnings: generateWarnings(debts, blindPlanets),
    opportunities: generateOpportunities(planets, yogas),
    generatedAt: new Date(),
  };
}

function analyzeDebts(debts: any): any {
  return {
    totalDebts: Object.values(debts).filter(Boolean).length,
    severeDebts: debts.fatherDebt || debts.motherDebt ? ['Father or Mother debt requires priority'] : [],
    recommendations: 'Perform remedies regularly for 43 days minimum',
  };
}

function generateLalKitabPredictions(planets: any, debts: any, yogas: any[]): string {
  let predictions = '';

  if (debts.fatherDebt) {
    predictions += 'Challenges with father or paternal lineage. Remedies recommended. ';
  }
  if (debts.motherDebt) {
    predictions += 'Emotional challenges, mother\'s health needs attention. ';
  }

  return predictions || 'Overall favorable chart. Regular gratitude and charity recommended.';
}

function generateWarnings(debts: any, blindPlanets: string[]): string[] {
  const warnings: string[] = [];

  if (debts.fatherDebt) warnings.push('Father debt: Respect elders, avoid conflicts with father');
  if (debts.motherDebt) warnings.push('Mother debt: Take care of mother\'s health');
  if (blindPlanets.length > 0) warnings.push(`Blind planets: ${blindPlanets.join(', ')} need awakening`);

  return warnings;
}

function generateOpportunities(planets: any, yogas: any[]): string[] {
  const opportunities: string[] = [];

  yogas.forEach(yoga => {
    if (yoga.strength === 'Strong') {
      opportunities.push(`${yoga.name} brings ${yoga.description}`);
    }
  });

  return opportunities.length > 0 ? opportunities : ['Focus on remedies for best results'];
}

export default {
  generateLalKitabKundli,
  checkFatherDebt,
  checkMotherDebt,
  generateLalKitabRemedies,
};
