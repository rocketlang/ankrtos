// =====================================================
// PALMISTRY (CHIROMANCY) ENGINE
// Complete Palm Reading System
// =====================================================

export interface HandShape {
  type: 'earth' | 'air' | 'water' | 'fire';
  element: string;
  characteristics: string[];
  personality: string;
  career: string[];
  relationships: string;
}

export interface MajorLine {
  name: string;
  location: string;
  quality: 'deep' | 'light' | 'broken' | 'chained' | 'forked' | 'absent';
  length: 'long' | 'medium' | 'short';
  meaning: string;
  positive: string[];
  negative: string[];
  remedies: string[];
}

export interface Mount {
  name: string;
  planet: string;
  location: string;
  development: 'well-developed' | 'normal' | 'flat' | 'over-developed';
  meaning: string;
  characteristics: string[];
  career: string[];
  weaknesses?: string[];
}

export interface FingerAnalysis {
  finger: string;
  planet: string;
  length: 'long' | 'medium' | 'short';
  flexibility: 'flexible' | 'stiff';
  phalanges: {
    top: string; // mental/spiritual
    middle: string; // practical
    bottom: string; // material
  };
  meaning: string;
  traits: string[];
}

export interface MinorLine {
  name: string;
  presence: boolean;
  quality?: string;
  meaning: string;
  significance: string;
}

export interface PalmReading {
  handShape: HandShape;
  dominantHand: 'left' | 'right';

  // Major Lines
  heartLine: MajorLine;
  headLine: MajorLine;
  lifeLine: MajorLine;
  fateLine?: MajorLine;

  // Mounts
  mountOfJupiter: Mount;
  mountOfSaturn: Mount;
  mountOfApollo: Mount;
  mountOfMercury: Mount;
  mountOfMars: Mount; // Upper & Lower combined
  mountOfVenus: Mount;
  mountOfMoon: Mount;

  // Fingers
  thumbAnalysis: FingerAnalysis;
  jupiterFinger: FingerAnalysis;
  saturnFinger: FingerAnalysis;
  apolloFinger: FingerAnalysis;
  mercuryFinger: FingerAnalysis;

  // Minor Lines
  sunLine?: MinorLine;
  mercuryLine?: MinorLine;
  intuitionLine?: MinorLine;
  marriageLines?: MinorLine[];
  travelLines?: MinorLine[];

  // Overall Analysis
  overallPersonality: string;
  strengths: string[];
  weaknesses: string[];
  careerSuggestions: string[];
  healthIndications: string[];
  relationshipAnalysis: string;
  wealthPotential: string;
  lifeExpectancy: string;

  // Vedic Palm Reading
  planetaryInfluences: {
    planet: string;
    strength: number; // 0-100
    impact: string;
  }[];

  remedies: {
    area: string;
    suggestions: string[];
  }[];
}

// =====================================================
// HAND SHAPES (4 Elements)
// =====================================================

export const HAND_SHAPES: Record<string, HandShape> = {
  earth: {
    type: 'earth',
    element: 'Earth',
    characteristics: [
      'Square palm',
      'Short fingers',
      'Thick skin',
      'Few major lines',
      'Practical markings'
    ],
    personality: 'Practical, reliable, grounded, hard-working, traditional, stable, materialistic',
    career: [
      'Agriculture',
      'Construction',
      'Banking',
      'Real Estate',
      'Manufacturing',
      'Engineering',
      'Farming'
    ],
    relationships: 'Loyal and stable, seeks long-term commitment, traditional values'
  },

  air: {
    type: 'air',
    element: 'Air',
    characteristics: [
      'Square palm',
      'Long fingers',
      'Dry skin',
      'Many fine lines',
      'Intellectual markings'
    ],
    personality: 'Intellectual, communicative, curious, analytical, social, changeable, restless',
    career: [
      'Teaching',
      'Writing',
      'Journalism',
      'Law',
      'Science',
      'Technology',
      'Communications'
    ],
    relationships: 'Values mental connection, needs intellectual stimulation, can be detached'
  },

  water: {
    type: 'water',
    element: 'Water',
    characteristics: [
      'Long/oval palm',
      'Long fingers',
      'Soft skin',
      'Many fine lines',
      'Emotional markings'
    ],
    personality: 'Emotional, intuitive, sensitive, creative, empathetic, psychic, moody',
    career: [
      'Counseling',
      'Healing',
      'Arts',
      'Music',
      'Nursing',
      'Spirituality',
      'Psychology'
    ],
    relationships: 'Deep emotional bonds, highly intuitive about partners, can be clingy'
  },

  fire: {
    type: 'fire',
    element: 'Fire',
    characteristics: [
      'Long/rectangular palm',
      'Short fingers',
      'Warm/pink skin',
      'Strong major lines',
      'Dynamic markings'
    ],
    personality: 'Energetic, passionate, confident, impulsive, leader, adventurous, ambitious',
    career: [
      'Entrepreneurship',
      'Sales',
      'Sports',
      'Military',
      'Management',
      'Entertainment',
      'Politics'
    ],
    relationships: 'Passionate and intense, needs excitement, can be dominating'
  }
};

