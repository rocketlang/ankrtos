/**
 * Muhurat Finder Engine
 * Finds auspicious timings for various life events based on Vedic Panchang
 */

export interface MuhuratRequest {
  eventType: EventType;
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  preferences?: {
    preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'any';
    avoidEveningMuhurat?: boolean;
  };
}

export type EventType =
  | 'marriage'
  | 'engagement'
  | 'business-launch'
  | 'house-warming'
  | 'vehicle-purchase'
  | 'surgery'
  | 'travel'
  | 'naming-ceremony'
  | 'education-start'
  | 'property-purchase';

export interface MuhuratResult {
  event: EventType;
  auspiciousMuhurats: Muhurat[];
  inauspiciousPeriods: InauspiciousPeriod[];
  recommendations: string[];
  bestMuhurat: Muhurat;
}

export interface Muhurat {
  date: Date;
  startTime: Date;
  endTime: Date;
  score: number; // 1-100
  quality: 'Excellent' | 'Very Good' | 'Good' | 'Average' | 'Below Average';
  panchang: Panchang;
  nakshatra: string;
  tithi: string;
  yoga: string;
  karana: string;
  reasons: string[];
  warnings?: string[];
  planetaryPositions: {
    sun: string;
    moon: string;
    mars: string;
    mercury: string;
    jupiter: string;
    venus: string;
    saturn: string;
  };
}

export interface Panchang {
  tithi: {
    name: string;
    number: number;
    paksha: 'Shukla' | 'Krishna'; // Waxing or Waning
    suitable: boolean;
  };
  nakshatra: {
    name: string;
    lord: string;
    pada: number;
    suitable: boolean;
  };
  yoga: {
    name: string;
    suitable: boolean;
  };
  karana: {
    name: string;
    suitable: boolean;
  };
  weekday: {
    name: string;
    lord: string;
    suitable: boolean;
  };
}

export interface InauspiciousPeriod {
  type: 'Rahu Kaal' | 'Gulika Kaal' | 'Yamaghanta' | 'Dur Muhurat' | 'Varjyam';
  startTime: Date;
  endTime: Date;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
}

// Nakshatra names and their lords
const NAKSHATRAS = [
  { name: 'Ashwini', lord: 'Ketu', suitable: ['marriage', 'travel', 'vehicle-purchase'] },
  { name: 'Bharani', lord: 'Venus', suitable: ['business-launch', 'property-purchase'] },
  { name: 'Krittika', lord: 'Sun', suitable: ['naming-ceremony', 'education-start'] },
  { name: 'Rohini', lord: 'Moon', suitable: ['marriage', 'house-warming', 'business-launch'] },
  { name: 'Mrigashira', lord: 'Mars', suitable: ['travel', 'vehicle-purchase'] },
  { name: 'Ardra', lord: 'Rahu', suitable: [] }, // Generally avoided
  { name: 'Punarvasu', lord: 'Jupiter', suitable: ['marriage', 'house-warming', 'business-launch'] },
  { name: 'Pushya', lord: 'Saturn', suitable: ['marriage', 'house-warming', 'education-start', 'business-launch'] },
  { name: 'Ashlesha', lord: 'Mercury', suitable: [] }, // Generally avoided
  { name: 'Magha', lord: 'Ketu', suitable: ['naming-ceremony', 'property-purchase'] },
  { name: 'Purva Phalguni', lord: 'Venus', suitable: ['marriage', 'engagement'] },
  { name: 'Uttara Phalguni', lord: 'Sun', suitable: ['marriage', 'business-launch'] },
  { name: 'Hasta', lord: 'Moon', suitable: ['marriage', 'vehicle-purchase', 'travel'] },
  { name: 'Chitra', lord: 'Mars', suitable: ['house-warming', 'property-purchase'] },
  { name: 'Swati', lord: 'Rahu', suitable: ['business-launch', 'education-start'] },
  { name: 'Vishakha', lord: 'Jupiter', suitable: ['marriage', 'engagement'] },
  { name: 'Anuradha', lord: 'Saturn', suitable: ['marriage', 'travel'] },
  { name: 'Jyeshtha', lord: 'Mercury', suitable: [] }, // Generally avoided
  { name: 'Mula', lord: 'Ketu', suitable: [] }, // Generally avoided
  { name: 'Purva Ashadha', lord: 'Venus', suitable: ['marriage', 'business-launch'] },
  { name: 'Uttara Ashadha', lord: 'Sun', suitable: ['marriage', 'house-warming'] },
  { name: 'Shravana', lord: 'Moon', suitable: ['marriage', 'education-start', 'naming-ceremony'] },
  { name: 'Dhanishta', lord: 'Mars', suitable: ['business-launch', 'property-purchase'] },
  { name: 'Shatabhisha', lord: 'Rahu', suitable: [] }, // Generally avoided
  { name: 'Purva Bhadrapada', lord: 'Jupiter', suitable: ['marriage', 'naming-ceremony'] },
  { name: 'Uttara Bhadrapada', lord: 'Saturn', suitable: ['marriage', 'house-warming'] },
  { name: 'Revati', lord: 'Mercury', suitable: ['marriage', 'travel', 'business-launch'] },
];

