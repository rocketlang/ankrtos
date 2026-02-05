// =====================================================
// CRYSTAL & GEMSTONE THERAPY ENGINE (RATNA CHIKITSA)
// Traditional Vedic Gemology + Modern Crystal Healing
// Founded by Jyotish Acharya Rakesh Sharma
// =====================================================

// ==================== NAVARATNA (NINE GEMS) ====================

export interface NavratnaGem {
  name: string;
  sanskrit: string;
  planet: string;
  element: string;
  chakra: string;
  color: string;
  hardness: number; // Mohs scale

  // Wearing Instructions
  finger: string;
  hand: string;
  metal: string[];
  dayToWear: string;
  timeToWear: string;
  nakshatra: string[];

  // Weight
  minimumCarats: number;
  recommendedCarats: number;
  maximumCarats: number;

  // Purification
  purificationMethod: string[];
  purificationMantra: string;
  purificationDays: number;

  // Energization
  energizationMantra: string;
  energizationCount: number; // 108, 1008, etc.
  energizationDeity: string;

  // Substitute Gems
  substitutes: string[];

  // Benefits
  benefits: string[];
  healingProperties: string[];

  // Contraindications
  avoidIf: string[];
  sideEffects: string[];
  trialPeriod: number; // Days

  // Cost
  priceRange: string; // INR per carat
}

