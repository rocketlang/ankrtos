/**
 * Medical Astrology & Ayurvedic Jyotish Engine
 * Links planetary positions with health conditions and Ayurvedic doshas
 */

// ==================== CONSTANTS ====================

// Planet-Body Part Correlations (Ayurvedic Jyotish)
export const PLANET_BODY_PARTS = {
  Sun: {
    primary: ['Heart', 'Eyes', 'Head', 'Bones', 'Right eye (male)', 'Vital energy'],
    secondary: ['Stomach', 'Skin', 'Face', 'Spine'],
    element: 'Fire',
    dosha: 'Pitta',
    diseases: ['Heart disease', 'Eye problems', 'Fever', 'Bone issues', 'Headaches', 'Low vitality'],
  },
  Moon: {
    primary: ['Mind', 'Emotions', 'Breast', 'Stomach', 'Left eye (female)', 'Fluids', 'Blood'],
    secondary: ['Lungs', 'Lymphatic system', 'Menstruation'],
    element: 'Water',
    dosha: 'Kapha',
    diseases: ['Mental disorders', 'Depression', 'Anxiety', 'Digestive issues', 'Fluid retention', 'Hormonal imbalance'],
  },
  Mars: {
    primary: ['Blood', 'Muscles', 'Bone marrow', 'Energy', 'Genitals', 'Rectum'],
    secondary: ['Nose', 'Forehead', 'Neck'],
    element: 'Fire',
    dosha: 'Pitta',
    diseases: ['Blood disorders', 'Accidents', 'Surgeries', 'Inflammation', 'Fevers', 'Cuts/burns', 'High BP'],
  },
  Mercury: {
    primary: ['Nervous system', 'Speech', 'Skin', 'Tongue', 'Hands', 'Intelligence'],
    secondary: ['Lungs', 'Intestines', 'Thyroid'],
    element: 'Earth',
    dosha: 'Vata/Pitta',
    diseases: ['Nervous disorders', 'Skin problems', 'Speech issues', 'Anxiety', 'Respiratory issues', 'IBS'],
  },
  Jupiter: {
    primary: ['Liver', 'Fat', 'Pancreas', 'Thighs', 'Arteries', 'Wisdom'],
    secondary: ['Ears', 'Tongue', 'Memory'],
    element: 'Ether',
    dosha: 'Kapha',
    diseases: ['Liver disease', 'Diabetes', 'Obesity', 'Cholesterol', 'Tumors', 'Ear problems'],
  },
  Venus: {
    primary: ['Kidneys', 'Reproductive organs', 'Throat', 'Face', 'Sexual energy'],
    secondary: ['Eyes', 'Semen/ovum', 'Skin'],
    element: 'Water',
    dosha: 'Kapha/Vata',
    diseases: ['Kidney stones', 'Sexual disorders', 'Throat issues', 'Skin problems', 'Diabetes', 'Urinary issues'],
  },
  Saturn: {
    primary: ['Bones', 'Teeth', 'Joints', 'Knees', 'Ears', 'Longevity'],
    secondary: ['Spleen', 'Legs', 'Nerves'],
    element: 'Air',
    dosha: 'Vata',
    diseases: ['Chronic diseases', 'Arthritis', 'Paralysis', 'Joint pain', 'Dental issues', 'Deafness', 'Depression'],
  },
  Rahu: {
    primary: ['Phobia', 'Obsession', 'Poison', 'Skin', 'Mental confusion'],
    secondary: ['Allergies', 'Cancer risk'],
    element: 'Air',
    dosha: 'Vata',
    diseases: ['Mysterious ailments', 'Allergies', 'Cancer', 'Addiction', 'Psychosis', 'Viral diseases', 'Phobias'],
  },
  Ketu: {
    primary: ['Spine', 'Accidents', 'Mysterious pains', 'Spiritual ailments'],
    secondary: ['Abdomen', 'Intestines'],
    element: 'Fire',
    dosha: 'Pitta/Vata',
    diseases: ['Accidents', 'Mysterious pains', 'Intestinal issues', 'Spiritual crisis', 'Worms', 'Poisoning'],
  },
};