// Tithis and their suitability
const TITHIS = [
  { number: 1, name: 'Pratipada', suitable: ['business-launch', 'education-start'] },
  { number: 2, name: 'Dwitiya', suitable: ['marriage', 'house-warming'] },
  { number: 3, name: 'Tritiya', suitable: ['marriage', 'naming-ceremony'] },
  { number: 4, name: 'Chaturthi', suitable: [] }, // Generally avoided
  { number: 5, name: 'Panchami', suitable: ['marriage', 'education-start'] },
  { number: 6, name: 'Shashthi', suitable: [] }, // Avoided for auspicious events
  { number: 7, name: 'Saptami', suitable: ['marriage', 'travel'] },
  { number: 8, name: 'Ashtami', suitable: [] }, // Generally avoided
  { number: 9, name: 'Navami', suitable: [] }, // Avoided for marriage
  { number: 10, name: 'Dashami', suitable: ['marriage', 'business-launch'] },
  { number: 11, name: 'Ekadashi', suitable: ['education-start', 'naming-ceremony'] },
  { number: 12, name: 'Dwadashi', suitable: ['marriage', 'house-warming'] },
  { number: 13, name: 'Trayodashi', suitable: ['marriage', 'business-launch'] },
  { number: 14, name: 'Chaturdashi', suitable: [] }, // Generally avoided
  { number: 15, name: 'Purnima', suitable: ['marriage', 'house-warming'] }, // Full Moon
  { number: 30, name: 'Amavasya', suitable: [] }, // New Moon - avoided
];

// Yogas and their nature
const YOGAS = [
  { name: 'Vishkambha', suitable: false },
  { name: 'Priti', suitable: true },
  { name: 'Ayushman', suitable: true },
  { name: 'Saubhagya', suitable: true },
  { name: 'Shobhana', suitable: true },
  { name: 'Atiganda', suitable: false },
  { name: 'Sukarma', suitable: true },
  { name: 'Dhriti', suitable: true },
  { name: 'Shula', suitable: false },
  { name: 'Ganda', suitable: false },
  { name: 'Vriddhi', suitable: true },
  { name: 'Dhruva', suitable: true },
  { name: 'Vyaghata', suitable: false },
  { name: 'Harshana', suitable: true },
  { name: 'Vajra', suitable: false },
  { name: 'Siddhi', suitable: true },
  { name: 'Vyatipata', suitable: false },
  { name: 'Variyan', suitable: true },
  { name: 'Parigha', suitable: false },
  { name: 'Shiva', suitable: true },
  { name: 'Siddha', suitable: true },
  { name: 'Sadhya', suitable: true },
  { name: 'Shubha', suitable: true },
  { name: 'Shukla', suitable: true },
  { name: 'Brahma', suitable: true },
  { name: 'Indra', suitable: true },
  { name: 'Vaidhriti', suitable: false },
];