export const NAVARATNA_GEMS: Record<string, NavratnaGem> = {
  Ruby: {
    name: 'Ruby',
    sanskrit: 'Manikya',
    planet: 'Sun',
    element: 'Fire',
    chakra: 'Solar Plexus',
    color: 'Deep Red',
    hardness: 9.0,

    finger: 'Ring finger',
    hand: 'Right',
    metal: ['Gold', 'Panchdhatu'],
    dayToWear: 'Sunday',
    timeToWear: 'Within 2 hours after sunrise',
    nakshatra: ['Krittika', 'Uttara Phalguni', 'Uttara Ashadha'],

    minimumCarats: 3,
    recommendedCarats: 5,
    maximumCarats: 7,

    purificationMethod: ['Raw milk', 'Gangajal', 'Honey', 'Ghee', 'Tulsi water'],
    purificationMantra: 'Om Suryaya Namaha',
    purificationDays: 3,

    energizationMantra: 'Om Hreem Suryaya Namaha Om',
    energizationCount: 108,
    energizationDeity: 'Lord Surya (Sun God)',

    substitutes: ['Red Garnet', 'Red Spinel', 'Red Tourmaline'],

    benefits: [
      'Strengthens leadership qualities',
      'Enhances self-confidence and authority',
      'Improves father-son relationship',
      'Boosts career and government favor',
      'Increases vitality and energy',
      'Helps overcome enemies',
    ],
    healingProperties: [
      'Heart health and circulation',
      'Strengthens eyesight',
      'Bone health',
      'Fever and inflammation reduction',
      'Improves blood pressure',
    ],

    avoidIf: ['Moon is weak', 'Saturn is strong in chart', 'During pregnancy (consult astrologer)'],
    sideEffects: ['Aggression', 'Anger', 'Heat in body', 'Sleep disturbance'],
    trialPeriod: 7,

    priceRange: '₹10,000-₹5,00,000 per carat',
  },

  Pearl: {
    name: 'Pearl',
    sanskrit: 'Moti',
    planet: 'Moon',
    element: 'Water',
    chakra: 'Sacral',
    color: 'White/Cream',
    hardness: 2.5,

    finger: 'Little finger',
    hand: 'Right',
    metal: ['Silver', 'White Gold'],
    dayToWear: 'Monday',
    timeToWear: 'Evening during waxing moon',
    nakshatra: ['Rohini', 'Hasta', 'Shravana'],

    minimumCarats: 5,
    recommendedCarats: 7,
    maximumCarats: 11,

    purificationMethod: ['Raw milk', 'Gangajal', 'Rose water'],
    purificationMantra: 'Om Chandraya Namaha',
    purificationDays: 1,

    energizationMantra: 'Om Shreem Chandraya Namaha',
    energizationCount: 108,
    energizationDeity: 'Goddess Parvati',

    substitutes: ['Moonstone', 'White Coral'],

    benefits: [
      'Emotional stability and peace of mind',
      'Strengthens mother-child relationship',
      'Improves memory and concentration',
      'Enhances intuition and psychic abilities',
      'Brings mental peace and reduces anxiety',
      'Helps in meditation',
    ],
    healingProperties: [
      'Hormonal balance (especially women)',
      'Digestive health',
      'Mental health and depression',
      'Sleep disorders and insomnia',
      'Reproductive health',
    ],

    avoidIf: ['Sun is very strong', 'During fever', 'If you have excess Kapha dosha'],
    sideEffects: ['Lethargy', 'Oversensitivity', 'Weight gain', 'Excessive emotions'],
    trialPeriod: 3,

    priceRange: '₹5,000-₹50,000 per carat',
  },

  RedCoral: {
    name: 'Red Coral',
    sanskrit: 'Moonga',
    planet: 'Mars',
    element: 'Fire',
    chakra: 'Root',
    color: 'Red/Orange-Red',
    hardness: 3.5,

    finger: 'Ring finger',
    hand: 'Right',
    metal: ['Copper', 'Gold'],
    dayToWear: 'Tuesday',
    timeToWear: 'Morning during waxing moon',
    nakshatra: ['Mrigashira', 'Chitra', 'Dhanishta'],

    minimumCarats: 6,
    recommendedCarats: 9,
    maximumCarats: 12,

    purificationMethod: ['Gangajal', 'Raw milk', 'Honey'],
    purificationMantra: 'Om Mangalaya Namaha',
    purificationDays: 3,

    energizationMantra: 'Om Kreem Mangalaya Namaha',
    energizationCount: 108,
    energizationDeity: 'Lord Hanuman',

    substitutes: ['Red Carnelian', 'Red Agate'],

    benefits: [
      'Courage and confidence',
      'Victory over enemies and competition',
      'Success in sports and physical activities',
      'Property and land acquisition',
      'Protection from accidents',
      'Mangal Dosha remedy',
    ],
    healingProperties: [
      'Blood disorders and anemia',
      'Boosts immunity',
      'Skin diseases',
      'Energy and stamina',
      'Bone marrow health',
    ],

    avoidIf: ['Sun is afflicted', 'Excessive anger issues', 'High blood pressure'],
    sideEffects: ['Aggression', 'Impulsiveness', 'Accidents', 'Conflicts'],
    trialPeriod: 7,

    priceRange: '₹2,000-₹20,000 per carat',
  },

  Emerald: {
    name: 'Emerald',
    sanskrit: 'Panna',
    planet: 'Mercury',
    element: 'Earth',
    chakra: 'Heart',
    color: 'Green',
    hardness: 7.5,

    finger: 'Little finger',
    hand: 'Right',
    metal: ['Gold', 'Silver', 'Bronze'],
    dayToWear: 'Wednesday',
    timeToWear: 'Morning',
    nakshatra: ['Ashlesha', 'Jyeshtha', 'Revati'],

    minimumCarats: 3,
    recommendedCarats: 5,
    maximumCarats: 7,

    purificationMethod: ['Gangajal', 'Raw milk', 'Tulsi water'],
    purificationMantra: 'Om Budhaya Namaha',
    purificationDays: 3,

    energizationMantra: 'Om Aim Budhaya Namaha',
    energizationCount: 108,
    energizationDeity: 'Lord Vishnu',

    substitutes: ['Green Tourmaline', 'Peridot', 'Green Agate'],

    benefits: [
      'Intelligence and memory enhancement',
      'Communication and speech skills',
      'Business and trade success',
      'Education and learning',
      'Creativity and artistic abilities',
      'Nervous system balance',
    ],
    healingProperties: [
      'Nervous system disorders',
      'Speech and respiratory problems',
      'Skin health',
      'Anxiety and stress',
      'Eye health',
    ],

    avoidIf: ['Mars and Sun are strong', 'Mental instability', 'Nervousness'],
    sideEffects: ['Overthinking', 'Restlessness', 'Nervous tension'],
    trialPeriod: 7,

    priceRange: '₹15,000-₹10,00,000 per carat',
  },

  YellowSapphire: {
    name: 'Yellow Sapphire',
    sanskrit: 'Pukhraj',
    planet: 'Jupiter',
    element: 'Ether',
    chakra: 'Crown',
    color: 'Yellow/Golden',
    hardness: 9.0,

    finger: 'Index finger',
    hand: 'Right',
    metal: ['Gold', 'Panchdhatu'],
    dayToWear: 'Thursday',
    timeToWear: 'Morning during Brahma Muhurta',
    nakshatra: ['Punarvasu', 'Vishakha', 'Purva Bhadrapada'],

    minimumCarats: 3,
    recommendedCarats: 5,
    maximumCarats: 7,

    purificationMethod: ['Gangajal', 'Raw milk', 'Honey', 'Ghee'],
    purificationMantra: 'Om Gurave Namaha',
    purificationDays: 3,

    energizationMantra: 'Om Greem Brihaspataye Namaha',
    energizationCount: 108,
    energizationDeity: 'Lord Brihaspati (Jupiter)',

    substitutes: ['Yellow Topaz', 'Citrine', 'Yellow Tourmaline'],

    benefits: [
      'Wealth and prosperity',
      'Spiritual growth and wisdom',
      'Marriage and childbirth',
      'Higher education and knowledge',
      'Good fortune and blessings',
      'Protects from evil eye',
    ],
    healingProperties: [
      'Liver and gallbladder health',
      'Diabetes management',
      'Obesity and weight control',
      'Fat metabolism',
      'Ear and hearing problems',
    ],

    avoidIf: ['Venus is very strong', 'Mercury is afflicted', 'Greed tendency'],
    sideEffects: ['Over-optimism', 'Laziness', 'Weight gain'],
    trialPeriod: 7,

    priceRange: '₹8,000-₹2,00,000 per carat',
  },

  Diamond: {
    name: 'Diamond',
    sanskrit: 'Heera',
    planet: 'Venus',
    element: 'Water',
    chakra: 'Crown',
    color: 'Colorless/White',
    hardness: 10.0,

    finger: 'Middle finger or Little finger',
    hand: 'Right',
    metal: ['White Gold', 'Platinum', 'Silver'],
    dayToWear: 'Friday',
    timeToWear: 'Morning',
    nakshatra: ['Bharani', 'Purva Phalguni', 'Purva Ashadha'],

    minimumCarats: 0.5,
    recommendedCarats: 1,
    maximumCarats: 2,

    purificationMethod: ['Gangajal', 'Rose water', 'Raw milk'],
    purificationMantra: 'Om Shukraya Namaha',
    purificationDays: 3,

    energizationMantra: 'Om Dreem Shukraya Namaha',
    energizationCount: 108,
    energizationDeity: 'Goddess Lakshmi',

    substitutes: ['White Sapphire', 'White Zircon', 'White Topaz'],

    benefits: [
      'Love and marital harmony',
      'Luxury and comfort',
      'Artistic and creative talents',
      'Beauty and attractiveness',
      'Sexual vitality',
      'Material pleasures',
    ],
    healingProperties: [
      'Reproductive health',
      'Kidney and urinary health',
      'Skin glow and beauty',
      'Hormonal balance',
      'Diabetes',
    ],

    avoidIf: ['Sun or Mars are very strong', 'Excessive materialism', 'During Saturn Dasha'],
    sideEffects: ['Laziness', 'Over-indulgence', 'Materialistic tendencies'],
    trialPeriod: 7,

    priceRange: '₹50,000-₹50,00,000 per carat',
  },

  BlueSapphire: {
    name: 'Blue Sapphire',
    sanskrit: 'Neelam',
    planet: 'Saturn',
    element: 'Air',
    chakra: 'Third Eye',
    color: 'Blue',
    hardness: 9.0,

    finger: 'Middle finger',
    hand: 'Right',
    metal: ['Iron', 'Silver', 'Panchdhatu'],
    dayToWear: 'Saturday',
    timeToWear: 'Evening',
    nakshatra: ['Pushya', 'Anuradha', 'Uttara Bhadrapada'],

    minimumCarats: 4,
    recommendedCarats: 6,
    maximumCarats: 9,

    purificationMethod: ['Gangajal', 'Raw milk', 'Black sesame water'],
    purificationMantra: 'Om Shanaye Namaha',
    purificationDays: 7,

    energizationMantra: 'Om Praam Preem Praum Sah Shanaischaraya Namaha',
    energizationCount: 108,
    energizationDeity: 'Lord Shani (Saturn)',

    substitutes: ['Blue Zircon', 'Amethyst', 'Iolite'],

    benefits: [
      'Saturn Mahadasha relief',
      'Discipline and focus',
      'Spiritual progress',
      'Protection from enemies',
      'Justice in legal matters',
      'Longevity',
    ],
    healingProperties: [
      'Joint and bone health',
      'Nerve disorders',
      'Paralysis',
      'Mental stability',
      'Chronic diseases',
    ],

    avoidIf: ['Sun or Mars are very strong', 'During pregnancy', 'Heart problems'],
    sideEffects: ['Depression', 'Accidents', 'Loss', 'Delays'],
    trialPeriod: 3, // VERY SHORT - this gem shows effects immediately

    priceRange: '₹5,000-₹5,00,000 per carat',
  },

  Hessonite: {
    name: 'Hessonite',
    sanskrit: 'Gomed',
    planet: 'Rahu',
    element: 'Air',
    chakra: 'Root',
    color: 'Honey/Brown',
    hardness: 7.0,

    finger: 'Middle finger',
    hand: 'Right',
    metal: ['Silver', 'Panchdhatu'],
    dayToWear: 'Saturday',
    timeToWear: 'Evening after sunset',
    nakshatra: ['Ardra', 'Swati', 'Shatabhisha'],

    minimumCarats: 5,
    recommendedCarats: 8,
    maximumCarats: 12,

    purificationMethod: ['Gangajal', 'Raw milk', 'Mustard oil'],
    purificationMantra: 'Om Rahave Namaha',
    purificationDays: 3,

    energizationMantra: 'Om Bhraam Bhreem Bhraum Sah Rahave Namaha',
    energizationCount: 108,
    energizationDeity: 'Goddess Durga',

    substitutes: ['Gomedh', 'Hessonite Garnet'],

    benefits: [
      'Sudden gains and lottery',
      'Foreign travel and settlement',
      'Political success',
      'Research and innovation',
      'Protection from evil spirits',
      'Kaal Sarp Dosha remedy',
    ],
    healingProperties: [
      'Poison elimination',
      'Skin diseases',
      'Allergies',
      'Mental confusion',
      'Cancer prevention',
    ],

    avoidIf: ['Moon is very weak', 'Mental instability', 'During pregnancy'],
    sideEffects: ['Confusion', 'Deception', 'Illusions', 'Addiction'],
    trialPeriod: 7,

    priceRange: '₹500-₹5,000 per carat',
  },

  CatsEye: {
    name: "Cat's Eye",
    sanskrit: 'Lehsunia',
    planet: 'Ketu',
    element: 'Fire',
    chakra: 'Root',
    color: 'Yellowish-Gray',
    hardness: 8.5,

    finger: 'Middle finger',
    hand: 'Right',
    metal: ['Silver', 'Panchdhatu'],
    dayToWear: 'Tuesday or Thursday',
    timeToWear: 'Sunset',
    nakshatra: ['Ashwini', 'Magha', 'Mula'],

    minimumCarats: 5,
    recommendedCarats: 7,
    maximumCarats: 11,

    purificationMethod: ['Gangajal', 'Raw milk', 'Sesame water'],
    purificationMantra: 'Om Ketave Namaha',
    purificationDays: 3,

    energizationMantra: 'Om Streem Ketve Namaha',
    energizationCount: 108,
    energizationDeity: 'Lord Ganesha',

    substitutes: ["Cat's Eye Quartz", 'Tiger Eye'],

    benefits: [
      'Spiritual liberation (Moksha)',
      'Occult and psychic abilities',
      'Protection from enemies',
      'Sudden wealth',
      'Healing and medical abilities',
      'Ketu Mahadasha relief',
    ],
    healingProperties: [
      'Cancer treatment support',
      'Detoxification',
      'Nerve disorders',
      'Mysterious diseases',
      'Mental clarity',
    ],

    avoidIf: ['Sun is very strong', 'Confusion about life path', 'During pregnancy'],
    sideEffects: ['Detachment', 'Isolation', 'Confusion', 'Loss'],
    trialPeriod: 7,

    priceRange: '₹2,000-₹50,000 per carat',
  },
};