// House-Health Correlations
export const HOUSE_HEALTH = {
  1: {
    name: 'Ascendant/Lagna',
    significance: 'Physical body, overall vitality, constitution',
    represents: 'Head, brain, general health',
  },
  2: {
    name: 'Second House',
    significance: 'Face, speech, food intake',
    represents: 'Face, right eye, throat, teeth, tongue',
  },
  3: {
    name: 'Third House',
    significance: 'Shoulders, arms, courage',
    represents: 'Ears, shoulders, arms, hands, courage',
  },
  4: {
    name: 'Fourth House',
    significance: 'Chest, lungs, heart',
    represents: 'Chest, lungs, heart, emotional health',
  },
  5: {
    name: 'Fifth House',
    significance: 'Stomach, intelligence, children',
    represents: 'Stomach, upper abdomen, heart, mind',
  },
  6: {
    name: 'Sixth House (Disease House)',
    significance: 'Disease, enemies, debts, obstacles',
    represents: 'Lower abdomen, intestines, kidney, immune system',
    critical: true,
  },
  7: {
    name: 'Seventh House',
    significance: 'Reproductive organs, partnerships',
    represents: 'Groin, reproductive organs, lower back',
  },
  8: {
    name: 'Eighth House (Longevity)',
    significance: 'Chronic disease, death, transformation',
    represents: 'Chronic ailments, accidents, sexual organs, anus',
    critical: true,
  },
  9: {
    name: 'Ninth House',
    significance: 'Thighs, fortune, spirituality',
    represents: 'Thighs, hips, arterial system',
  },
  10: {
    name: 'Tenth House',
    significance: 'Knees, career stress',
    represents: 'Knees, joints, bones',
  },
  11: {
    name: 'Eleventh House',
    significance: 'Calves, ankles, gains',
    represents: 'Calves, ankles, left ear',
  },
  12: {
    name: 'Twelfth House (Hospitalization)',
    significance: 'Feet, losses, hospitalization, isolation',
    represents: 'Feet, left eye, sleep disorders, hospitalization',
    critical: true,
  },
};

// Dosha Determination from Chart
export const DOSHA_PLANET_CORRELATION = {
  Vata: ['Saturn', 'Mercury', 'Rahu'],
  Pitta: ['Sun', 'Mars', 'Ketu'],
  Kapha: ['Moon', 'Jupiter', 'Venus'],
};

// Ayurvedic Dosha Characteristics
export const DOSHA_PROFILES = {
  Vata: {
    element: ['Air', 'Ether'],
    qualities: ['Dry', 'Light', 'Cold', 'Rough', 'Subtle', 'Mobile'],
    bodyType: 'Thin, light frame',
    strengths: ['Creative', 'Quick-thinking', 'Energetic'],
    weaknesses: ['Anxiety', 'Irregular digestion', 'Joint pain', 'Insomnia'],
    diseases: ['Arthritis', 'Constipation', 'Nervous disorders', 'Anxiety', 'Insomnia', 'Back pain'],
    balancingFoods: ['Warm', 'Moist', 'Grounding foods', 'Ghee', 'Nuts', 'Cooked vegetables'],
    avoidFoods: ['Raw vegetables', 'Beans', 'Dry foods', 'Caffeine'],
  },
  Pitta: {
    element: ['Fire', 'Water'],
    qualities: ['Hot', 'Sharp', 'Light', 'Liquid', 'Spreading'],
    bodyType: 'Medium build, athletic',
    strengths: ['Intelligent', 'Focused', 'Good digestion'],
    weaknesses: ['Anger', 'Inflammation', 'Acidity', 'Skin rashes'],
    diseases: ['Inflammation', 'Ulcers', 'Acid reflux', 'Skin rashes', 'High BP', 'Liver issues'],
    balancingFoods: ['Cool', 'Sweet', 'Bitter foods', 'Cucumber', 'Coconut', 'Mint'],
    avoidFoods: ['Spicy', 'Sour', 'Salty', 'Fried foods', 'Alcohol'],
  },
  Kapha: {
    element: ['Water', 'Earth'],
    qualities: ['Heavy', 'Slow', 'Cool', 'Oily', 'Smooth', 'Stable'],
    bodyType: 'Large frame, sturdy',
    strengths: ['Calm', 'Steady', 'Strong immunity'],
    weaknesses: ['Weight gain', 'Lethargy', 'Congestion'],
    diseases: ['Obesity', 'Diabetes', 'Congestion', 'Asthma', 'Depression', 'High cholesterol'],
    balancingFoods: ['Light', 'Dry', 'Warm foods', 'Spices', 'Vegetables', 'Legumes'],
    avoidFoods: ['Heavy', 'Oily', 'Sweet', 'Dairy', 'Fried foods'],
  },
};