// =====================================================
// MAJOR LINES INTERPRETATIONS
// =====================================================

export const HEART_LINE_MEANINGS = {
  deepAndClear: {
    meaning: 'Strong emotions, passionate nature, deep capacity for love',
    positive: [
      'Emotionally stable',
      'Capable of deep love',
      'Good relationships',
      'Warm heart'
    ],
    negative: [],
    remedies: []
  },

  lightOrWeak: {
    meaning: 'Reserved emotions, difficulty expressing feelings',
    positive: ['Practical in relationships', 'Not overly emotional'],
    negative: ['Emotionally distant', 'Difficulty with intimacy', 'Cold demeanor'],
    remedies: [
      'Rose Quartz crystal',
      'Heart chakra meditation',
      'Practice expressing emotions',
      'Relationship counseling'
    ]
  },

  broken: {
    meaning: 'Emotional trauma, heartbreak, relationship difficulties',
    positive: ['Resilience through challenges'],
    negative: ['Past heartbreak', 'Trust issues', 'Emotional wounds'],
    remedies: [
      'Healing meditation',
      'Therapy for past trauma',
      'Pink tourmaline',
      'Self-love practices'
    ]
  },

  chained: {
    meaning: 'Emotional confusion, multiple relationships, indecisiveness',
    positive: ['Capacity for multiple connections'],
    negative: ['Indecisive in love', 'Confused emotions', 'Scattered feelings'],
    remedies: [
      'Clarity meditation',
      'Journal emotions',
      'Clear Quartz',
      'Emotional counseling'
    ]
  },

  forkedEnd: {
    meaning: 'Balanced emotions, ability to see both sides',
    positive: [
      'Diplomatic',
      'Understanding',
      'Balanced perspective',
      'Good mediator'
    ],
    negative: [],
    remedies: []
  }
};

export const HEAD_LINE_MEANINGS = {
  deepAndClear: {
    meaning: 'Strong intellect, clear thinking, good concentration',
    positive: [
      'Sharp mind',
      'Good memory',
      'Logical thinking',
      'Mental clarity'
    ],
    negative: [],
    remedies: []
  },

  lightOrWeak: {
    meaning: 'Weak concentration, scattered thinking, mental fatigue',
    positive: ['Open to new ideas', 'Flexible thinking'],
    negative: ['Poor concentration', 'Forgetfulness', 'Mental confusion'],
    remedies: [
      'Brahmi supplements',
      'Meditation for focus',
      'Amethyst crystal',
      'Brain exercises',
      'Proper sleep'
    ]
  },

  broken: {
    meaning: 'Mental trauma, severe stress, head injuries possible',
    positive: ['Mental resilience'],
    negative: ['Anxiety', 'Mental breaks', 'Stress-related issues'],
    remedies: [
      'Mental health support',
      'Stress management',
      'Lapis Lazuli',
      'Third eye meditation'
    ]
  },

  chained: {
    meaning: 'Mental confusion, overthinking, anxiety',
    positive: ['Thoughtful', 'Considers all angles'],
    negative: ['Overthinking', 'Worry', 'Mental stress', 'Indecision'],
    remedies: [
      'Mindfulness practice',
      'Reduce overthinking',
      'Sodalite crystal',
      'Grounding exercises'
    ]
  },

  sloping: {
    meaning: 'Creative mind, imagination, artistic ability',
    positive: [
      'Creative',
      'Imaginative',
      'Artistic talent',
      'Intuitive thinking'
    ],
    negative: ['Can be impractical', 'Escapist tendencies'],
    remedies: []
  },

  straight: {
    meaning: 'Practical mind, logical, materialistic thinking',
    positive: [
      'Logical',
      'Practical',
      'Grounded',
      'Good with facts'
    ],
    negative: ['Lack of imagination', 'Too rigid'],
    remedies: ['Creative activities', 'Artistic pursuits']
  }
};