// ==================== MODERN HEALING CRYSTALS ====================

export interface HealingCrystal {
  name: string;
  color: string;
  chakra: string;
  element: string;
  vibration: string; // High, Medium, Low
  hardness: number;

  healingProperties: string[];
  emotionalBenefits: string[];
  spiritualBenefits: string[];
  physicalBenefits: string[];

  bestFor: string[];
  placement: string[];
  cleaningMethod: string[];
  chargingMethod: string[];

  affirmation: string;
  zodiacSigns: string[];
}

export const HEALING_CRYSTALS: Record<string, HealingCrystal> = {
  RoseQuartz: {
    name: 'Rose Quartz',
    color: 'Pink',
    chakra: 'Heart',
    element: 'Water',
    vibration: 'Medium',
    hardness: 7.0,

    healingProperties: [
      'Universal love stone',
      'Emotional healing',
      'Self-love and acceptance',
      'Forgiveness',
      'Compassion',
    ],
    emotionalBenefits: [
      'Heals heartbreak',
      'Releases resentment',
      'Attracts love',
      'Inner peace',
      'Emotional balance',
    ],
    spiritualBenefits: [
      'Unconditional love',
      'Divine love connection',
      'Heart chakra activation',
    ],
    physicalBenefits: [
      'Heart health',
      'Circulation',
      'Skin complexion',
      'Chest and lung health',
    ],

    bestFor: ['Relationships', 'Self-love', 'Emotional healing', 'Beauty'],
    placement: ['Bedroom', 'Heart area', 'Relationships corner (SW)'],
    cleaningMethod: ['Moonlight', 'Running water', 'Smudging'],
    chargingMethod: ['Full moon', 'Rose petals', 'Love intentions'],

    affirmation: 'I am worthy of love and I radiate love to others',
    zodiacSigns: ['Taurus', 'Libra'],
  },

  Amethyst: {
    name: 'Amethyst',
    color: 'Purple',
    chakra: 'Third Eye & Crown',
    element: 'Air',
    vibration: 'High',
    hardness: 7.0,

    healingProperties: [
      'Spiritual protection',
      'Psychic abilities',
      'Intuition enhancement',
      'Sobriety and addiction recovery',
      'Stress relief',
    ],
    emotionalBenefits: [
      'Calms anxiety',
      'Reduces anger',
      'Emotional stability',
      'Clear decision-making',
    ],
    spiritualBenefits: [
      'Meditation enhancement',
      'Third eye activation',
      'Divine connection',
      'Dream work',
    ],
    physicalBenefits: [
      'Headache relief',
      'Sleep quality',
      'Immune system',
      'Detoxification',
    ],

    bestFor: ['Meditation', 'Psychic work', 'Sobriety', 'Sleep'],
    placement: ['Bedroom', 'Meditation space', 'Under pillow'],
    cleaningMethod: ['Moonlight', 'Sage', 'Sound'],
    chargingMethod: ['Full moon', 'Meditation', 'Selenite'],

    affirmation: 'I am divinely protected and guided',
    zodiacSigns: ['Aquarius', 'Pisces'],
  },

  Citrine: {
    name: 'Citrine',
    color: 'Yellow/Golden',
    chakra: 'Solar Plexus',
    element: 'Fire',
    vibration: 'High',
    hardness: 7.0,

    healingProperties: [
      'Abundance and prosperity',
      'Manifestation',
      'Personal power',
      'Confidence',
      'Never needs cleansing',
    ],
    emotionalBenefits: [
      'Optimism',
      'Joy and happiness',
      'Motivation',
      'Overcoming depression',
    ],
    spiritualBenefits: [
      'Manifestation power',
      'Creativity',
      'Divine will',
    ],
    physicalBenefits: [
      'Digestion',
      'Metabolism',
      'Energy boost',
      'Detoxification',
    ],

    bestFor: ['Wealth', 'Business', 'Confidence', 'Manifestation'],
    placement: ['Cash register', 'Wallet', 'Abundance corner (SE)', 'Office'],
    cleaningMethod: ['Self-cleansing', 'Sunlight (brief)', 'Sound'],
    chargingMethod: ['Sunlight', 'Intentions', 'Money rituals'],

    affirmation: 'I am a magnet for prosperity and abundance',
    zodiacSigns: ['Gemini', 'Leo', 'Virgo'],
  },

  ClearQuartz: {
    name: 'Clear Quartz',
    color: 'Clear/White',
    chakra: 'All Chakras',
    element: 'All Elements',
    vibration: 'Very High',
    hardness: 7.0,

    healingProperties: [
      'Master healer',
      'Amplifies energy',
      'Programmable',
      'Clarity and focus',
      'Universal crystal',
    ],
    emotionalBenefits: [
      'Mental clarity',
      'Focus',
      'Emotional balance',
    ],
    spiritualBenefits: [
      'Amplifies intentions',
      'Spiritual connection',
      'Energy cleansing',
    ],
    physicalBenefits: [
      'Immune system',
      'Pain relief',
      'Overall healing',
    ],

    bestFor: ['Meditation', 'Healing', 'Amplification', 'Programming'],
    placement: ['Anywhere', 'Grid center', 'Meditation space'],
    cleaningMethod: ['Sunlight', 'Moonlight', 'Salt water', 'Smudging'],
    chargingMethod: ['Sunlight', 'Moonlight', 'Intentions'],

    affirmation: 'I am clear, focused, and aligned with my highest purpose',
    zodiacSigns: ['All signs'],
  },

  BlackTourmaline: {
    name: 'Black Tourmaline',
    color: 'Black',
    chakra: 'Root',
    element: 'Earth',
    vibration: 'Medium',
    hardness: 7.0,

    healingProperties: [
      'Ultimate protection stone',
      'EMF protection',
      'Grounding',
      'Energy shield',
      'Negativity removal',
    ],
    emotionalBenefits: [
      'Reduces anxiety',
      'Emotional stability',
      'Releases stress',
    ],
    spiritualBenefits: [
      'Psychic protection',
      'Grounding',
      'Aura cleansing',
    ],
    physicalBenefits: [
      'Pain relief',
      'Immune system',
      'Detoxification',
    ],

    bestFor: ['Protection', 'Grounding', 'EMF shield', 'Negativity'],
    placement: ['Entrance', 'Near electronics', 'Four corners of home'],
    cleaningMethod: ['Moonlight', 'Sage', 'Sound'],
    chargingMethod: ['Earth burial', 'Black salt', 'New moon'],

    affirmation: 'I am safe, protected, and grounded',
    zodiacSigns: ['Capricorn', 'Scorpio'],
  },

  Carnelian: {
    name: 'Carnelian',
    color: 'Orange/Red',
    chakra: 'Sacral',
    element: 'Fire',
    vibration: 'Medium',
    hardness: 7.0,

    healingProperties: [
      'Creativity boost',
      'Motivation',
      'Courage',
      'Vitality',
      'Sexual energy',
    ],
    emotionalBenefits: [
      'Confidence',
      'Overcoming abuse',
      'Motivation',
      'Passion',
    ],
    spiritualBenefits: [
      'Manifestation',
      'Past life healing',
      'Spiritual grounding',
    ],
    physicalBenefits: [
      'Reproductive health',
      'Lower back pain',
      'Metabolism',
      'Blood circulation',
    ],

    bestFor: ['Creativity', 'Motivation', 'Sexual energy', 'Courage'],
    placement: ['Creative space', 'Bedroom', 'Workspace'],
    cleaningMethod: ['Sunlight', 'Running water', 'Sage'],
    chargingMethod: ['Sunlight', 'Fire element'],

    affirmation: 'I am creative, passionate, and full of vitality',
    zodiacSigns: ['Virgo', 'Cancer'],
  },

  LapisLazuli: {
    name: 'Lapis Lazuli',
    color: 'Deep Blue with Gold',
    chakra: 'Third Eye & Throat',
    element: 'Water',
    vibration: 'High',
    hardness: 5.5,

    healingProperties: [
      'Truth and wisdom',
      'Psychic abilities',
      'Communication',
      'Spiritual journey',
      'Royal stone',
    ],
    emotionalBenefits: [
      'Self-awareness',
      'Inner truth',
      'Emotional healing',
    ],
    spiritualBenefits: [
      'Third eye activation',
      'Spiritual enlightenment',
      'Past life recall',
    ],
    physicalBenefits: [
      'Throat health',
      'Headaches',
      'Blood pressure',
      'Immune system',
    ],

    bestFor: ['Truth', 'Communication', 'Psychic work', 'Wisdom'],
    placement: ['Throat area', 'Third eye', 'Meditation space'],
    cleaningMethod: ['Moonlight only', 'Sound', 'Sage'],
    chargingMethod: ['Full moon', 'Meditation'],

    affirmation: 'I speak my truth with clarity and wisdom',
    zodiacSigns: ['Sagittarius', 'Libra'],
  },

  GreenAventurine: {
    name: 'Green Aventurine',
    color: 'Green',
    chakra: 'Heart',
    element: 'Earth',
    vibration: 'Medium',
    hardness: 7.0,

    healingProperties: [
      'Luck and prosperity',
      'Opportunity',
      'Heart healing',
      'Confidence',
      'Gambler\'s stone',
    ],
    emotionalBenefits: [
      'Optimism',
      'Emotional calm',
      'Decision-making',
    ],
    spiritualBenefits: [
      'Heart chakra healing',
      'Growth',
      'Renewal',
    ],
    physicalBenefits: [
      'Heart health',
      'Skin conditions',
      'Allergies',
      'Thymus gland',
    ],

    bestFor: ['Luck', 'Prosperity', 'Heart healing', 'Growth'],
    placement: ['Wallet', 'Garden', 'Wealth corner'],
    cleaningMethod: ['Running water', 'Moonlight', 'Sage'],
    chargingMethod: ['Earth', 'Green candle', 'Prosperity ritual'],

    affirmation: 'I am lucky and opportunities flow to me easily',
    zodiacSigns: ['Aries', 'Leo'],
  },

  Selenite: {
    name: 'Selenite',
    color: 'White/Clear',
    chakra: 'Crown',
    element: 'Air',
    vibration: 'Very High',
    hardness: 2.0,

    healingProperties: [
      'Self-cleansing',
      'Cleanses other crystals',
      'Angelic connection',
      'Mental clarity',
      'Never needs cleansing',
    ],
    emotionalBenefits: [
      'Peace',
      'Clarity',
      'Calm',
    ],
    spiritualBenefits: [
      'Angelic realms',
      'Spirit guides',
      'Higher consciousness',
    ],
    physicalBenefits: [
      'Skeletal system',
      'Spine alignment',
      'Flexibility',
    ],

    bestFor: ['Cleansing', 'Meditation', 'Angelic work', 'Clarity'],
    placement: ['Meditation space', 'Crystal charging plate', 'Bedroom'],
    cleaningMethod: ['Self-cleansing', 'Never use water'],
    chargingMethod: ['Self-charging', 'Moonlight'],

    affirmation: 'I am connected to divine light and angelic guidance',
    zodiacSigns: ['Taurus', 'Cancer'],
  },
};