// Weekday suitability for events
const WEEKDAY_SUITABILITY: Record<string, { lord: string; suitable: EventType[] }> = {
  'Sunday': { lord: 'Sun', suitable: ['naming-ceremony', 'property-purchase', 'business-launch'] },
  'Monday': { lord: 'Moon', suitable: ['marriage', 'house-warming', 'travel'] },
  'Tuesday': { lord: 'Mars', suitable: ['vehicle-purchase', 'surgery', 'property-purchase'] },
  'Wednesday': { lord: 'Mercury', suitable: ['education-start', 'business-launch', 'travel'] },
  'Thursday': { lord: 'Jupiter', suitable: ['marriage', 'engagement', 'house-warming', 'education-start'] },
  'Friday': { lord: 'Venus', suitable: ['marriage', 'engagement', 'vehicle-purchase', 'business-launch'] },
  'Saturday': { lord: 'Saturn', suitable: ['house-warming', 'property-purchase'] },
};

/**
 * Calculate Rahu Kaal for a given date and location
 */
function calculateRahuKaal(date: Date, location: { latitude: number; longitude: number }): InauspiciousPeriod {
  const dayOfWeek = date.getDay();
  const sunrise = 6; // Simplified - should use actual sunrise time
  const sunset = 18; // Simplified - should use actual sunset time
  const dayDuration = sunset - sunrise;
  const rahuKaalDuration = dayDuration / 8;

  // Rahu Kaal timing varies by day
  const rahuKaalStartHour: Record<number, number> = {
    0: 16.5, // Sunday: 4:30 PM - 6:00 PM
    1: 7.5,  // Monday: 7:30 AM - 9:00 AM
    2: 15,   // Tuesday: 3:00 PM - 4:30 PM
    3: 12,   // Wednesday: 12:00 PM - 1:30 PM
    4: 13.5, // Thursday: 1:30 PM - 3:00 PM
    5: 10.5, // Friday: 10:30 AM - 12:00 PM
    6: 9,    // Saturday: 9:00 AM - 10:30 AM
  };

  const startHour = rahuKaalStartHour[dayOfWeek];
  const startTime = new Date(date);
  startTime.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);

  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 1, 30, 0, 0);

  return {
    type: 'Rahu Kaal',
    startTime,
    endTime,
    severity: 'High',
    description: 'Inauspicious period ruled by Rahu. Avoid starting new ventures, marriage, or important ceremonies.',
  };
}

/**
 * Calculate Gulika Kaal for a given date
 */
function calculateGulikaKaal(date: Date): InauspiciousPeriod {
  const dayOfWeek = date.getDay();

  const gulikaStartHour: Record<number, number> = {
    0: 15,   // Sunday: 3:00 PM - 4:30 PM
    1: 12,   // Monday: 12:00 PM - 1:30 PM
    2: 9,    // Tuesday: 9:00 AM - 10:30 AM
    3: 7.5,  // Wednesday: 7:30 AM - 9:00 AM
    4: 6,    // Thursday: 6:00 AM - 7:30 AM
    5: 13.5, // Friday: 1:30 PM - 3:00 PM
    6: 10.5, // Saturday: 10:30 AM - 12:00 PM
  };

  const startHour = gulikaStartHour[dayOfWeek];
  const startTime = new Date(date);
  startTime.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);

  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 1, 30, 0, 0);

  return {
    type: 'Gulika Kaal',
    startTime,
    endTime,
    severity: 'Medium',
    description: 'Period of Saturn\'s son Gulika. Avoid auspicious activities and new beginnings.',
  };
}

/**
 * Calculate Yamaghanta for a given date
 */
function calculateYamaghanta(date: Date): InauspiciousPeriod {
  const dayOfWeek = date.getDay();

  const yamaghantaStartHour: Record<number, number> = {
    0: 12,   // Sunday: 12:00 PM - 1:30 PM
    1: 10.5, // Monday: 10:30 AM - 12:00 PM
    2: 9,    // Tuesday: 9:00 AM - 10:30 AM
    3: 7.5,  // Wednesday: 7:30 AM - 9:00 AM
    4: 6,    // Thursday: 6:00 AM - 7:30 AM
    5: 15,   // Friday: 3:00 PM - 4:30 PM
    6: 13.5, // Saturday: 1:30 PM - 3:00 PM
  };

  const startHour = yamaghantaStartHour[dayOfWeek];
  const startTime = new Date(date);
  startTime.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);

  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 1, 30, 0, 0);

  return {
    type: 'Yamaghanta',
    startTime,
    endTime,
    severity: 'High',
    description: 'Period of Yama (God of Death). Highly inauspicious for any new activity or auspicious event.',
  };
}