export const LIFE_LINE_MEANINGS = {
  deepAndClear: {
    meaning: 'Strong vitality, good health, robust constitution',
    positive: [
      'Excellent health',
      'High energy',
      'Strong immunity',
      'Long life'
    ],
    negative: [],
    remedies: []
  },

  lightOrWeak: {
    meaning: 'Low vitality, health issues, need to protect health',
    positive: ['Resilience despite challenges'],
    negative: ['Weak constitution', 'Prone to illness', 'Low energy'],
    remedies: [
      'Regular exercise',
      'Healthy diet',
      'Red Jasper crystal',
      'Pranic healing',
      'Ayurvedic treatment',
      'Boost immunity'
    ]
  },

  broken: {
    meaning: 'Major health crisis, life-changing events, accidents',
    positive: ['Ability to recover', 'Transformation through crisis'],
    negative: ['Health emergencies', 'Major life disruptions', 'Accidents'],
    remedies: [
      'Health insurance',
      'Regular checkups',
      'Bloodstone',
      'Protective mantras',
      'Mahamrityunjaya mantra'
    ]
  },

  chained: {
    meaning: 'Chronic health issues, ongoing health concerns',
    positive: ['Building strength through challenges'],
    negative: ['Chronic conditions', 'Persistent health problems'],
    remedies: [
      'Consistent medical care',
      'Lifestyle changes',
      'Carnelian crystal',
      'Health routines'
    ]
  },

  longAndCurved: {
    meaning: 'Long life, vitality throughout life, strong foundation',
    positive: [
      'Longevity',
      'Sustained energy',
      'Healthy aging',
      'Vitality'
    ],
    negative: [],
    remedies: []
  },

  shortLine: {
    meaning: 'Quality over quantity, intense but shorter life',
    positive: ['Lives life fully', 'Intensity'],
    negative: ['Shorter lifespan', 'Burnout risk'],
    remedies: [
      'Health preservation',
      'Stress reduction',
      'Regular rest',
      'Life balance'
    ]
  }
};

export const FATE_LINE_MEANINGS = {
  deepAndClear: {
    meaning: 'Clear life purpose, strong destiny, career success',
    positive: [
      'Clear direction',
      'Career success',
      'Strong purpose',
      'Fulfilling destiny'
    ],
    negative: [],
    remedies: []
  },

  absent: {
    meaning: 'Freedom from predetermined path, self-made destiny',
    positive: [
      'Freedom to choose',
      'Flexibility',
      'Self-determination',
      'Multiple paths'
    ],
    negative: ['Lack of direction', 'Unclear purpose'],
    remedies: [
      'Career counseling',
      'Life purpose meditation',
      'Tiger Eye crystal',
      'Goal setting'
    ]
  },

  startingLate: {
    meaning: 'Late bloomer, success comes later in life',
    positive: ['Patience rewarded', 'Wisdom with age'],
    negative: ['Slow start', 'Delayed success'],
    remedies: [
      'Persistence',
      'Skill development',
      'Citrine for success',
      'Saturn remedies'
    ]
  },

  broken: {
    meaning: 'Career changes, disruptions in life path',
    positive: ['Adaptability', 'Multiple careers'],
    negative: ['Career instability', 'Path disruptions'],
    remedies: [
      'Career flexibility',
      'Skill diversification',
      'Aventurine',
      'Jupiter mantras'
    ]
  }
};

// =====================================================
// MOUNTS (PLANETARY)
// =====================================================