// ==================== CHAKRA SYSTEM ====================

export interface ChakraInfo {
  name: string;
  sanskrit: string;
  location: string;
  color: string;
  element: string;
  mantra: string;
  frequency: number; // Hz

  purpose: string;
  balancedTraits: string[];
  blockedSymptoms: string[];
  overactiveSymptoms: string[];

  healingCrystals: string[];
  vedaicGems: string[];

  yogaPoses: string[];
  essentialOils: string[];
  foods: string[];

  affirmations: string[];
}

export const CHAKRAS: Record<string, ChakraInfo> = {
  Root: {
    name: 'Root Chakra',
    sanskrit: 'Muladhara',
    location: 'Base of spine',
    color: 'Red',
    element: 'Earth',
    mantra: 'LAM',
    frequency: 396,

    purpose: 'Grounding, survival, security',
    balancedTraits: ['Grounded', 'Stable', 'Secure', 'Present'],
    blockedSymptoms: ['Fear', 'Anxiety', 'Insecurity', 'Financial stress'],
    overactiveSymptoms: ['Greed', 'Materialism', 'Rigidity'],

    healingCrystals: ['Red Jasper', 'Black Tourmaline', 'Hematite', 'Smoky Quartz'],
    vedaicGems: ['Red Coral', 'Hessonite', "Cat's Eye"],

    yogaPoses: ['Mountain', 'Warrior I', 'Tree', 'Child\'s Pose'],
    essentialOils: ['Patchouli', 'Cedarwood', 'Vetiver'],
    foods: ['Root vegetables', 'Protein', 'Red foods'],

    affirmations: [
      'I am safe and secure',
      'I am grounded and stable',
      'I trust in the goodness of life',
    ],
  },

  Sacral: {
    name: 'Sacral Chakra',
    sanskrit: 'Svadhisthana',
    location: 'Below navel',
    color: 'Orange',
    element: 'Water',
    mantra: 'VAM',
    frequency: 417,

    purpose: 'Creativity, sexuality, emotions',
    balancedTraits: ['Creative', 'Passionate', 'Flexible', 'Joyful'],
    blockedSymptoms: ['Low creativity', 'Low libido', 'Emotional numbness'],
    overactiveSymptoms: ['Addiction', 'Emotional instability', 'Obsession'],

    healingCrystals: ['Carnelian', 'Orange Calcite', 'Sunstone'],
    vedaicGems: ['Pearl'],

    yogaPoses: ['Goddess Pose', 'Pigeon', 'Hip circles'],
    essentialOils: ['Ylang-ylang', 'Sandalwood', 'Orange'],
    foods: ['Orange foods', 'Nuts', 'Seeds'],

    affirmations: [
      'I am creative and passionate',
      'I embrace pleasure and abundance',
      'My emotions flow freely',
    ],
  },

  SolarPlexus: {
    name: 'Solar Plexus Chakra',
    sanskrit: 'Manipura',
    location: 'Upper abdomen',
    color: 'Yellow',
    element: 'Fire',
    mantra: 'RAM',
    frequency: 528,

    purpose: 'Personal power, confidence, will',
    balancedTraits: ['Confident', 'Motivated', 'Purposeful', 'Strong will'],
    blockedSymptoms: ['Low self-esteem', 'Indecision', 'Powerlessness'],
    overactiveSymptoms: ['Domineering', 'Aggressive', 'Perfectionist'],

    healingCrystals: ['Citrine', 'Tiger Eye', 'Yellow Jasper'],
    vedaicGems: ['Yellow Sapphire', 'Ruby'],

    yogaPoses: ['Boat Pose', 'Warrior III', 'Plank'],
    essentialOils: ['Lemon', 'Ginger', 'Chamomile'],
    foods: ['Yellow foods', 'Grains', 'Fiber'],

    affirmations: [
      'I am powerful and confident',
      'I honor my personal power',
      'I can achieve anything I set my mind to',
    ],
  },

  Heart: {
    name: 'Heart Chakra',
    sanskrit: 'Anahata',
    location: 'Center of chest',
    color: 'Green/Pink',
    element: 'Air',
    mantra: 'YAM',
    frequency: 639,

    purpose: 'Love, compassion, connection',
    balancedTraits: ['Loving', 'Compassionate', 'Empathetic', 'Peaceful'],
    blockedSymptoms: ['Loneliness', 'Jealousy', 'Bitterness', 'Isolation'],
    overactiveSymptoms: ['Codependency', 'Jealousy', 'Poor boundaries'],

    healingCrystals: ['Rose Quartz', 'Green Aventurine', 'Jade', 'Rhodonite'],
    vedaicGems: ['Emerald', 'Diamond'],

    yogaPoses: ['Camel', 'Cobra', 'Bridge'],
    essentialOils: ['Rose', 'Jasmine', 'Bergamot'],
    foods: ['Green foods', 'Leafy greens'],

    affirmations: [
      'I am love',
      'I give and receive love freely',
      'My heart is open',
    ],
  },

  Throat: {
    name: 'Throat Chakra',
    sanskrit: 'Vishuddha',
    location: 'Throat',
    color: 'Blue',
    element: 'Ether',
    mantra: 'HAM',
    frequency: 741,

    purpose: 'Communication, expression, truth',
    balancedTraits: ['Articulate', 'Truthful', 'Good listener', 'Expressive'],
    blockedSymptoms: ['Difficulty speaking', 'Fear of judgment', 'Shyness'],
    overactiveSymptoms: ['Over-talking', 'Gossiping', 'Loudness'],

    healingCrystals: ['Blue Lace Agate', 'Aquamarine', 'Turquoise'],
    vedaicGems: ['Blue Sapphire'],

    yogaPoses: ['Fish Pose', 'Plow', 'Shoulder stand'],
    essentialOils: ['Eucalyptus', 'Peppermint', 'Lavender'],
    foods: ['Blue foods', 'Fruit', 'Water'],

    affirmations: [
      'I speak my truth',
      'My voice matters',
      'I communicate clearly and confidently',
    ],
  },

  ThirdEye: {
    name: 'Third Eye Chakra',
    sanskrit: 'Ajna',
    location: 'Between eyebrows',
    color: 'Indigo',
    element: 'Light',
    mantra: 'OM',
    frequency: 852,

    purpose: 'Intuition, wisdom, vision',
    balancedTraits: ['Intuitive', 'Wise', 'Insightful', 'Imaginative'],
    blockedSymptoms: ['Lack of clarity', 'Poor intuition', 'Confusion'],
    overactiveSymptoms: ['Hallucinations', 'Nightmares', 'Delusions'],

    healingCrystals: ['Amethyst', 'Lapis Lazuli', 'Sodalite', 'Azurite'],
    vedaicGems: ['Blue Sapphire'],

    yogaPoses: ['Child\'s Pose', 'Forward fold', 'Eye exercises'],
    essentialOils: ['Frankincense', 'Clary sage', 'Juniper'],
    foods: ['Purple foods', 'Dark chocolate'],

    affirmations: [
      'I trust my intuition',
      'I see clearly',
      'I am connected to my inner wisdom',
    ],
  },

  Crown: {
    name: 'Crown Chakra',
    sanskrit: 'Sahasrara',
    location: 'Top of head',
    color: 'Violet/White',
    element: 'Cosmic Energy',
    mantra: 'AUM',
    frequency: 963,

    purpose: 'Spirituality, enlightenment, connection',
    balancedTraits: ['Spiritual', 'Wise', 'Connected', 'Blissful'],
    blockedSymptoms: ['Disconnection', 'Cynicism', 'Learning difficulties'],
    overactiveSymptoms: ['Spiritual addiction', 'Dissociation'],

    healingCrystals: ['Clear Quartz', 'Selenite', 'Amethyst', 'Diamond'],
    vedaicGems: ['Diamond', 'Yellow Sapphire'],

    yogaPoses: ['Headstand', 'Meditation', 'Savasana'],
    essentialOils: ['Lotus', 'Frankincense', 'Myrrh'],
    foods: ['Fasting', 'Sunlight', 'Fresh air'],

    affirmations: [
      'I am divine',
      'I am connected to all that is',
      'I am pure consciousness',
    ],
  },
};