// Remedial Measures
export const PLANETARY_REMEDIES = {
  Sun: {
    gemstone: 'Ruby',
    metal: 'Gold',
    mantra: 'Om Suryaya Namaha',
    deity: 'Lord Surya',
    fastingDay: 'Sunday',
    donation: 'Wheat, jaggery, red cloth',
    herbs: ['Aloe vera', 'Saffron', 'Cinnamon'],
  },
  Moon: {
    gemstone: 'Pearl',
    metal: 'Silver',
    mantra: 'Om Chandraya Namaha',
    deity: 'Goddess Parvati',
    fastingDay: 'Monday',
    donation: 'White rice, milk, silver',
    herbs: ['Ashwagandha', 'Brahmi', 'Shatavari'],
  },
  Mars: {
    gemstone: 'Red Coral',
    metal: 'Copper',
    mantra: 'Om Mangalaya Namaha',
    deity: 'Lord Hanuman',
    fastingDay: 'Tuesday',
    donation: 'Red lentils, jaggery',
    herbs: ['Turmeric', 'Ginger', 'Neem'],
  },
  Mercury: {
    gemstone: 'Emerald',
    metal: 'Bronze',
    mantra: 'Om Budhaya Namaha',
    deity: 'Lord Vishnu',
    fastingDay: 'Wednesday',
    donation: 'Green vegetables, books',
    herbs: ['Tulsi', 'Brahmi', 'Gotu kola'],
  },
  Jupiter: {
    gemstone: 'Yellow Sapphire',
    metal: 'Gold',
    mantra: 'Om Gurave Namaha',
    deity: 'Lord Brihaspati',
    fastingDay: 'Thursday',
    donation: 'Yellow cloth, turmeric, gold',
    herbs: ['Ashwagandha', 'Haritaki', 'Licorice'],
  },
  Venus: {
    gemstone: 'Diamond/White Sapphire',
    metal: 'Silver',
    mantra: 'Om Shukraya Namaha',
    deity: 'Goddess Lakshmi',
    fastingDay: 'Friday',
    donation: 'White rice, sugar, perfume',
    herbs: ['Shatavari', 'Rose', 'Sandalwood'],
  },
  Saturn: {
    gemstone: 'Blue Sapphire',
    metal: 'Iron',
    mantra: 'Om Shanaye Namaha',
    deity: 'Lord Shani',
    fastingDay: 'Saturday',
    donation: 'Black sesame, iron, blue cloth',
    herbs: ['Guggulu', 'Triphala', 'Shilajit'],
  },
  Rahu: {
    gemstone: 'Hessonite (Gomed)',
    metal: 'Lead',
    mantra: 'Om Rahave Namaha',
    deity: 'Goddess Durga',
    fastingDay: 'Saturday',
    donation: 'Mustard oil, black cloth',
    herbs: ['Ashwagandha', 'Guggulu', 'Calamus'],
  },
  Ketu: {
    gemstone: "Cat's Eye",
    metal: 'Bronze',
    mantra: 'Om Ketave Namaha',
    deity: 'Lord Ganesha',
    fastingDay: 'Tuesday',
    donation: 'Sesame, blanket',
    herbs: ['Ashwagandha', 'Brahmi', 'Calamus'],
  },
};

// ==================== INTERFACES ====================

export interface MedicalChartInput {
  birthDate: Date;
  birthTime: string;
  birthLat: number;
  birthLng: number;
  timezone: string;
  kundliData?: any; // Existing Vedic kundli if available
}

export interface PlanetHealthAnalysis {
  planet: string;
  strength: number; // 0-100
  bodyParts: string[];
  potentialIssues: string[];
  remedies: string[];
  dosha: string;
}

export interface DoshaAnalysis {
  dominantDosha: string;
  secondaryDosha?: string;
  doshaPercentages: {
    vata: number;
    pitta: number;
    kapha: number;
  };
  constitutionType: string;
  imbalances: string[];
  recommendations: string[];
}