export const MOUNT_INTERPRETATIONS = {
  jupiter: {
    planet: 'Jupiter',
    location: 'Base of index finger',
    wellDeveloped: {
      meaning: 'Leadership, ambition, confidence, authority',
      characteristics: [
        'Natural leader',
        'Ambitious',
        'Confident',
        'Authority figure',
        'Religious/spiritual',
        'Philosophical'
      ],
      career: [
        'Management',
        'Politics',
        'Law',
        'Teaching',
        'Religious leadership',
        'Executive roles'
      ]
    },
    overDeveloped: {
      meaning: 'Ego, arrogance, domination',
      weaknesses: ['Egotistical', 'Domineering', 'Prideful', 'Overbearing'],
      remedies: [
        'Humility practice',
        'Service to others',
        'Yellow Sapphire (carefully)',
        'Jupiter mantra moderation'
      ]
    },
    flat: {
      meaning: 'Lack of ambition, low confidence',
      weaknesses: ['Unambitious', 'Lacks confidence', 'Passive'],
      remedies: [
        'Leadership training',
        'Confidence building',
        'Yellow Sapphire',
        'Om Guruve Namaha mantra'
      ]
    }
  },

  saturn: {
    planet: 'Saturn',
    location: 'Base of middle finger',
    wellDeveloped: {
      meaning: 'Wisdom, discipline, responsibility, seriousness',
      characteristics: [
        'Wise',
        'Disciplined',
        'Responsible',
        'Serious',
        'Patient',
        'Introspective'
      ],
      career: [
        'Science',
        'Research',
        'Philosophy',
        'Medicine',
        'Engineering',
        'Agriculture'
      ]
    },
    overDeveloped: {
      meaning: 'Depression, pessimism, isolation',
      weaknesses: ['Melancholic', 'Pessimistic', 'Isolated', 'Gloomy'],
      remedies: [
        'Social activities',
        'Optimism practice',
        'Blue Sapphire (consult astrologer)',
        'Light therapy'
      ]
    },
    flat: {
      meaning: 'Irresponsibility, lack of discipline',
      weaknesses: ['Irresponsible', 'Undisciplined', 'Immature'],
      remedies: [
        'Discipline practices',
        'Responsibility training',
        'Amethyst',
        'Om Shanaishcharaya Namaha'
      ]
    }
  },

  apollo: {
    planet: 'Sun/Apollo',
    location: 'Base of ring finger',
    wellDeveloped: {
      meaning: 'Creativity, fame, success, artistic talent',
      characteristics: [
        'Creative',
        'Artistic',
        'Famous',
        'Successful',
        'Optimistic',
        'Popular'
      ],
      career: [
        'Arts',
        'Entertainment',
        'Design',
        'Fashion',
        'Media',
        'Public relations'
      ]
    },
    overDeveloped: {
      meaning: 'Vanity, attention-seeking, extravagance',
      weaknesses: ['Vain', 'Attention-seeker', 'Extravagant', 'Superficial'],
      remedies: [
        'Humility',
        'Substance over style',
        'Ruby (moderation)',
        'Grounding practices'
      ]
    },
    flat: {
      meaning: 'Lack of creativity, dull personality',
      weaknesses: ['Uncreative', 'Dull', 'Unpopular'],
      remedies: [
        'Creative pursuits',
        'Art therapy',
        'Sunstone',
        'Om Suryaya Namaha'
      ]
    }
  },

  mercury: {
    planet: 'Mercury',
    location: 'Base of little finger',
    wellDeveloped: {
      meaning: 'Communication, business, intelligence, wit',
      characteristics: [
        'Excellent communicator',
        'Business-minded',
        'Intelligent',
        'Witty',
        'Quick learner',
        'Adaptable'
      ],
      career: [
        'Business',
        'Sales',
        'Marketing',
        'Writing',
        'Commerce',
        'Trading'
      ]
    },
    overDeveloped: {
      meaning: 'Cunning, deceitful, over-talkative',
      weaknesses: ['Cunning', 'Deceitful', 'Manipulative', 'Talks too much'],
      remedies: [
        'Honesty practice',
        'Listen more',
        'Emerald (ethical use)',
        'Truth meditation'
      ]
    },
    flat: {
      meaning: 'Poor communication, business struggles',
      weaknesses: ['Poor communicator', 'Business failures', 'Shy'],
      remedies: [
        'Communication training',
        'Business courses',
        'Emerald',
        'Om Budhaya Namaha'
      ]
    }
  },

  venus: {
    planet: 'Venus',
    location: 'Base of thumb (thumb mount)',
    wellDeveloped: {
      meaning: 'Love, passion, beauty, artistic appreciation',
      characteristics: [
        'Loving',
        'Passionate',
        'Appreciates beauty',
        'Romantic',
        'Sensual',
        'Artistic'
      ],
      career: [
        'Arts',
        'Beauty industry',
        'Fashion',
        'Hospitality',
        'Luxury goods',
        'Entertainment'
      ]
    },
    overDeveloped: {
      meaning: 'Excessive sensuality, indulgence, promiscuity',
      weaknesses: ['Over-indulgent', 'Promiscuous', 'Lazy', 'Hedonistic'],
      remedies: [
        'Self-control',
        'Moderation',
        'Diamond (commitment)',
        'Discipline practice'
      ]
    },
    flat: {
      meaning: 'Cold, unloving, lack of passion',
      weaknesses: ['Cold', 'Unromantic', 'Passionless', 'Austere'],
      remedies: [
        'Open heart practices',
        'Art appreciation',
        'Rose Quartz',
        'Om Shukraya Namaha'
      ]
    }
  },

  mars: {
    planet: 'Mars',
    location: 'Upper Mars (below Mercury) & Lower Mars (above Venus)',
    wellDeveloped: {
      meaning: 'Courage, energy, aggression (controlled), warrior spirit',
      characteristics: [
        'Courageous',
        'Energetic',
        'Assertive',
        'Competitive',
        'Protective',
        'Strong-willed'
      ],
      career: [
        'Military',
        'Police',
        'Sports',
        'Surgery',
        'Engineering',
        'Security'
      ]
    },
    overDeveloped: {
      meaning: 'Excessive aggression, violence, anger',
      weaknesses: ['Aggressive', 'Violent', 'Angry', 'Impulsive'],
      remedies: [
        'Anger management',
        'Meditation',
        'Red Coral (consult)',
        'Cooling practices'
      ]
    },
    flat: {
      meaning: 'Cowardice, lack of energy, weak will',
      weaknesses: ['Cowardly', 'Low energy', 'Weak-willed', 'Passive'],
      remedies: [
        'Physical exercise',
        'Courage building',
        'Red Coral',
        'Om Mangalaya Namaha'
      ]
    }
  },

  moon: {
    planet: 'Moon',
    location: 'Opposite Venus mount (lower palm)',
    wellDeveloped: {
      meaning: 'Imagination, intuition, creativity, psychic ability',
      characteristics: [
        'Imaginative',
        'Intuitive',
        'Creative',
        'Psychic',
        'Emotional',
        'Dreamy'
      ],
      career: [
        'Writing',
        'Arts',
        'Music',
        'Healing',
        'Psychology',
        'Spirituality'
      ]
    },
    overDeveloped: {
      meaning: 'Over-imagination, delusion, escapism',
      weaknesses: ['Delusional', 'Escapist', 'Moody', 'Unrealistic'],
      remedies: [
        'Grounding',
        'Reality checks',
        'Pearl (stability)',
        'Practical activities'
      ]
    },
    flat: {
      meaning: 'Lack of imagination, unimaginative',
      weaknesses: ['Unimaginative', 'Dull', 'Literal-minded'],
      remedies: [
        'Creative pursuits',
        'Imagination exercises',
        'Moonstone',
        'Om Chandraya Namaha'
      ]
    }
  }
};