// ==================== UPAYA (REMEDIES) ====================

export interface PlanetaryUpaya {
  planet: string;
  gemstone: string;
  mantra: string;
  mantraCount: number;
  deity: string;
  fastingDay: string;
  charity: string[];
  metal: string;
  yantra: string;
  color: string;
  direction: string;
  herbs: string[];
  rudrakshaBeads: string;
}

export const PLANETARY_UPAYAS: Record<string, PlanetaryUpaya> = {
  Sun: {
    planet: 'Sun',
    gemstone: 'Ruby',
    mantra: 'Om Hreem Suryaya Namaha',
    mantraCount: 7000,
    deity: 'Lord Surya',
    fastingDay: 'Sunday',
    charity: ['Wheat', 'Jaggery', 'Red cloth', 'Copper vessel'],
    metal: 'Gold/Copper',
    yantra: 'Surya Yantra',
    color: 'Red, Orange, Golden',
    direction: 'East',
    herbs: ['Aloe vera', 'Saffron', 'Cinnamon'],
    rudrakshaBeads: '1 Mukhi',
  },
  Moon: {
    planet: 'Moon',
    gemstone: 'Pearl',
    mantra: 'Om Shreem Chandraya Namaha',
    mantraCount: 11000,
    deity: 'Goddess Parvati',
    fastingDay: 'Monday',
    charity: ['White rice', 'Milk', 'Sugar', 'Silver'],
    metal: 'Silver',
    yantra: 'Chandra Yantra',
    color: 'White, Cream, Silver',
    direction: 'Northwest',
    herbs: ['Ashwagandha', 'Brahmi', 'Shatavari'],
    rudrakshaBeads: '2 Mukhi',
  },
  Mars: {
    planet: 'Mars',
    gemstone: 'Red Coral',
    mantra: 'Om Kreem Mangalaya Namaha',
    mantraCount: 10000,
    deity: 'Lord Hanuman',
    fastingDay: 'Tuesday',
    charity: ['Red lentils', 'Jaggery', 'Red cloth', 'Copper'],
    metal: 'Copper',
    yantra: 'Mangal Yantra',
    color: 'Red',
    direction: 'South',
    herbs: ['Turmeric', 'Ginger', 'Neem'],
    rudrakshaBeads: '3 Mukhi',
  },
  Mercury: {
    planet: 'Mercury',
    gemstone: 'Emerald',
    mantra: 'Om Aim Budhaya Namaha',
    mantraCount: 9000,
    deity: 'Lord Vishnu',
    fastingDay: 'Wednesday',
    charity: ['Green vegetables', 'Green cloth', 'Books'],
    metal: 'Bronze/Brass',
    yantra: 'Budha Yantra',
    color: 'Green',
    direction: 'North',
    herbs: ['Tulsi', 'Brahmi', 'Gotu kola'],
    rudrakshaBeads: '4 Mukhi',
  },
  Jupiter: {
    planet: 'Jupiter',
    gemstone: 'Yellow Sapphire',
    mantra: 'Om Greem Brihaspataye Namaha',
    mantraCount: 19000,
    deity: 'Lord Brihaspati',
    fastingDay: 'Thursday',
    charity: ['Turmeric', 'Yellow cloth', 'Gold', 'Saffron'],
    metal: 'Gold',
    yantra: 'Guru Yantra',
    color: 'Yellow, Golden',
    direction: 'Northeast',
    herbs: ['Ashwagandha', 'Haritaki', 'Licorice'],
    rudrakshaBeads: '5 Mukhi',
  },
  Venus: {
    planet: 'Venus',
    gemstone: 'Diamond',
    mantra: 'Om Dreem Shukraya Namaha',
    mantraCount: 16000,
    deity: 'Goddess Lakshmi',
    fastingDay: 'Friday',
    charity: ['White rice', 'Sugar', 'Perfume', 'White flowers'],
    metal: 'Silver/White Gold',
    yantra: 'Shukra Yantra',
    color: 'White, Pink',
    direction: 'Southeast',
    herbs: ['Shatavari', 'Rose', 'Sandalwood'],
    rudrakshaBeads: '6 Mukhi',
  },
  Saturn: {
    planet: 'Saturn',
    gemstone: 'Blue Sapphire',
    mantra: 'Om Praam Preem Praum Sah Shanaischaraya Namaha',
    mantraCount: 23000,
    deity: 'Lord Shani',
    fastingDay: 'Saturday',
    charity: ['Black sesame', 'Iron', 'Blue cloth', 'Mustard oil'],
    metal: 'Iron',
    yantra: 'Shani Yantra',
    color: 'Black, Blue, Dark colors',
    direction: 'West',
    herbs: ['Guggulu', 'Triphala', 'Shilajit'],
    rudrakshaBeads: '7 Mukhi / 14 Mukhi',
  },
  Rahu: {
    planet: 'Rahu',
    gemstone: 'Hessonite',
    mantra: 'Om Bhraam Bhreem Bhraum Sah Rahave Namaha',
    mantraCount: 18000,
    deity: 'Goddess Durga',
    fastingDay: 'Saturday',
    charity: ['Mustard oil', 'Black cloth', 'Blue flowers'],
    metal: 'Lead/Mixed metals',
    yantra: 'Rahu Yantra',
    color: 'Smoky colors',
    direction: 'Southwest',
    herbs: ['Ashwagandha', 'Guggulu', 'Calamus'],
    rudrakshaBeads: '8 Mukhi',
  },
  Ketu: {
    planet: 'Ketu',
    gemstone: "Cat's Eye",
    mantra: 'Om Streem Ketve Namaha',
    mantraCount: 17000,
    deity: 'Lord Ganesha',
    fastingDay: 'Tuesday/Thursday',
    charity: ['Sesame', 'Blanket', 'Multi-colored cloth'],
    metal: 'Bronze/Mixed metals',
    yantra: 'Ketu Yantra',
    color: 'Multi-colored',
    direction: 'Northwest',
    herbs: ['Ashwagandha', 'Brahmi', 'Calamus'],
    rudrakshaBeads: '9 Mukhi',
  },
};

