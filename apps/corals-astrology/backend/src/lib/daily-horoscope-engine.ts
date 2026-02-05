/**
 * Daily Horoscope Engine
 * Generates personalized daily predictions based on Moon sign and planetary transits
 */

export interface DailyHoroscope {
  sign: ZodiacSign;
  date: string;
  overview: string;
  love: HoroscopeCategory;
  career: HoroscopeCategory;
  health: HoroscopeCategory;
  finance: HoroscopeCategory;
  luckyElements: LuckyElements;
  dosAndDonts: {
    dos: string[];
    donts: string[];
  };
  compatibleSigns: ZodiacSign[];
  rating: {
    love: number;
    career: number;
    health: number;
    finance: number;
    overall: number;
  };
  specialMessage?: string;
}

export interface HoroscopeCategory {
  prediction: string;
  rating: number; // 1-5 stars
  advice: string;
}

export interface LuckyElements {
  numbers: number[];
  colors: string[];
  directions: string[];
  time: string;
  day: string;
  gemstone: string;
}

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

// Moon sign to element mapping
const SIGN_ELEMENTS: Record<ZodiacSign, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  'Aries': 'Fire',
  'Leo': 'Fire',
  'Sagittarius': 'Fire',
  'Taurus': 'Earth',
  'Virgo': 'Earth',
  'Capricorn': 'Earth',
  'Gemini': 'Air',
  'Libra': 'Air',
  'Aquarius': 'Air',
  'Cancer': 'Water',
  'Scorpio': 'Water',
  'Pisces': 'Water',
};

// Lucky colors by sign
const LUCKY_COLORS: Record<ZodiacSign, string[]> = {
  'Aries': ['Red', 'Orange', 'White'],
  'Taurus': ['Green', 'Pink', 'Blue'],
  'Gemini': ['Yellow', 'Light Green', 'White'],
  'Cancer': ['White', 'Silver', 'Cream'],
  'Leo': ['Gold', 'Orange', 'Yellow'],
  'Virgo': ['Green', 'Brown', 'Navy Blue'],
  'Libra': ['Pink', 'Light Blue', 'White'],
  'Scorpio': ['Maroon', 'Red', 'Black'],
  'Sagittarius': ['Purple', 'Yellow', 'Orange'],
  'Capricorn': ['Black', 'Brown', 'Dark Blue'],
  'Aquarius': ['Blue', 'Turquoise', 'Grey'],
  'Pisces': ['Sea Green', 'Lavender', 'White'],
};

// Lucky gemstones by sign (ruling planet)
const LUCKY_GEMSTONES: Record<ZodiacSign, string> = {
  'Aries': 'Red Coral (Moonga)',
  'Taurus': 'Diamond (Heera)',
  'Gemini': 'Emerald (Panna)',
  'Cancer': 'Pearl (Moti)',
  'Leo': 'Ruby (Manik)',
  'Virgo': 'Emerald (Panna)',
  'Libra': 'Diamond (Heera)',
  'Scorpio': 'Red Coral (Moonga)',
  'Sagittarius': 'Yellow Sapphire (Pukhraj)',
  'Capricorn': 'Blue Sapphire (Neelam)',
  'Aquarius': 'Blue Sapphire (Neelam)',
  'Pisces': 'Yellow Sapphire (Pukhraj)',
};

// Directions by sign
const LUCKY_DIRECTIONS: Record<ZodiacSign, string[]> = {
  'Aries': ['East', 'South'],
  'Taurus': ['South', 'West'],
  'Gemini': ['North', 'East'],
  'Cancer': ['North', 'West'],
  'Leo': ['East', 'South'],
  'Virgo': ['South', 'West'],
  'Libra': ['West', 'North'],
  'Scorpio': ['North', 'East'],
  'Sagittarius': ['East', 'North-East'],
  'Capricorn': ['South', 'West'],
  'Aquarius': ['West', 'South-West'],
  'Pisces': ['North', 'North-East'],
};

/**
 * Get day of week from date
 */