export interface HealthVulnerability {
  bodySystem: string;
  riskLevel: string; // High, Medium, Low
  causes: string[];
  prevention: string[];
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate Dosha from planetary positions
 */
function calculateDoshaFromChart(planetStrengths: Record<string, number>): DoshaAnalysis {
  let vataScore = 0;
  let pittaScore = 0;
  let kaphaScore = 0;

  // Calculate based on planet strengths
  DOSHA_PLANET_CORRELATION.Vata.forEach((planet) => {
    vataScore += planetStrengths[planet] || 0;
  });

  DOSHA_PLANET_CORRELATION.Pitta.forEach((planet) => {
    pittaScore += planetStrengths[planet] || 0;
  });

  DOSHA_PLANET_CORRELATION.Kapha.forEach((planet) => {
    kaphaScore += planetStrengths[planet] || 0;
  });

  // Normalize to percentages
  const total = vataScore + pittaScore + kaphaScore;
  const doshaPercentages = {
    vata: Math.round((vataScore / total) * 100),
    pitta: Math.round((pittaScore / total) * 100),
    kapha: Math.round((kaphaScore / total) * 100),
  };

  // Determine dominant dosha
  const sorted = Object.entries(doshaPercentages).sort((a, b) => b[1] - a[1]);
  const dominantDosha = sorted[0][0].charAt(0).toUpperCase() + sorted[0][0].slice(1);
  const secondaryDosha = sorted[1][1] > 30 ? sorted[1][0].charAt(0).toUpperCase() + sorted[1][0].slice(1) : undefined;

  // Constitution type
  const constitutionType =
    sorted[0][1] > 60
      ? 'Single Doshic'
      : sorted[1][1] > 30
      ? 'Dual Doshic'
      : 'Tridoshic';

  return {
    dominantDosha,
    secondaryDosha,
    doshaPercentages,
    constitutionType,
    imbalances: [],
    recommendations: [],
  };
}

/**
 * Analyze planet for health implications
 */
function analyzePlanetHealth(
  planet: string,
  strength: number,
  house: number,
  aspects: string[]
): PlanetHealthAnalysis {
  const planetData = PLANET_BODY_PARTS[planet];
  const potentialIssues: string[] = [];

  // Weak planet in critical houses indicates health issues
  if (strength < 30) {
    potentialIssues.push(...planetData.diseases.slice(0, 3));
  }

  // Planet in 6th (disease), 8th (chronic), or 12th (hospitalization) house
  if ([6, 8, 12].includes(house)) {
    potentialIssues.push(`${planet} in house ${house} - increased risk of ${planetData.diseases[0]}`);
  }

  // Afflicted by malefics
  if (aspects.some((a) => ['Saturn', 'Mars', 'Rahu', 'Ketu'].includes(a))) {
    potentialIssues.push(`Affliction affecting ${planetData.primary.join(', ')}`);
  }

  const remedyData = PLANETARY_REMEDIES[planet];
  const remedies = [
    `Wear ${remedyData.gemstone}`,
    `Chant: ${remedyData.mantra}`,
    `Herbs: ${remedyData.herbs.join(', ')}`,
    `Fast on ${remedyData.fastingDay}`,
  ];

  return {
    planet,
    strength,
    bodyParts: planetData.primary,
    potentialIssues,
    remedies,
    dosha: planetData.dosha,
  };
}

/**
 * Analyze critical houses for health
 */
function analyzeCriticalHouses(houseData: any) {
  const analysis = {
    firstHouse: {
      vitality: houseData[1]?.strength || 50,
      issues: houseData[1]?.issues || [],
    },
    sixthHouse: {
      diseaseRisk: houseData[6]?.malefics || [],
      enemies: houseData[6]?.planets || [],
    },
    eighthHouse: {
      chronicRisk: houseData[8]?.malefics || [],
      longevity: houseData[8]?.strength || 50,
    },
    twelfthHouse: {
      hospitalizationRisk: houseData[12]?.malefics || [],
      losses: houseData[12]?.planets || [],
    },
  };

  return analysis;
}

/**
 * Generate health vulnerabilities
 */
function identifyHealthVulnerabilities(
  planetAnalyses: PlanetHealthAnalysis[],
  doshaAnalysis: DoshaAnalysis
): HealthVulnerability[] {
  const vulnerabilities: HealthVulnerability[] = [];

  // Cardiovascular system
  const sunAnalysis = planetAnalyses.find((p) => p.planet === 'Sun');
  if (sunAnalysis && sunAnalysis.strength < 40) {
    vulnerabilities.push({
      bodySystem: 'Cardiovascular System',
      riskLevel: 'High',
      causes: ['Weak Sun affecting heart', ...sunAnalysis.potentialIssues],
      prevention: sunAnalysis.remedies,
    });
  }

  // Digestive system
  const moonAnalysis = planetAnalyses.find((p) => p.planet === 'Moon');
  if (moonAnalysis && moonAnalysis.strength < 40) {
    vulnerabilities.push({
      bodySystem: 'Digestive System',
      riskLevel: 'Medium',
      causes: ['Weak Moon affecting stomach', ...moonAnalysis.potentialIssues],
      prevention: moonAnalysis.remedies,
    });
  }

  // Add dosha-specific vulnerabilities
  const doshaProfile = DOSHA_PROFILES[doshaAnalysis.dominantDosha];
  doshaProfile.diseases.slice(0, 3).forEach((disease) => {
    vulnerabilities.push({
      bodySystem: `${doshaAnalysis.dominantDosha} Constitution`,
      riskLevel: 'Medium',
      causes: [`${doshaAnalysis.dominantDosha} imbalance`, disease],
      prevention: doshaProfile.balancingFoods,
    });
  });

  return vulnerabilities;
}

// ==================== MAIN FUNCTION ====================

/**
 * Generate complete Medical Astrology Chart
 */
export async function generateMedicalChart(input: MedicalChartInput) {
  // Simplified - would integrate with full Vedic kundli calculation
  const planetStrengths = {
    Sun: 70,
    Moon: 60,
    Mars: 50,
    Mercury: 75,
    Jupiter: 80,
    Venus: 65,
    Saturn: 40,
    Rahu: 30,
    Ketu: 35,
  };

  // Calculate Dosha
  const doshaAnalysis = calculateDoshaFromChart(planetStrengths);

  // Analyze each planet for health
  const planetAnalyses: PlanetHealthAnalysis[] = Object.entries(planetStrengths).map(
    ([planet, strength]) => {
      return analyzePlanetHealth(planet, strength, Math.floor(Math.random() * 12) + 1, []);
    }
  );

  // Identify vulnerabilities
  const vulnerabilities = identifyHealthVulnerabilities(planetAnalyses, doshaAnalysis);

  // Generate diet recommendations
  const doshaProfile = DOSHA_PROFILES[doshaAnalysis.dominantDosha];
  const dietRecommendations = [
    ...doshaProfile.balancingFoods.map((food) => `Eat: ${food}`),
    ...doshaProfile.avoidFoods.map((food) => `Avoid: ${food}`),
  ];

  // Overall health score
  const averageStrength = Object.values(planetStrengths).reduce((a, b) => a + b) / 9;
  const overallHealthScore = Math.round(averageStrength);

  return {
    doshaAnalysis,
    planetAnalyses,
    vulnerabilities,
    dietRecommendations,
    overallHealthScore,
    lifestyleGuidance: [
      `Balance ${doshaAnalysis.dominantDosha} through ${doshaProfile.balancingFoods.join(', ')}`,
      'Practice yoga and pranayama daily',
      'Follow Ayurvedic daily routine (Dinacharya)',
      'Get adequate sleep (Kapha: 6-7hrs, Pitta: 7-8hrs, Vata: 8-9hrs)',
    ],
    exerciseRecommendations: [
      doshaAnalysis.dominantDosha === 'Vata' ? 'Gentle yoga, walking, tai chi' : '',
      doshaAnalysis.dominantDosha === 'Pitta' ? 'Swimming, moderate exercise, avoid overheating' : '',
      doshaAnalysis.dominantDosha === 'Kapha' ? 'Vigorous exercise, running, aerobics' : '',
    ].filter(Boolean),
  };
}

/**
 * Predict health issues based on dashas and transits
 */
export function predictHealthEvents(dashas: any[], transits: any[]) {
  const predictions: any[] = [];

  // Example: Saturn dasha can trigger chronic issues
  dashas.forEach((dasha) => {
    if (dasha.planet === 'Saturn') {
      predictions.push({
        healthIssue: 'Joint pain or chronic condition',
        severity: 'Moderate',
        timing: dasha.period,
        remedies: PLANETARY_REMEDIES.Saturn.herbs,
      });
    }

    if (dasha.planet === 'Rahu') {
      predictions.push({
        healthIssue: 'Mysterious ailment or mental confusion',
        severity: 'Variable',
        timing: dasha.period,
        remedies: PLANETARY_REMEDIES.Rahu.herbs,
      });
    }
  });

  return predictions;
}

/**
 * Recommend optimal surgery timing
 */
export function getSurgeryTiming(planetaryPositions: any) {
  return {
    avoidDays: [
      'Avoid Tuesday (Mars day) for surgeries',
      'Avoid Saturn transits over 8th house',
      'Avoid Rahu-Ketu axis on critical houses',
    ],
    favorableDays: [
      'Thursday (Jupiter day) - best for recovery',
      'Waxing Moon period - better healing',
      'Sun/Jupiter/Venus in strength',
    ],
  };
}