// ==================== CALCULATION FUNCTIONS ====================

export function recommendGemstoneBySituation(situation: string): string[] {
  const lowerSit = situation.toLowerCase();

  if (lowerSit.includes('career') || lowerSit.includes('job')) {
    return ['Ruby', 'Yellow Sapphire', 'Emerald'];
  }
  if (lowerSit.includes('love') || lowerSit.includes('marriage')) {
    return ['Diamond', 'Pearl', 'Rose Quartz'];
  }
  if (lowerSit.includes('health')) {
    return ['Emerald', 'Red Coral', 'Amethyst'];
  }
  if (lowerSit.includes('wealth') || lowerSit.includes('money')) {
    return ['Yellow Sapphire', 'Citrine', 'Green Aventurine'];
  }
  if (lowerSit.includes('protection')) {
    return ['Blue Sapphire', 'Black Tourmaline', 'Hessonite'];
  }
  if (lowerSit.includes('spiritual')) {
    return ['Amethyst', 'Clear Quartz', "Cat's Eye"];
  }

  return ['Clear Quartz', 'Amethyst', 'Rose Quartz'];
}

export function getChakraByIssue(issue: string): string {
  const lowerIssue = issue.toLowerCase();

  if (lowerIssue.includes('fear') || lowerIssue.includes('security')) return 'Root';
  if (lowerIssue.includes('creativity') || lowerIssue.includes('sexual')) return 'Sacral';
  if (lowerIssue.includes('confidence') || lowerIssue.includes('power')) return 'SolarPlexus';
  if (lowerIssue.includes('love') || lowerIssue.includes('heart')) return 'Heart';
  if (lowerIssue.includes('communication') || lowerIssue.includes('expression')) return 'Throat';
  if (lowerIssue.includes('intuition') || lowerIssue.includes('clarity')) return 'ThirdEye';
  if (lowerIssue.includes('spiritual') || lowerIssue.includes('divine')) return 'Crown';

  return 'Heart'; // Default
}