function getDayOfWeek(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Get moon phase for the date (simplified)
 */
function getMoonPhase(date: Date): 'New Moon' | 'Waxing' | 'Full Moon' | 'Waning' {
  const day = date.getDate();
  if (day <= 7) return 'New Moon';
  if (day <= 14) return 'Waxing';
  if (day <= 21) return 'Full Moon';
  return 'Waning';
}

/**
 * Generate lucky numbers based on sign and date
 */
function generateLuckyNumbers(sign: ZodiacSign, date: Date): number[] {
  const signIndex = Object.keys(SIGN_ELEMENTS).indexOf(sign) + 1;
  const dateNum = date.getDate();
  const monthNum = date.getMonth() + 1;

  const nums = [
    signIndex,
    (signIndex + dateNum) % 100,
    (signIndex * monthNum) % 100,
  ];

  return nums.map(n => n === 0 ? 1 : n).sort((a, b) => a - b);
}

/**
 * Generate lucky time based on sign
 */
function generateLuckyTime(sign: ZodiacSign): string {
  const times: Record<string, string> = {
    'Fire': '10:00 AM - 12:00 PM',
    'Earth': '2:00 PM - 4:00 PM',
    'Air': '6:00 AM - 8:00 AM',
    'Water': '8:00 PM - 10:00 PM',
  };
  return times[SIGN_ELEMENTS[sign]];
}

/**
 * Get compatible signs based on element harmony
 */
function getCompatibleSigns(sign: ZodiacSign): ZodiacSign[] {
  const element = SIGN_ELEMENTS[sign];
  const compatible: Record<string, ZodiacSign[]> = {
    'Fire': ['Aries', 'Leo', 'Sagittarius'],
    'Earth': ['Taurus', 'Virgo', 'Capricorn'],
    'Air': ['Gemini', 'Libra', 'Aquarius'],
    'Water': ['Cancer', 'Scorpio', 'Pisces'],
  };

  // Return same element signs (excluding current sign)
  return compatible[element].filter(s => s !== sign);
}

/**
 * Generate predictions based on sign characteristics
 */
function generatePredictions(sign: ZodiacSign, date: Date): DailyHoroscope {
  const dayOfWeek = getDayOfWeek(date);
  const moonPhase = getMoonPhase(date);

  // Base predictions by sign (template-based with variety)
  const predictions = getPredictionsForSign(sign, dayOfWeek, moonPhase);

  return {
    sign,
    date: date.toISOString().split('T')[0],
    overview: predictions.overview,
    love: predictions.love,
    career: predictions.career,
    health: predictions.health,
    finance: predictions.finance,
    luckyElements: {
      numbers: generateLuckyNumbers(sign, date),
      colors: LUCKY_COLORS[sign],
      directions: LUCKY_DIRECTIONS[sign],
      time: generateLuckyTime(sign),
      day: dayOfWeek,
      gemstone: LUCKY_GEMSTONES[sign],
    },
    dosAndDonts: predictions.dosAndDonts,
    compatibleSigns: getCompatibleSigns(sign),
    rating: predictions.rating,
    specialMessage: predictions.specialMessage,
  };
}

/**
 * Get sign-specific predictions
 */
function getPredictionsForSign(
  sign: ZodiacSign,
  dayOfWeek: string,
  moonPhase: string
): Omit<DailyHoroscope, 'sign' | 'date' | 'luckyElements' | 'compatibleSigns'> {

  const signPredictions: Record<ZodiacSign, any> = {
    'Aries': {
      overview: `Today brings dynamic energy for Aries natives. Mars, your ruling planet, blesses you with courage and initiative. The ${moonPhase} Moon phase supports new beginnings. This ${dayOfWeek} is perfect for taking bold steps in your ambitions.`,
      love: {
        prediction: 'Romance takes an exciting turn today. Single Aries may meet someone special through work or social gatherings. Couples should plan something adventurous together. Express your feelings openly - your natural passion will be well-received.',
        rating: 4,
        advice: 'Be spontaneous and honest in your romantic expressions. Avoid being too aggressive.',
      },
      career: {
        prediction: 'Excellent day for career advancement. Your leadership qualities shine bright. Important presentations or meetings will go in your favor. Take initiative on new projects - superiors will notice your enthusiasm.',
        rating: 5,
        advice: 'Channel your energy into productive tasks. Network with colleagues and share innovative ideas.',
      },
      health: {
        prediction: 'Energy levels are high but watch for impulsive actions leading to minor accidents. Focus on physical activities like gym or sports. Avoid overexertion and stay hydrated throughout the day.',
        rating: 3,
        advice: 'Practice yoga or meditation to balance your fiery energy. Get adequate rest tonight.',
      },
      finance: {
        prediction: 'Good day for financial planning and investments. Unexpected money may come through old dues or bonuses. However, avoid impulsive purchases - think before you spend on luxury items.',
        rating: 4,
        advice: 'Review your budget and savings plan. Consider starting a new investment scheme.',
      },
      dosAndDonts: {
        dos: [
          'Start new ventures or projects',
          'Exercise and stay physically active',
          'Be bold in expressing your ideas',
          'Help someone in need - good karma',
        ],
        donts: [
          'Avoid arguments with family members',
          'Don\'t take unnecessary risks',
          'Stay away from spicy food',
          'Don\'t make hasty decisions',
        ],
      },
      rating: {
        love: 4,
        career: 5,
        health: 3,
        finance: 4,
        overall: 4,
      },
      specialMessage: 'The fire within you is strong today. Use it to illuminate others\' paths, not to burn bridges.',
    },

    'Taurus': {
      overview: `Venus graces your sign with stability and comfort today. The ${moonPhase} Moon enhances your practical nature. This ${dayOfWeek} favors long-term planning and enjoying life's simple pleasures.`,
      love: {
        prediction: 'Love life is peaceful and harmonious. Express your feelings through thoughtful gestures rather than words. Singles may find interest in someone from their friend circle. A romantic dinner or meaningful conversation strengthens bonds.',
        rating: 4,
        advice: 'Quality time with your partner matters more than expensive gifts. Be patient and understanding.',
      },
      career: {
        prediction: 'Steady progress in professional life. Your patience and dedication get recognized. Good day for negotiations and closing deals. Stick to your methods - they work. Avoid rushing into new commitments.',
        rating: 4,
        advice: 'Focus on completing pending tasks. Your reliability will earn you respect from seniors.',
      },
      health: {
        prediction: 'Generally good health but watch your diet. Avoid overindulgence in food and sweets. Throat and neck issues may arise - keep yourself warm. Light exercise like walking is beneficial.',
        rating: 3,
        advice: 'Maintain a balanced diet. Practice portion control and drink herbal teas.',
      },
      finance: {
        prediction: 'Financial stability continues. Good day for saving and planning long-term investments. Real estate matters are favorable. Avoid lending money to friends or relatives - it may strain relationships.',
        rating: 4,
        advice: 'Review your insurance policies and retirement plans. Consider fixed deposits or bonds.',
      },
      dosAndDonts: {
        dos: [
          'Spend quality time with loved ones',
          'Work on home improvement projects',
          'Save money for future needs',
          'Enjoy nature - go for a walk in a garden',
        ],
        donts: [
          'Avoid being too stubborn in discussions',
          'Don\'t overspend on luxury items',
          'Stay away from junk food',
          'Don\'t resist necessary changes',
        ],
      },
      rating: {
        love: 4,
        career: 4,
        health: 3,
        finance: 4,
        overall: 4,
      },
      specialMessage: 'Slow and steady wins the race. Your persistence is your greatest strength.',
    },

    'Gemini': {
      overview: `Mercury sharpens your intellect and communication skills today. The ${moonPhase} Moon brings mental clarity. This ${dayOfWeek} is perfect for networking, learning, and multitasking.`,
      love: {
        prediction: 'Communication is the key to your romantic success today. Express your feelings through words - write a message or have a heartfelt conversation. Singles may connect with someone through social media or events.',
        rating: 4,
        advice: 'Listen as much as you speak. Show genuine interest in your partner\'s thoughts and feelings.',
      },
      career: {
        prediction: 'Excellent day for presentations, meetings, and client interactions. Your wit and versatility impress others. Multiple opportunities may arise - evaluate them carefully. Networking brings unexpected benefits.',
        rating: 5,
        advice: 'Update your skills through online courses. Connect with mentors and industry experts.',
      },
      health: {
        prediction: 'Mental energy is high but physical energy may lag. Avoid information overload - too much screen time can cause headaches. Take regular breaks. Breathing exercises help maintain balance.',
        rating: 3,
        advice: 'Practice digital detox for a few hours. Engage in activities that relax your mind.',
      },
      finance: {
        prediction: 'Good for financial planning and exploring new income sources. Your analytical skills help you spot opportunities. However, avoid get-rich-quick schemes. Diversify your income streams thoughtfully.',
        rating: 4,
        advice: 'Research investment options thoroughly. Consider freelancing or side projects.',
      },
      dosAndDonts: {
        dos: [
          'Attend workshops or webinars',
          'Network and expand your contacts',
          'Read books or articles on new topics',
          'Engage in stimulating conversations',
        ],
        donts: [
          'Avoid gossip and spreading rumors',
          'Don\'t commit to too many things at once',
          'Stay away from overthinking',
          'Don\'t neglect physical exercise',
        ],
      },
      rating: {
        love: 4,
        career: 5,
        health: 3,
        finance: 4,
        overall: 4,
      },
      specialMessage: 'Your words have power today. Use them to inspire, educate, and connect.',
    },

    'Cancer': {
      overview: `The Moon, your ruling planet, fills your heart with emotions today. The ${moonPhase} phase enhances your intuition. This ${dayOfWeek} is ideal for family matters and emotional healing.`,
      love: {
        prediction: 'Deep emotional connections strengthen today. Show your caring nature through actions. Singles may reconnect with an old flame. Couples should spend quality time at home. Your nurturing nature is appreciated.',
        rating: 5,
        advice: 'Trust your intuition in matters of the heart. Create a cozy, intimate atmosphere.',
      },
      career: {
        prediction: 'Your empathetic approach wins hearts at work. Good day for team collaborations and helping colleagues. Creative projects get a boost. Trust your gut feeling in decision-making. Avoid office politics.',
        rating: 4,
        advice: 'Build strong relationships with team members. Your supportive nature creates a positive work environment.',
      },
      health: {
        prediction: 'Emotional well-being directly affects physical health today. Digestive issues may arise from stress. Focus on comfort foods that are also nutritious. Stay hydrated and avoid cold drinks.',
        rating: 3,
        advice: 'Practice self-care rituals. Take a warm bath, light candles, and relax at home.',
      },
      finance: {
        prediction: 'Focus on family financial planning and home-related expenses. Good day to review household budget. Real estate investments are favorable. Save for emergency funds - security is important to you.',
        rating: 3,
        advice: 'Prioritize family needs in financial decisions. Avoid emotional spending on unnecessary items.',
      },
      dosAndDonts: {
        dos: [
          'Spend time with family and loved ones',
          'Cook or enjoy home-cooked meals',
          'Trust your intuition in decisions',
          'Create a comfortable home environment',
        ],
        donts: [
          'Avoid mood swings affecting work',
          'Don\'t hold onto past hurts',
          'Stay away from conflicts at home',
          'Don\'t let emotions cloud judgment',
        ],
      },
      rating: {
        love: 5,
        career: 4,
        health: 3,
        finance: 3,
        overall: 4,
      },
      specialMessage: 'Your emotional strength is your superpower. Nurture yourself as you nurture others.',
    },

    'Leo': {
      overview: `The Sun illuminates your path with confidence and charisma today. The ${moonPhase} Moon amplifies your creative energy. This ${dayOfWeek} is your day to shine and lead.`,
      love: {
        prediction: 'Romance is passionate and dramatic. Your magnetic charm attracts attention. Singles may experience love at first sight. Couples should plan something special and romantic. Grand gestures are appreciated today.',
        rating: 5,
        advice: 'Be generous with affection but also humble. Let your partner shine too.',
      },
      career: {
        prediction: 'Leadership opportunities arise naturally. Your confidence inspires the team. Perfect day for presentations, client meetings, or launching new projects. Recognition and appreciation come your way. Stay focused.',
        rating: 5,
        advice: 'Lead with integrity and inspire others. Your creative ideas will be well-received.',
      },
      health: {
        prediction: 'Energy levels are excellent. Good day for physical activities and sports. However, watch for ego-driven overexertion. Heart health needs attention - avoid excessive caffeine. Stay hydrated.',
        rating: 4,
        advice: 'Channel your energy into productive physical activities. Don\'t skip warm-up exercises.',
      },
      finance: {
        prediction: 'Financial confidence is high. Good for investments in gold, luxury items, or entertainment ventures. Avoid overspending to impress others. Your generosity is admirable but set limits.',
        rating: 4,
        advice: 'Invest in assets that reflect your values. Balance generosity with practical savings.',
      },
      dosAndDonts: {
        dos: [
          'Take the lead in important matters',
          'Express your creative talents',
          'Be generous and help others',
          'Dress well and make an impression',
        ],
        donts: [
          'Avoid arrogance or dominating behavior',
          'Don\'t seek constant validation',
          'Stay away from risky speculations',
          'Don\'t ignore team members\' contributions',
        ],
      },
      rating: {
        love: 5,
        career: 5,
        health: 4,
        finance: 4,
        overall: 5,
      },
      specialMessage: 'You are born to lead, but true leadership is about service, not ego.',
    },

    'Virgo': {
      overview: `Mercury blesses you with analytical clarity today. The ${moonPhase} Moon enhances your attention to detail. This ${dayOfWeek} is perfect for organizing, planning, and perfecting your craft.`,
      love: {
        prediction: 'Show love through acts of service and practical help. Singles may find connection through work or health-related activities. Couples should focus on improving daily routines together. Small gestures matter.',
        rating: 3,
        advice: 'Express feelings in practical ways. Plan something thoughtful rather than extravagant.',
      },
      career: {
        prediction: 'Your efficiency and attention to detail shine. Perfect day for analytical work, problem-solving, and quality checks. Colleagues seek your expertise. Organize your workspace - productivity increases significantly.',
        rating: 5,
        advice: 'Create detailed plans and checklists. Your systematic approach impresses superiors.',
      },
      health: {
        prediction: 'Good day to focus on health routines and diet. Digestive system is sensitive - eat clean, fresh food. Start a new health regimen or detox plan. Yoga and meditation bring mental clarity.',
        rating: 4,
        advice: 'Maintain hygiene standards strictly. Consider consulting a nutritionist for personalized diet.',
      },
      finance: {
        prediction: 'Excellent for budgeting and financial planning. Review your expenses and cut unnecessary costs. Good day for insurance, health plans, and systematic savings. Avoid impulsive purchases.',
        rating: 4,
        advice: 'Create a detailed financial spreadsheet. Look for ways to optimize expenses.',
      },
      dosAndDonts: {
        dos: [
          'Organize your workspace and home',
          'Focus on health and wellness',
          'Help others with practical advice',
          'Review and improve your routines',
        ],
        donts: [
          'Avoid over-criticizing yourself or others',
          'Don\'t stress over small imperfections',
          'Stay away from worry and anxiety',
          'Don\'t neglect rest and relaxation',
        ],
      },
      rating: {
        love: 3,
        career: 5,
        health: 4,
        finance: 4,
        overall: 4,
      },
      specialMessage: 'Perfection is a journey, not a destination. Appreciate progress over perfection.',
    },

    'Libra': {
      overview: `Venus brings harmony and balance to your day. The ${moonPhase} Moon enhances your diplomatic skills. This ${dayOfWeek} is ideal for relationships, partnerships, and aesthetic pursuits.`,
      love: {
        prediction: 'Love and romance flourish today. Your charm and grace attract positive attention. Singles may meet someone at a social gathering or art event. Couples should enjoy cultural activities together. Balance is key.',
        rating: 5,
        advice: 'Create beautiful moments together. Fairness and equality strengthen your relationship.',
      },
      career: {
        prediction: 'Your diplomatic skills are invaluable at work. Perfect day for negotiations, partnerships, and client relations. Creative projects get approval. Collaborate rather than compete. Your balanced approach resolves conflicts.',
        rating: 4,
        advice: 'Mediate disputes and bring harmony to the team. Your aesthetic sense adds value to projects.',
      },
      health: {
        prediction: 'Kidney and lower back need attention. Stay hydrated and avoid excessive salt intake. Balance is crucial - don\'t overwork or overrest. Activities like dancing or tai chi are beneficial.',
        rating: 3,
        advice: 'Maintain work-life balance. Practice activities that combine movement with grace.',
      },
      finance: {
        prediction: 'Good for partnerships and joint financial ventures. Your sense of fairness helps in negotiations. Avoid overspending on luxury items or fashion. Invest in art or beautiful things with long-term value.',
        rating: 4,
        advice: 'Seek financial advice from trusted partners. Balance spending with saving.',
      },
      dosAndDonts: {
        dos: [
          'Attend social gatherings and events',
          'Focus on building relationships',
          'Appreciate art, music, and beauty',
          'Mediate conflicts and bring peace',
        ],
        donts: [
          'Avoid indecisiveness in important matters',
          'Don\'t compromise too much on your needs',
          'Stay away from conflict avoidance',
          'Don\'t overspend on appearances',
        ],
      },
      rating: {
        love: 5,
        career: 4,
        health: 3,
        finance: 4,
        overall: 4,
      },
      specialMessage: 'True balance comes from inner peace, not external validation.',
    },

    'Scorpio': {
      overview: `Mars and Pluto empower you with intensity and transformation today. The ${moonPhase} Moon deepens your intuitive abilities. This ${dayOfWeek} is powerful for deep work and personal growth.`,
      love: {
        prediction: 'Intense emotional connections deepen today. Your passionate nature is magnetic. Singles may experience a powerful attraction. Couples should have deep, honest conversations. Trust and loyalty matter most.',
        rating: 5,
        advice: 'Share your vulnerabilities. True intimacy requires emotional honesty and trust.',
      },
      career: {
        prediction: 'Your research abilities and strategic thinking shine. Perfect for investigation, analysis, and uncovering hidden information. Power dynamics at work need careful navigation. Your determination impresses decision-makers.',
        rating: 4,
        advice: 'Focus on long-term strategy over quick wins. Your persistence pays off eventually.',
      },
      health: {
        prediction: 'Excellent energy for transformation and healing. Good day to address chronic health issues. Emotional and physical health are deeply connected. Practice stress management techniques.',
        rating: 4,
        advice: 'Engage in activities that release emotional tension. Consider therapy or deep meditation.',
      },
      finance: {
        prediction: 'Favorable for joint finances, loans, and insurance matters. Your investigative skills help you spot financial opportunities others miss. Good day for debt management and strategic investments.',
        rating: 4,
        advice: 'Research thoroughly before financial commitments. Consider long-term wealth building strategies.',
      },
      dosAndDonts: {
        dos: [
          'Trust your intuition in all matters',
          'Deep dive into research or investigation',
          'Transform negative patterns',
          'Strengthen emotional bonds',
        ],
        donts: [
          'Avoid jealousy and possessiveness',
          'Don\'t manipulate or control others',
          'Stay away from revenge thoughts',
          'Don\'t suppress emotions - release them',
        ],
      },
      rating: {
        love: 5,
        career: 4,
        health: 4,
        finance: 4,
        overall: 4,
      },
      specialMessage: 'Your power lies in transformation. Use it to evolve, not to control.',
    },

    'Sagittarius': {
      overview: `Jupiter expands your horizons with optimism and wisdom today. The ${moonPhase} Moon enhances your adventurous spirit. This ${dayOfWeek} is perfect for learning, traveling, and philosophical pursuits.`,
      love: {
        prediction: 'Freedom and adventure strengthen your relationships. Singles may meet someone during travel or learning activities. Couples should explore new experiences together. Honesty and openness attract positive energy.',
        rating: 4,
        advice: 'Give your partner space to grow. Shared adventures create lasting memories.',
      },
      career: {
        prediction: 'Your vision and optimism inspire the team. Good day for presentations, teaching, or international dealings. New opportunities for growth and expansion arise. Your enthusiasm is contagious - use it wisely.',
        rating: 5,
        advice: 'Think big but plan practically. Your knowledge and wisdom add value to projects.',
      },
      health: {
        prediction: 'Energy levels are good. Perfect day for outdoor activities and sports. Watch for overconfidence leading to accidents. Liver and hip area need attention. Maintain a balanced diet.',
        rating: 4,
        advice: 'Engage in activities that combine physical exercise with mental stimulation like hiking.',
      },
      finance: {
        prediction: 'Optimistic about finances but avoid overconfidence. Good for investments in education, travel, or publishing. International business opportunities are favorable. Avoid gambling or risky speculations.',
        rating: 3,
        advice: 'Expand income sources through knowledge sharing. Invest in learning new skills.',
      },
      dosAndDonts: {
        dos: [
          'Learn something new and exciting',
          'Plan a trip or explore new places',
          'Share your knowledge with others',
          'Stay optimistic and hopeful',
        ],
        donts: [
          'Avoid overcommitting to projects',
          'Don\'t be too blunt in speech',
          'Stay away from risky gambling',
          'Don\'t ignore details in enthusiasm',
        ],
      },
      rating: {
        love: 4,
        career: 5,
        health: 4,
        finance: 3,
        overall: 4,
      },
      specialMessage: 'Aim for the stars but keep your feet on the ground. Balance idealism with realism.',
    },

    'Capricorn': {
      overview: `Saturn rewards your discipline and hard work today. The ${moonPhase} Moon strengthens your ambitions. This ${dayOfWeek} is excellent for professional advancement and long-term planning.`,
      love: {
        prediction: 'Practical approach to relationships works well. Show commitment through responsible actions. Singles may attract mature, stable partners. Couples should discuss future plans and long-term goals together.',
        rating: 3,
        advice: 'Express emotions even if it feels uncomfortable. Vulnerability strengthens bonds.',
      },
      career: {
        prediction: 'Outstanding day for career progress. Your professionalism and dedication get recognized. Perfect for important meetings with seniors or authorities. Long-term projects reach milestones. Leadership opportunities arise.',
        rating: 5,
        advice: 'Set ambitious yet achievable goals. Your strategic planning skills are your strength.',
      },
      health: {
        prediction: 'Bones and joints need attention. Maintain good posture and avoid sitting for long hours. Stress management is crucial. Regular exercise and adequate calcium intake are important.',
        rating: 3,
        advice: 'Take regular breaks during work. Practice stretching exercises throughout the day.',
      },
      finance: {
        prediction: 'Excellent for financial planning and long-term investments. Your cautious approach protects you from losses. Good day for real estate, retirement planning, and building assets. Save systematically.',
        rating: 5,
        advice: 'Focus on wealth building through disciplined saving and smart investments.',
      },
      dosAndDonts: {
        dos: [
          'Focus on career and professional goals',
          'Plan for long-term financial security',
          'Be responsible and reliable',
          'Mentor younger colleagues',
        ],
        donts: [
          'Avoid being too pessimistic',
          'Don\'t work excessively - rest is important',
          'Stay away from rigid thinking',
          'Don\'t neglect personal relationships',
        ],
      },
      rating: {
        love: 3,
        career: 5,
        health: 3,
        finance: 5,
        overall: 4,
      },
      specialMessage: 'Success is a marathon, not a sprint. Your patience and persistence will reward you.',
    },

    'Aquarius': {
      overview: `Saturn and Uranus bring innovation and structure together. The ${moonPhase} Moon activates your humanitarian instincts. This ${dayOfWeek} is ideal for networking and innovative thinking.`,
      love: {
        prediction: 'Unconventional approach to love works in your favor. Singles may meet someone through social causes or group activities. Couples should respect each other\'s independence. Intellectual connection matters.',
        rating: 4,
        advice: 'Friendship is the foundation of lasting love. Give your partner freedom to be themselves.',
      },
      career: {
        prediction: 'Your innovative ideas get attention. Perfect day for technology projects, team collaborations, and networking. Think outside the box - your unique perspective is valuable. Social media and online presence grow.',
        rating: 5,
        advice: 'Connect with like-minded professionals. Your vision for the future inspires others.',
      },
      health: {
        prediction: 'Circulation and nervous system need attention. Avoid sitting in one position for too long. Ankle and calf muscles may need care. Group fitness activities or yoga classes are beneficial.',
        rating: 3,
        advice: 'Practice activities that improve blood circulation. Stay connected with supportive friends.',
      },
      finance: {
        prediction: 'Good for technology investments and collaborative ventures. Your forward-thinking approach identifies opportunities. Avoid impulsive spending on gadgets. Group investments or crowdfunding projects are favorable.',
        rating: 4,
        advice: 'Invest in future-oriented sectors. Diversify through online platforms and networks.',
      },
      dosAndDonts: {
        dos: [
          'Network and expand your social circle',
          'Work on innovative projects',
          'Support humanitarian causes',
          'Embrace new technology',
        ],
        donts: [
          'Avoid being too detached emotionally',
          'Don\'t rebel just for the sake of it',
          'Stay away from impractical idealism',
          'Don\'t ignore traditional wisdom completely',
        ],
      },
      rating: {
        love: 4,
        career: 5,
        health: 3,
        finance: 4,
        overall: 4,
      },
      specialMessage: 'You are the visionary of the zodiac. Use your gifts to create a better tomorrow.',
    },

    'Pisces': {
      overview: `Jupiter and Neptune bless you with intuition and creativity today. The ${moonPhase} Moon deepens your spiritual connection. This ${dayOfWeek} is magical for artistic and healing activities.`,
      love: {
        prediction: 'Romance is dreamy and spiritual. Your compassionate nature attracts love. Singles may experience a soul connection. Couples should create romantic moments together. Music and art strengthen bonds.',
        rating: 5,
        advice: 'Trust your intuition about relationships. Express love through creative and artistic ways.',
      },
      career: {
        prediction: 'Creative and healing professions flourish. Your empathy and imagination are assets. Good for artistic projects, counseling, and working behind the scenes. Trust your gut feelings in decisions.',
        rating: 4,
        advice: 'Set boundaries to avoid being overwhelmed. Your sensitivity is strength, not weakness.',
      },
      health: {
        prediction: 'Feet and immune system need attention. Stay grounded and avoid escapism. Emotional well-being affects physical health. Water-based activities and spiritual practices are healing.',
        rating: 3,
        advice: 'Practice meditation and mindfulness. Connect with water elements - take a bath or swim.',
      },
      finance: {
        prediction: 'Financial intuition is strong but needs practical application. Good for creative ventures and healing professions. Avoid lending money based on emotions. Charitable giving brings spiritual rewards.',
        rating: 3,
        advice: 'Balance compassion with practicality. Seek professional financial advice.',
      },
      dosAndDonts: {
        dos: [
          'Engage in creative and artistic activities',
          'Practice meditation and spirituality',
          'Help those in need',
          'Trust your intuition',
        ],
        donts: [
          'Avoid escapism through substances',
          'Don\'t absorb others\' negative energy',
          'Stay away from self-pity',
          'Don\'t ignore practical responsibilities',
        ],
      },
      rating: {
        love: 5,
        career: 4,
        health: 3,
        finance: 3,
        overall: 4,
      },
      specialMessage: 'Your compassion is a gift. Remember to show it to yourself too.',
    },
  };

  return signPredictions[sign];
}

/**
 * Main function to generate daily horoscope
 */
export function generateDailyHoroscope(sign: ZodiacSign, date?: Date): DailyHoroscope {
  const today = date || new Date();
  return generatePredictions(sign, today);
}

/**
 * Generate horoscopes for all signs
 */
export function generateAllHoroscopes(date?: Date): Record<ZodiacSign, DailyHoroscope> {
  const signs: ZodiacSign[] = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  const horoscopes: any = {};

  signs.forEach(sign => {
    horoscopes[sign] = generateDailyHoroscope(sign, date);
  });

  return horoscopes;
}

/**
 * Get horoscope summary (for widgets/previews)
 */
export function getHoroscopeSummary(sign: ZodiacSign, date?: Date): {
  sign: ZodiacSign;
  date: string;
  overview: string;
  overallRating: number;
  luckyColor: string;
  luckyNumber: number;
} {
  const horoscope = generateDailyHoroscope(sign, date);

  return {
    sign: horoscope.sign,
    date: horoscope.date,
    overview: horoscope.overview,
    overallRating: horoscope.rating.overall,
    luckyColor: horoscope.luckyElements.colors[0],
    luckyNumber: horoscope.luckyElements.numbers[0],
  };
}