// =====================================================
// FINGER ANALYSIS
// =====================================================

export const FINGER_MEANINGS = {
  thumb: {
    planet: 'Mars/Willpower',
    long: {
      meaning: 'Strong willpower, leadership, determination',
      traits: ['Strong-willed', 'Leader', 'Determined', 'Stubborn']
    },
    short: {
      meaning: 'Weak willpower, follower, yielding',
      traits: ['Weak-willed', 'Follower', 'Easily influenced']
    },
    flexible: {
      meaning: 'Adaptable, generous, flexible thinking',
      traits: ['Adaptable', 'Generous', 'Flexible', 'Open-minded']
    },
    stiff: {
      meaning: 'Stubborn, rigid, inflexible',
      traits: ['Stubborn', 'Rigid', 'Inflexible', 'Determined']
    }
  },

  jupiter: {
    planet: 'Jupiter',
    long: {
      meaning: 'Ambitious, leader, confident, egotistical',
      traits: ['Ambitious', 'Leader', 'Confident', 'Can be egotistical']
    },
    short: {
      meaning: 'Lacks confidence, unambitious, humble',
      traits: ['Humble', 'Unambitious', 'Lacks confidence']
    }
  },

  saturn: {
    planet: 'Saturn',
    long: {
      meaning: 'Serious, responsible, cautious, pessimistic',
      traits: ['Serious', 'Responsible', 'Cautious', 'May be pessimistic']
    },
    short: {
      meaning: 'Carefree, irresponsible, optimistic',
      traits: ['Carefree', 'Optimistic', 'May be irresponsible']
    }
  },

  apollo: {
    planet: 'Sun/Apollo',
    long: {
      meaning: 'Artistic, creative, gambling tendency',
      traits: ['Artistic', 'Creative', 'Risk-taker', 'May gamble']
    },
    short: {
      meaning: 'Practical, uncreative, conservative',
      traits: ['Practical', 'Conservative', 'Less creative']
    }
  },

  mercury: {
    planet: 'Mercury',
    long: {
      meaning: 'Excellent communicator, business-minded, eloquent',
      traits: ['Eloquent', 'Business-minded', 'Persuasive']
    },
    short: {
      meaning: 'Poor communication, direct, blunt',
      traits: ['Direct', 'Blunt', 'Poor communication skills']
    }
  }
};

// =====================================================
// MINOR LINES
// =====================================================