export function calculateGemstoneCompatibility(gem1: string, gem2: string): {
  compatible: boolean;
  reason: string;
} {
  const navratna1 = NAVARATNA_GEMS[gem1];
  const navratna2 = NAVARATNA_GEMS[gem2];

  if (!navratna1 || !navratna2) {
    return { compatible: true, reason: 'One or both are modern crystals - generally compatible' };
  }

  const planet1 = navratna1.planet;
  const planet2 = navratna2.planet;

  // Friendly combinations
  const friendlyPairs = [
    ['Sun', 'Moon'], ['Sun', 'Mars'], ['Sun', 'Jupiter'],
    ['Moon', 'Mercury'], ['Moon', 'Venus'],
    ['Mars', 'Jupiter'], ['Mars', 'Moon'],
    ['Mercury', 'Venus'], ['Mercury', 'Saturn'],
    ['Jupiter', 'Sun'], ['Jupiter', 'Moon'], ['Jupiter', 'Mars'],
    ['Venus', 'Mercury'], ['Venus', 'Saturn'],
  ];

  // Enemy combinations
  const enemyPairs = [
    ['Sun', 'Venus'], ['Sun', 'Saturn'],
    ['Moon', 'Rahu'], ['Moon', 'Ketu'],
    ['Mars', 'Mercury'],
    ['Mercury', 'Moon'],
    ['Jupiter', 'Mercury'], ['Jupiter', 'Venus'],
    ['Saturn', 'Sun'], ['Saturn', 'Moon'], ['Saturn', 'Mars'],
  ];

  for (const [p1, p2] of friendlyPairs) {
    if ((planet1 === p1 && planet2 === p2) || (planet1 === p2 && planet2 === p1)) {
      return { compatible: true, reason: `${planet1} and ${planet2} are friendly planets` };
    }
  }

  for (const [p1, p2] of enemyPairs) {
    if ((planet1 === p1 && planet2 === p2) || (planet1 === p2 && planet2 === p1)) {
      return { compatible: false, reason: `${planet1} and ${planet2} are enemy planets - avoid wearing together` };
    }
  }

  return { compatible: true, reason: 'Neutral combination - can be worn together' };
}