/**
 * Get Panchang for a specific date and time
 */
function getPanchang(date: Date, eventType: EventType): Panchang {
  // Simplified calculation - in production, use Swiss Ephemeris or similar
  const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));

  // Calculate Tithi (lunar day)
  const tithiIndex = (daysSinceEpoch % 30);
  const tithiData = TITHIS[tithiIndex % TITHIS.length];
  const paksha = tithiIndex < 15 ? 'Shukla' : 'Krishna';
  const tithiSuitable = tithiData.suitable.includes(eventType);

  // Calculate Nakshatra
  const nakshatraIndex = daysSinceEpoch % 27;
  const nakshatraData = NAKSHATRAS[nakshatraIndex];
  const nakshatraSuitable = nakshatraData.suitable.includes(eventType);

  // Calculate Yoga
  const yogaIndex = daysSinceEpoch % 27;
  const yogaData = YOGAS[yogaIndex];

  // Karana (half of tithi)
  const karanaNames = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti'];
  const karanaIndex = (daysSinceEpoch * 2) % 7;
  const karanaName = karanaNames[karanaIndex];
  const karanaSuitable = karanaName !== 'Vishti'; // Vishti is considered inauspicious

  // Weekday
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekday = weekdayNames[date.getDay()];
  const weekdayData = WEEKDAY_SUITABILITY[weekday];
  const weekdaySuitable = weekdayData.suitable.includes(eventType);

  return {
    tithi: {
      name: tithiData.name,
      number: tithiData.number,
      paksha,
      suitable: tithiSuitable,
    },
    nakshatra: {
      name: nakshatraData.name,
      lord: nakshatraData.lord,
      pada: (daysSinceEpoch % 4) + 1,
      suitable: nakshatraSuitable,
    },
    yoga: {
      name: yogaData.name,
      suitable: yogaData.suitable,
    },
    karana: {
      name: karanaName,
      suitable: karanaSuitable,
    },
    weekday: {
      name: weekday,
      lord: weekdayData.lord,
      suitable: weekdaySuitable,
    },
  };
}

/**
 * Calculate muhurat score based on Panchang
 */
function calculateMuhuratScore(panchang: Panchang, eventType: EventType): {
  score: number;
  quality: 'Excellent' | 'Very Good' | 'Good' | 'Average' | 'Below Average';
  reasons: string[];
  warnings: string[];
} {
  let score = 50; // Base score
  const reasons: string[] = [];
  const warnings: string[] = [];

  // Tithi score (25 points)
  if (panchang.tithi.suitable) {
    score += 25;
    reasons.push(`${panchang.tithi.name} Tithi is auspicious for this event`);
  } else {
    score -= 10;
    warnings.push(`${panchang.tithi.name} Tithi is not ideal for this event`);
  }

  // Nakshatra score (30 points)
  if (panchang.nakshatra.suitable) {
    score += 30;
    reasons.push(`${panchang.nakshatra.name} Nakshatra favors this event`);
  } else {
    score -= 15;
    warnings.push(`${panchang.nakshatra.name} Nakshatra is not recommended`);
  }

  // Yoga score (20 points)
  if (panchang.yoga.suitable) {
    score += 20;
    reasons.push(`${panchang.yoga.name} Yoga is favorable`);
  } else {
    score -= 10;
    warnings.push(`${panchang.yoga.name} Yoga is inauspicious`);
  }

  // Karana score (10 points)
  if (panchang.karana.suitable) {
    score += 10;
    reasons.push(`${panchang.karana.name} Karana is suitable`);
  } else {
    warnings.push(`${panchang.karana.name} Karana should be avoided`);
  }

  // Weekday score (15 points)
  if (panchang.weekday.suitable) {
    score += 15;
    reasons.push(`${panchang.weekday.name} is favorable for this event`);
  } else {
    score -= 5;
  }

  // Ensure score is within 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine quality
  let quality: 'Excellent' | 'Very Good' | 'Good' | 'Average' | 'Below Average';
  if (score >= 85) quality = 'Excellent';
  else if (score >= 70) quality = 'Very Good';
  else if (score >= 55) quality = 'Good';
  else if (score >= 40) quality = 'Average';
  else quality = 'Below Average';

  return { score, quality, reasons, warnings };
}