export const MINOR_LINES = {
  sunLine: {
    name: 'Sun Line (Apollo Line)',
    meaning: 'Success, fame, creativity, recognition',
    significance: 'Strong: Fame and success. Weak: Struggles for recognition.',
    location: 'Parallel to fate line, towards Apollo finger'
  },

  mercuryLine: {
    name: 'Mercury Line (Health Line)',
    meaning: 'Health, business acumen, communication',
    significance: 'Absent is good (no health issues). Present may indicate health concerns.',
    location: 'From base of palm towards Mercury finger'
  },

  intuitionLine: {
    name: 'Intuition Line',
    meaning: 'Psychic ability, intuition, sixth sense',
    significance: 'Rare line indicating strong intuitive/psychic abilities',
    location: 'Curved line on Mount of Moon'
  },

  marriageLines: {
    name: 'Marriage Lines (Relationship Lines)',
    meaning: 'Significant relationships, marriages',
    significance: 'Number indicates relationships. Deep = strong. Multiple = multiple relationships.',
    location: 'Side of palm below Mercury finger'
  },

  travelLines: {
    name: 'Travel Lines',
    meaning: 'Travel opportunities, journeys',
    significance: 'Number and depth indicate extent of travel in life',
    location: 'On Mount of Moon'
  },

  childrenLines: {
    name: 'Children Lines',
    meaning: 'Number of children',
    significance: 'Vertical lines above marriage lines. Deep = boy, Light = girl (traditional)',
    location: 'Above marriage lines'
  }
};

// =====================================================
// PALM READING GENERATION
// =====================================================

export function generatePalmReading(
  handShapeType: 'earth' | 'air' | 'water' | 'fire',
  dominantHand: 'left' | 'right',
  lineData: {
    heartLine: { quality: string; length: string };
    headLine: { quality: string; length: string; direction?: string };
    lifeLine: { quality: string; length: string };
    fateLine?: { quality: string; presence: boolean };
  },
  mountData: Record<string, 'well-developed' | 'normal' | 'flat' | 'over-developed'>,
  fingerData: Record<string, { length: string; flexibility?: string }>,
  minorLines?: {
    sunLine?: boolean;
    mercuryLine?: boolean;
    intuitionLine?: boolean;
    marriageLineCount?: number;
    travelLineCount?: number;
  }
): PalmReading {

  const handShape = HAND_SHAPES[handShapeType];

  // Analyze major lines
  const heartLine = analyzeHeartLine(lineData.heartLine);
  const headLine = analyzeHeadLine(lineData.headLine);
  const lifeLine = analyzeLifeLine(lineData.lifeLine);
  const fateLine = lineData.fateLine?.presence ? analyzeFateLine(lineData.fateLine) : undefined;

  // Analyze mounts
  const mounts = analyzeMounts(mountData);

  // Analyze fingers
  const fingers = analyzeFingers(fingerData);

  // Calculate planetary influences
  const planetaryInfluences = calculatePlanetaryInfluences(mounts);

  // Generate overall analysis
  const overallAnalysis = generateOverallAnalysis(
    handShape,
    heartLine,
    headLine,
    lifeLine,
    fateLine,
    mounts,
    fingers,
    planetaryInfluences
  );

  return {
    handShape,
    dominantHand,
    heartLine,
    headLine,
    lifeLine,
    fateLine,
    ...mounts,
    ...fingers,
    ...overallAnalysis,
    planetaryInfluences,
    remedies: generateRemedies(overallAnalysis.weaknesses, mounts, planetaryInfluences)
  };
}

function analyzeHeartLine(data: { quality: string; length: string }): MajorLine {
  const meaningData = HEART_LINE_MEANINGS[data.quality] || HEART_LINE_MEANINGS.deepAndClear;

  return {
    name: 'Heart Line',
    location: 'Horizontal line below fingers',
    quality: data.quality as any,
    length: data.length as any,
    meaning: meaningData.meaning,
    positive: meaningData.positive,
    negative: meaningData.negative,
    remedies: meaningData.remedies
  };
}

function analyzeHeadLine(data: { quality: string; length: string; direction?: string }): MajorLine {
  const meaningData = HEAD_LINE_MEANINGS[data.quality] || HEAD_LINE_MEANINGS.deepAndClear;

  let additionalMeaning = meaningData.meaning;
  if (data.direction === 'sloping') {
    additionalMeaning += '. ' + HEAD_LINE_MEANINGS.sloping.meaning;
  } else if (data.direction === 'straight') {
    additionalMeaning += '. ' + HEAD_LINE_MEANINGS.straight.meaning;
  }

  return {
    name: 'Head Line',
    location: 'Horizontal line in middle of palm',
    quality: data.quality as any,
    length: data.length as any,
    meaning: additionalMeaning,
    positive: meaningData.positive,
    negative: meaningData.negative,
    remedies: meaningData.remedies
  };
}

function analyzeLifeLine(data: { quality: string; length: string }): MajorLine {
  const meaningData = LIFE_LINE_MEANINGS[data.quality] || LIFE_LINE_MEANINGS.deepAndClear;

  return {
    name: 'Life Line',
    location: 'Curved line around thumb',
    quality: data.quality as any,
    length: data.length as any,
    meaning: meaningData.meaning,
    positive: meaningData.positive,
    negative: meaningData.negative,
    remedies: meaningData.remedies
  };
}

function analyzeFateLine(data: { quality: string }): MajorLine {
  const meaningData = FATE_LINE_MEANINGS[data.quality] || FATE_LINE_MEANINGS.deepAndClear;

  return {
    name: 'Fate Line',
    location: 'Vertical line in center of palm',
    quality: data.quality as any,
    length: 'long' as any,
    meaning: meaningData.meaning,
    positive: meaningData.positive,
    negative: meaningData.negative,
    remedies: meaningData.remedies
  };
}

function analyzeMounts(mountData: Record<string, string>) {
  const mounts: any = {};

  for (const [mountName, development] of Object.entries(mountData)) {
    const mountInfo = MOUNT_INTERPRETATIONS[mountName];
    if (!mountInfo) continue;

    const devData = mountInfo[development] || mountInfo.wellDeveloped;

    mounts[`mountOf${mountName.charAt(0).toUpperCase() + mountName.slice(1)}`] = {
      name: `Mount of ${mountName.charAt(0).toUpperCase() + mountName.slice(1)}`,
      planet: mountInfo.planet,
      location: mountInfo.location,
      development: development as any,
      meaning: devData.meaning,
      characteristics: devData.characteristics || [],
      career: devData.career || [],
      weaknesses: devData.weaknesses
    };
  }

  return mounts;
}

function analyzeFingers(fingerData: Record<string, any>) {
  const fingers: any = {};

  for (const [fingerName, data] of Object.entries(fingerData)) {
    const fingerInfo = FINGER_MEANINGS[fingerName];
    if (!fingerInfo) continue;

    const lengthData = fingerInfo[data.length] || fingerInfo.long;
    const flexData = data.flexibility ? fingerInfo[data.flexibility] : null;

    fingers[`${fingerName}${fingerName === 'thumb' ? 'Analysis' : 'Finger'}`] = {
      finger: fingerName.charAt(0).toUpperCase() + fingerName.slice(1),
      planet: fingerInfo.planet,
      length: data.length,
      flexibility: data.flexibility || 'normal',
      phalanges: {
        top: 'Mental/Spiritual realm',
        middle: 'Practical realm',
        bottom: 'Material realm'
      },
      meaning: lengthData.meaning + (flexData ? '. ' + flexData.meaning : ''),
      traits: [...lengthData.traits, ...(flexData?.traits || [])]
    };
  }

  return fingers;
}

function calculatePlanetaryInfluences(mounts: any) {
  const influences = [];

  for (const mount of Object.values(mounts) as any[]) {
    if (!mount.planet) continue;

    let strength = 50; // normal
    if (mount.development === 'well-developed') strength = 80;
    if (mount.development === 'over-developed') strength = 95;
    if (mount.development === 'flat') strength = 20;

    influences.push({
      planet: mount.planet,
      strength,
      impact: mount.meaning
    });
  }

  return influences;
}

function generateOverallAnalysis(
  handShape: HandShape,
  heartLine: MajorLine,
  headLine: MajorLine,
  lifeLine: MajorLine,
  fateLine: MajorLine | undefined,
  mounts: any,
  fingers: any,
  planetaryInfluences: any[]
) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const careerSuggestions: string[] = [];
  const healthIndications: string[] = [];

  // From hand shape
  strengths.push(`${handShape.element} hand: ${handShape.personality}`);
  careerSuggestions.push(...handShape.career);

  // From major lines
  strengths.push(...heartLine.positive);
  weaknesses.push(...heartLine.negative);
  strengths.push(...headLine.positive);
  weaknesses.push(...headLine.negative);
  strengths.push(...lifeLine.positive);
  weaknesses.push(...lifeLine.negative);

  if (fateLine) {
    strengths.push(...fateLine.positive);
    weaknesses.push(...fateLine.negative);
  }

  // Health from life line
  if (lifeLine.quality === 'lightOrWeak' || lifeLine.quality === 'broken') {
    healthIndications.push('Monitor health closely');
    healthIndications.push('Focus on building immunity');
  }

  // From mounts
  for (const mount of Object.values(mounts) as any[]) {
    if (mount.development === 'well-developed') {
      strengths.push(`Strong ${mount.planet} influence`);
      careerSuggestions.push(...mount.career);
    }
    if (mount.weaknesses) {
      weaknesses.push(...mount.weaknesses);
    }
  }

  // Overall personality
  const dominantPlanet = planetaryInfluences.reduce((max, curr) =>
    curr.strength > max.strength ? curr : max
  );

  const weakestPlanet = planetaryInfluences.reduce((min, curr) =>
    curr.strength < min.strength ? curr : min
  );

  const overallPersonality = `${handShape.personality}. Dominated by ${dominantPlanet.planet} energy. ` +
    `${heartLine.meaning} ${headLine.meaning}`;

  const relationshipAnalysis = `${heartLine.meaning}. ${handShape.relationships}`;

  const wealthPotential = fateLine ?
    'Strong fate line indicates career success and wealth accumulation' :
    'Absence of fate line indicates self-made wealth through own efforts';

  const lifeExpectancy = lifeLine.length === 'long' ?
    'Long life line indicates longevity and vitality' :
    'Shorter life line indicates intensity over longevity';

  return {
    overallPersonality,
    strengths: [...new Set(strengths)].slice(0, 10),
    weaknesses: [...new Set(weaknesses)].slice(0, 10),
    careerSuggestions: [...new Set(careerSuggestions)].slice(0, 8),
    healthIndications,
    relationshipAnalysis,
    wealthPotential,
    lifeExpectancy,
    overallBalance: calculateOverallBalance(planetaryInfluences),
    dominantPlanet: dominantPlanet.planet,
    weakestPlanet: weakestPlanet.planet
  };
}