/**
 * Find auspicious muhurats for an event
 */
export function findMuhurats(request: MuhuratRequest): MuhuratResult {
  const auspiciousMuhurats: Muhurat[] = [];
  const inauspiciousPeriods: InauspiciousPeriod[] = [];

  const currentDate = new Date(request.dateRange.startDate);
  const endDate = new Date(request.dateRange.endDate);

  // Iterate through each day in the range
  while (currentDate <= endDate) {
    // Calculate inauspicious periods for the day
    const rahuKaal = calculateRahuKaal(currentDate, request.location);
    const gulikaKaal = calculateGulikaKaal(currentDate);
    const yamaghanta = calculateYamaghanta(currentDate);

    inauspiciousPeriods.push(rahuKaal, gulikaKaal, yamaghanta);

    // Find auspicious time slots (avoiding inauspicious periods)
    const timeSlots = [
      { start: 6, end: 9, label: 'Early Morning' },
      { start: 9, end: 12, label: 'Late Morning' },
      { start: 12, end: 15, label: 'Afternoon' },
      { start: 15, end: 18, label: 'Evening' },
    ];

    for (const slot of timeSlots) {
      // Skip evening if preference says so
      if (request.preferences?.avoidEveningMuhurat && slot.start >= 15) continue;

      // Check time of day preference
      if (request.preferences?.preferredTimeOfDay) {
        const pref = request.preferences.preferredTimeOfDay;
        if (pref === 'morning' && slot.start >= 12) continue;
        if (pref === 'afternoon' && (slot.start < 12 || slot.start >= 15)) continue;
        if (pref === 'evening' && slot.start < 15) continue;
      }

      const startTime = new Date(currentDate);
      startTime.setHours(slot.start, 0, 0, 0);

      const endTime = new Date(currentDate);
      endTime.setHours(slot.end, 0, 0, 0);

      // Check if this time overlaps with inauspicious periods
      const overlapsInauspicious = [rahuKaal, gulikaKaal, yamaghanta].some(
        period => startTime < period.endTime && endTime > period.startTime
      );

      if (!overlapsInauspicious) {
        // Get Panchang for this time
        const panchang = getPanchang(startTime, request.eventType);

        // Calculate score
        const { score, quality, reasons, warnings } = calculateMuhuratScore(panchang, request.eventType);

        // Only include if score is decent
        if (score >= 40) {
          auspiciousMuhurats.push({
            date: new Date(currentDate),
            startTime,
            endTime,
            score,
            quality,
            panchang,
            nakshatra: panchang.nakshatra.name,
            tithi: panchang.tithi.name,
            yoga: panchang.yoga.name,
            karana: panchang.karana.name,
            reasons,
            warnings: warnings.length > 0 ? warnings : undefined,
            planetaryPositions: {
              sun: 'Strong',
              moon: panchang.nakshatra.lord === 'Moon' ? 'Favorable' : 'Moderate',
              mars: 'Moderate',
              mercury: 'Favorable',
              jupiter: panchang.weekday.lord === 'Jupiter' ? 'Strong' : 'Moderate',
              venus: 'Favorable',
              saturn: 'Moderate',
            },
          });
        }
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Sort by score
  auspiciousMuhurats.sort((a, b) => b.score - a.score);

  // Get best muhurat
  const bestMuhurat = auspiciousMuhurats[0];

  // Generate recommendations
  const recommendations = generateRecommendations(request.eventType, bestMuhurat);

  return {
    event: request.eventType,
    auspiciousMuhurats: auspiciousMuhurats.slice(0, 10), // Return top 10
    inauspiciousPeriods: inauspiciousPeriods.slice(0, 30), // Limit to 30 days
    recommendations,
    bestMuhurat,
  };
}

/**
 * Generate event-specific recommendations
 */
function generateRecommendations(eventType: EventType, muhurat: Muhurat): string[] {
  const recommendations: string[] = [];

  switch (eventType) {
    case 'marriage':
      recommendations.push(
        'Perform Ganesh Puja before the ceremony for removal of obstacles',
        'Ensure both bride and groom wear auspicious colors (red, orange, yellow)',
        'Exchange vows during the chosen muhurat for a blessed union',
        'Have a priest chant Vedic mantras during the ceremony',
        'Offer prayers to family deities and seek elders\' blessings'
      );
      break;

    case 'business-launch':
      recommendations.push(
        'Perform Lakshmi-Ganesh Puja on the day of launch',
        'Light a lamp (diya) at the business premises during muhurat time',
        'Keep the entrance well-lit and decorated with rangoli',
        'Place a Swastik symbol at the entrance for prosperity',
        'Distribute sweets to customers and employees'
      );
      break;

    case 'house-warming':
      recommendations.push(
        'Perform Griha Pravesh Puja with Vastu Shanti',
        'Boil milk in the new kitchen as the first activity',
        'Light incense and lamps in all rooms',
        'Place a Kalash (sacred pot) at the entrance',
        'Feed Brahmins and the poor for blessings'
      );
      break;

    case 'vehicle-purchase':
      recommendations.push(
        'Perform vehicle Puja with coconut breaking',
        'Apply kumkum (vermillion) and turmeric to the vehicle',
        'Hang a small lemon-chili string for protection',
        'Take your first drive in the chosen muhurat',
        'Donate to charitable causes for safe travels'
      );
      break;

    case 'surgery':
      recommendations.push(
        'Chant Mahamrityunjaya Mantra 108 times before surgery',
        'Wear Rudraksha for divine protection',
        'Keep sacred ash (vibhuti) with you',
        'Have family members perform Hanuman Chalisa reading',
        'Make offerings at a Shiva temple before the procedure'
      );
      break;

    case 'travel':
      recommendations.push(
        'Pray to your family deity before departure',
        'Start your journey during the auspicious muhurat',
        'Carry a small Hanuman idol or image for protection',
        'Avoid traveling during Rahu Kaal on the day of departure',
        'Donate food to travelers for a safe journey'
      );
      break;

    default:
      recommendations.push(
        'Perform prayers to Lord Ganesha before starting',
        'Maintain positive thoughts and cleanliness',
        'Seek blessings from elders',
        'Avoid negative discussions or arguments',
        'Wear clean, traditional clothes during the muhurat'
      );
  }

  // Add common recommendations
  recommendations.push(
    `Start the activity precisely at ${muhurat.startTime.toLocaleTimeString()} for maximum benefit`,
    'Keep the environment clean and positive',
    'Light a lamp and incense for divine blessings'
  );

  return recommendations;
}

/**
 * Get event-specific description
 */
export function getEventDescription(eventType: EventType): string {
  const descriptions: Record<EventType, string> = {
    'marriage': 'Find the most auspicious date and time for your wedding ceremony. Vedic astrology considers Tithi, Nakshatra, and planetary positions for a blessed union.',
    'engagement': 'Choose the perfect muhurat for your engagement ceremony. An auspicious time ensures a harmonious relationship and bright future together.',
    'business-launch': 'Launch your business at the right time for prosperity and success. The muhurat influences growth, profits, and long-term stability.',
    'house-warming': 'Griha Pravesh muhurat for entering your new home. The right time brings happiness, health, and prosperity to all residents.',
    'vehicle-purchase': 'Find the best time to buy your new vehicle. An auspicious muhurat ensures safety and longevity of the vehicle.',
    'surgery': 'Choose a favorable time for medical procedures. The right muhurat aids in quick recovery and successful outcomes.',
    'travel': 'Find safe and auspicious times for journey commencement. Ensures protection during travel and successful completion of purpose.',
    'naming-ceremony': 'Namkaran muhurat for your baby. The time of naming influences the child\'s personality and future.',
    'education-start': 'Vidyarambh muhurat for beginning education. An auspicious start ensures focus, intelligence, and academic success.',
    'property-purchase': 'Find the best time to purchase property or land. The muhurat affects long-term value and prosperity.',
  };

  return descriptions[eventType];
}