function calculateOverallBalance(influences: any[]): number {
  // Calculate balance score based on planetary distribution
  const total = influences.reduce((sum, inf) => sum + inf.strength, 0);
  const average = total / influences.length;
  const variance = influences.reduce((sum, inf) =>
    sum + Math.pow(inf.strength - average, 2), 0
  ) / influences.length;

  // Lower variance = better balance
  const balance = Math.max(0, 100 - variance);
  return Math.round(balance);
}

function generateRemedies(
  weaknesses: string[],
  mounts: any,
  planetaryInfluences: any[]
): any[] {
  const remedies = [];

  // Find weak planets
  for (const influence of planetaryInfluences) {
    if (influence.strength < 40) {
      const remedyArea = `Weak ${influence.planet}`;
      const suggestions = getPlanetaryRemedies(influence.planet);
      remedies.push({ area: remedyArea, suggestions });
    }
  }

  // Add specific remedies based on weaknesses
  if (weaknesses.some(w => w.includes('health') || w.includes('illness'))) {
    remedies.push({
      area: 'Health',
      suggestions: [
        'Regular exercise and yoga',
        'Ayurvedic consultation',
        'Mahamrityunjaya mantra',
        'Red Jasper or Bloodstone crystal'
      ]
    });
  }

  if (weaknesses.some(w => w.includes('confidence') || w.includes('ambition'))) {
    remedies.push({
      area: 'Confidence & Ambition',
      suggestions: [
        'Wear Yellow Sapphire',
        'Om Guruve Namaha mantra',
        'Leadership training',
        'Goal setting practices'
      ]
    });
  }

  return remedies;
}

function getPlanetaryRemedies(planet: string): string[] {
  const remediesMap: Record<string, string[]> = {
    'Sun': ['Ruby gemstone', 'Om Suryaya Namaha', 'Surya Namaskar', 'Donate wheat on Sundays'],
    'Moon': ['Pearl gemstone', 'Om Chandraya Namaha', 'Meditation', 'Donate milk on Mondays'],
    'Mars': ['Red Coral', 'Om Mangalaya Namaha', 'Physical exercise', 'Donate red lentils on Tuesdays'],
    'Mercury': ['Emerald gemstone', 'Om Budhaya Namaha', 'Study & learning', 'Donate green items on Wednesdays'],
    'Jupiter': ['Yellow Sapphire', 'Om Guruve Namaha', 'Teaching/mentoring', 'Donate yellow items on Thursdays'],
    'Venus': ['Diamond/White Sapphire', 'Om Shukraya Namaha', 'Art & music', 'Donate white items on Fridays'],
    'Saturn': ['Blue Sapphire (caution)', 'Om Shanaishcharaya Namaha', 'Serve the elderly', 'Donate black items on Saturdays'],
    'Rahu': ['Hessonite Garnet', 'Om Rahuve Namaha', 'Meditation', 'Donate to the poor'],
    'Ketu': ['Cat\'s Eye', 'Om Ketave Namaha', 'Spiritual practices', 'Donate to spiritual causes']
  };

  return remediesMap[planet] || ['Consult an astrologer'];
}

// =====================================================
// EXPORT ALL
// =====================================================

export default {
  HAND_SHAPES,
  HEART_LINE_MEANINGS,
  HEAD_LINE_MEANINGS,
  LIFE_LINE_MEANINGS,
  FATE_LINE_MEANINGS,
  MOUNT_INTERPRETATIONS,
  FINGER_MEANINGS,
  MINOR_LINES,
  generatePalmReading
};
