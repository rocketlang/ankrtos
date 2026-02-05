/**
 * Vedic Astrology Calculation Engine
 * Uses Swiss Ephemeris for accurate planetary calculations
 */

import swisseph from 'swisseph';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

// Initialize Swiss Ephemeris
swisseph.swe_set_ephe_path(process.env.EPHEMERIS_PATH || '/usr/share/swisseph');

// ==================== CONSTANTS ====================

export const AYANAMSA = {
  LAHIRI: swisseph.SE_SIDM_LAHIRI,
  RAMAN: swisseph.SE_SIDM_RAMAN,
  KP: swisseph.SE_SIDM_KRISHNAMURTI,
  FAGAN_BRADLEY: swisseph.SE_SIDM_FAGAN_BRADLEY,
};

export const PLANETS = {
  SUN: swisseph.SE_SUN,
  MOON: swisseph.SE_MOON,
  MERCURY: swisseph.SE_MERCURY,
  VENUS: swisseph.SE_VENUS,
  MARS: swisseph.SE_MARS,
  JUPITER: swisseph.SE_JUPITER,
  SATURN: swisseph.SE_SATURN,
  RAHU: swisseph.SE_MEAN_NODE,
  KETU: swisseph.SE_MEAN_NODE, // Ketu is 180° from Rahu
  URANUS: swisseph.SE_URANUS,
  NEPTUNE: swisseph.SE_NEPTUNE,
  PLUTO: swisseph.SE_PLUTO,
};

export const ZODIAC_SIGNS = [
  'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
  'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'
];

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun',
  'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury'
];

// ==================== CORE FUNCTIONS ====================

/**
 * Convert date/time to Julian Day
 */
export function getJulianDay(date: Date, timezone: string = 'UTC'): number {
  const zonedTime = utcToZonedTime(date, timezone);
  const year = zonedTime.getFullYear();
  const month = zonedTime.getMonth() + 1;
  const day = zonedTime.getDate();
  const hour = zonedTime.getHours() + zonedTime.getMinutes() / 60 + zonedTime.getSeconds() / 3600;

  return swisseph.swe_julday(year, month, day, hour, swisseph.SE_GREG_CAL);
}

/**
 * Get planet position in tropical zodiac
 */
export function getPlanetPosition(julianDay: number, planet: number) {
  const result = swisseph.swe_calc_ut(julianDay, planet, swisseph.SEFLG_SPEED);

  return {
    longitude: result.longitude,
    latitude: result.latitude,
    speed: result.longitudeSpeed,
    isRetrograde: result.longitudeSpeed < 0
  };
}

/**
 * Convert tropical to sidereal longitude
 */
export function toSidereal(tropicalLong: number, julianDay: number, ayanamsa: number = AYANAMSA.LAHIRI): number {
  swisseph.swe_set_sid_mode(ayanamsa, 0, 0);
  const ayanamsaValue = swisseph.swe_get_ayanamsa_ut(julianDay);
  let sidereal = tropicalLong - ayanamsaValue;

  if (sidereal < 0) sidereal += 360;
  if (sidereal >= 360) sidereal -= 360;

  return sidereal;
}

/**
 * Get zodiac sign from longitude
 */
export function getZodiacSign(longitude: number): string {
  const signIndex = Math.floor(longitude / 30);
  return ZODIAC_SIGNS[signIndex];
}

/**
 * Get degree within sign
 */
export function getDegreeInSign(longitude: number): number {
  return longitude % 30;
}

/**
 * Get Nakshatra from longitude
 */
export function getNakshatra(longitude: number) {
  const nakshatraIndex = Math.floor(longitude / (360 / 27));
  const nakshatraName = NAKSHATRAS[nakshatraIndex];
  const nakshatraLord = NAKSHATRA_LORDS[nakshatraIndex];
  const degreeInNakshatra = longitude % (360 / 27);
  const pada = Math.floor(degreeInNakshatra / ((360 / 27) / 4)) + 1;

  return {
    name: nakshatraName,
    lord: nakshatraLord,
    pada: pada,
    index: nakshatraIndex
  };
}

/**
 * Calculate Ascendant (Lagna)
 */
export function getAscendant(julianDay: number, lat: number, lng: number, ayanamsa: number = AYANAMSA.LAHIRI) {
  const houses = swisseph.swe_houses(julianDay, lat, lng, 'P'); // Placidus house system
  const tropicalAsc = houses.ascendant;
  const siderealAsc = toSidereal(tropicalAsc, julianDay, ayanamsa);

  return {
    longitude: siderealAsc,
    sign: getZodiacSign(siderealAsc),
    degree: getDegreeInSign(siderealAsc)
  };
}

/**
 * Calculate all house cusps
 */
export function getHouses(julianDay: number, lat: number, lng: number, ayanamsa: number = AYANAMSA.LAHIRI) {
  const houses = swisseph.swe_houses(julianDay, lat, lng, 'P');
  const houseCusps = [];

  for (let i = 1; i <= 12; i++) {
    const tropicalCusp = houses.house[i];
    const siderealCusp = toSidereal(tropicalCusp, julianDay, ayanamsa);

    houseCusps.push({
      house: i,
      longitude: siderealCusp,
      sign: getZodiacSign(siderealCusp),
      degree: getDegreeInSign(siderealCusp)
    });
  }

  return houseCusps;
}

/**
 * Get planet in which house
 */
export function getPlanetHouse(planetLongitude: number, houseCusps: any[]): number {
  for (let i = 0; i < houseCusps.length; i++) {
    const currentHouse = houseCusps[i].longitude;
    const nextHouse = houseCusps[(i + 1) % 12].longitude;

    if (nextHouse > currentHouse) {
      if (planetLongitude >= currentHouse && planetLongitude < nextHouse) {
        return i + 1;
      }
    } else {
      // Handle wraparound at 360°
      if (planetLongitude >= currentHouse || planetLongitude < nextHouse) {
        return i + 1;
      }
    }
  }
  return 1;
}

/**
 * Calculate house lord
 */
export function getHouseLord(houseSign: string): string {
  const lordship: { [key: string]: string } = {
    ARIES: 'Mars', TAURUS: 'Venus', GEMINI: 'Mercury',
    CANCER: 'Moon', LEO: 'Sun', VIRGO: 'Mercury',
    LIBRA: 'Venus', SCORPIO: 'Mars', SAGITTARIUS: 'Jupiter',
    CAPRICORN: 'Saturn', AQUARIUS: 'Saturn', PISCES: 'Jupiter'
  };
  return lordship[houseSign];
}

// ==================== DOSHA CALCULATIONS ====================

/**
 * Check Mangal Dosha (Mars affliction for marriage)
 */
export function checkMangalDosha(planets: any, houseCusps: any): boolean {
  const mars = planets.MARS;
  const marsHouse = getPlanetHouse(mars.longitude, houseCusps);

  // Mangal Dosha if Mars is in 1st, 4th, 7th, 8th, or 12th house
  const doshaHouses = [1, 4, 7, 8, 12];
  return doshaHouses.includes(marsHouse);
}

/**
 * Check Kal Sarpa Dosha (all planets between Rahu-Ketu axis)
 */
export function checkKalSarpaDosha(planets: any): boolean {
  const rahu = planets.RAHU.longitude;
  let ketu = rahu + 180;
  if (ketu >= 360) ketu -= 360;

  let allBetween = true;

  for (const [name, planet] of Object.entries(planets)) {
    if (name === 'RAHU' || name === 'KETU') continue;

    const p = planet as any;
    const long = p.longitude;

    // Check if planet is between Rahu and Ketu
    const isBetween = (rahu < ketu)
      ? (long > rahu && long < ketu)
      : (long > rahu || long < ketu);

    if (!isBetween) {
      allBetween = false;
      break;
    }
  }

  return allBetween;
}

// ==================== YOGA CALCULATIONS ====================

/**
 * Detect Raj Yogas (combinations for success/power)
 */
export function detectRajYogas(planets: any, houseCusps: any, houseLords: any): any[] {
  const yogas = [];

  // Check for Dharma Karma Adhipati Yoga (9th and 10th lord connection)
  const lord9 = houseLords[9];
  const lord10 = houseLords[10];

  // Gajakesari Yoga (Jupiter and Moon in kendras)
  const moon = planets.MOON;
  const jupiter = planets.JUPITER;
  const moonHouse = getPlanetHouse(moon.longitude, houseCusps);
  const jupiterHouse = getPlanetHouse(jupiter.longitude, houseCusps);

  const kendras = [1, 4, 7, 10];
  if (kendras.includes(moonHouse) && kendras.includes(jupiterHouse)) {
    yogas.push({
      name: 'Gajakesari Yoga',
      description: 'Moon and Jupiter in angular houses - brings wisdom, fame, and prosperity',
      strength: 'Strong'
    });
  }

  return yogas;
}

// ==================== DIVISIONAL CHARTS ====================

/**
 * Calculate Navamsa (D9) - Marriage chart
 */
export function calculateNavamsa(longitude: number): number {
  const navamsaLength = 360 / 108; // Each navamsa is 3°20'
  const navamsaNumber = Math.floor(longitude / navamsaLength);
  const sign = Math.floor(longitude / 30);

  // Movable, Fixed, Dual signs have different navamsa calculations
  const signType = sign % 3; // 0=Movable, 1=Fixed, 2=Dual

  let navamsaSign;
  switch (signType) {
    case 0: // Movable (Aries, Cancer, Libra, Capricorn)
      navamsaSign = (navamsaNumber % 12);
      break;
    case 1: // Fixed (Taurus, Leo, Scorpio, Aquarius)
      navamsaSign = ((navamsaNumber % 12) + 8) % 12;
      break;
    case 2: // Dual (Gemini, Virgo, Sagittarius, Pisces)
      navamsaSign = ((navamsaNumber % 12) + 4) % 12;
      break;
    default:
      navamsaSign = 0;
  }

  return navamsaSign * 30 + (longitude % navamsaLength) * 9;
}

/**
 * Calculate Dasamsa (D10) - Career chart
 */
export function calculateDasamsa(longitude: number): number {
  const dasamsaLength = 360 / 120; // Each dasamsa is 3°
  const dasamsaNumber = Math.floor(longitude / dasamsaLength) % 10;
  const sign = Math.floor(longitude / 30);

  const dasamsaSign = (sign % 2 === 0)
    ? (sign + dasamsaNumber) % 12
    : (sign + dasamsaNumber + 8) % 12;

  return dasamsaSign * 30;
}

// ==================== DASHA SYSTEM ====================

/**
 * Calculate Vimshottari Dasha periods
 */
export function calculateVimshottariDasha(moonLongitude: number, birthDate: Date) {
  const dashaPeriods = [
    { planet: 'Ketu', years: 7 },
    { planet: 'Venus', years: 20 },
    { planet: 'Sun', years: 6 },
    { planet: 'Moon', years: 10 },
    { planet: 'Mars', years: 7 },
    { planet: 'Rahu', years: 18 },
    { planet: 'Jupiter', years: 16 },
    { planet: 'Saturn', years: 19 },
    { planet: 'Mercury', years: 17 }
  ];

  const nakshatra = getNakshatra(moonLongitude);
  const startDashaIndex = Math.floor(nakshatra.index / 3);

  const nakshatraDegree = moonLongitude % (360 / 27);
  const totalNakshatraDegree = 360 / 27;
  const proportionPassed = nakshatraDegree / totalNakshatraDegree;

  const dashas = [];
  let currentDate = new Date(birthDate);

  for (let i = 0; i < dashaPeriods.length; i++) {
    const index = (startDashaIndex + i) % dashaPeriods.length;
    const dasha = dashaPeriods[index];

    if (i === 0) {
      // First dasha is partially completed at birth
      const remainingYears = dasha.years * (1 - proportionPassed);
      dashas.push({
        planet: dasha.planet,
        startDate: new Date(currentDate),
        endDate: new Date(currentDate.setFullYear(currentDate.getFullYear() + remainingYears))
      });
    } else {
      dashas.push({
        planet: dasha.planet,
        startDate: new Date(currentDate),
        endDate: new Date(currentDate.setFullYear(currentDate.getFullYear() + dasha.years))
      });
    }
  }

  return dashas;
}

// ==================== MAIN KUNDLI GENERATION ====================

export interface KundliInput {
  birthDate: Date;
  birthTime: string; // HH:mm:ss
  birthPlace: string;
  birthLat: number;
  birthLng: number;
  timezone?: string;
  ayanamsa?: string;
}

export async function generateKundli(input: KundliInput) {
  const { birthDate, birthTime, birthLat, birthLng, timezone = 'UTC', ayanamsa = 'LAHIRI' } = input;

  // Combine date and time
  const [hours, minutes, seconds = 0] = birthTime.split(':').map(Number);
  const fullBirthDate = new Date(birthDate);
  fullBirthDate.setHours(hours, minutes, seconds);

  // Get Julian Day
  const julianDay = getJulianDay(fullBirthDate, timezone);

  // Set ayanamsa
  const ayanamsaValue = AYANAMSA[ayanamsa as keyof typeof AYANAMSA] || AYANAMSA.LAHIRI;

  // Calculate Ascendant
  const ascendant = getAscendant(julianDay, birthLat, birthLng, ayanamsaValue);

  // Calculate House Cusps
  const houseCusps = getHouses(julianDay, birthLat, birthLng, ayanamsaValue);

  // Calculate all planets
  const planets: any = {};

  for (const [name, planetId] of Object.entries(PLANETS)) {
    if (name === 'KETU') {
      // Ketu is 180° from Rahu
      const rahu = planets.RAHU;
      let ketuLong = rahu.longitude + 180;
      if (ketuLong >= 360) ketuLong -= 360;

      planets.KETU = {
        longitude: ketuLong,
        sign: getZodiacSign(ketuLong),
        degree: getDegreeInSign(ketuLong),
        nakshatra: getNakshatra(ketuLong),
        house: getPlanetHouse(ketuLong, houseCusps),
        isRetrograde: true // Rahu-Ketu always retrograde
      };
    } else {
      const position = getPlanetPosition(julianDay, planetId);
      const siderealLong = toSidereal(position.longitude, julianDay, ayanamsaValue);

      planets[name] = {
        longitude: siderealLong,
        sign: getZodiacSign(siderealLong),
        degree: getDegreeInSign(siderealLong),
        nakshatra: getNakshatra(siderealLong),
        house: getPlanetHouse(siderealLong, houseCusps),
        isRetrograde: position.isRetrograde
      };
    }
  }

  // Calculate House Lords
  const houseLords: any = {};
  for (let i = 0; i < 12; i++) {
    houseLords[i + 1] = getHouseLord(houseCusps[i].sign);
  }

  // Calculate Divisional Charts
  const navamsaChart: any = {};
  const dasamsaChart: any = {};

  for (const [name, planet] of Object.entries(planets)) {
    const p = planet as any;
    navamsaChart[name] = {
      longitude: calculateNavamsa(p.longitude),
      sign: getZodiacSign(calculateNavamsa(p.longitude))
    };
    dasamsaChart[name] = {
      longitude: calculateDasamsa(p.longitude),
      sign: getZodiacSign(calculateDasamsa(p.longitude))
    };
  }

  // Check Doshas
  const mangalDosha = checkMangalDosha(planets, houseCusps);
  const kalSarpaDosha = checkKalSarpaDosha(planets);

  // Detect Yogas
  const yogas = detectRajYogas(planets, houseCusps, houseLords);

  // Calculate Dasha
  const dashas = calculateVimshottariDasha(planets.MOON.longitude, fullBirthDate);

  // Find current Dasha
  const now = new Date();
  const currentDasha = dashas.find(d => d.startDate <= now && d.endDate >= now);

  // Birth Nakshatra
  const moonNakshatra = planets.MOON.nakshatra;

  return {
    birthDetails: {
      date: birthDate,
      time: birthTime,
      place: input.birthPlace,
      lat: birthLat,
      lng: birthLng,
      timezone
    },
    ayanamsa: ayanamsa,
    ascendant: {
      sign: ascendant.sign,
      degree: ascendant.degree,
      lord: getHouseLord(ascendant.sign)
    },
    planets,
    houseCusps,
    houseLords,
    charts: {
      d1: planets, // Rashi Chart
      d9: navamsaChart, // Navamsa
      d10: dasamsaChart // Dasamsa
    },
    nakshatras: {
      birth: moonNakshatra.name,
      birthPada: moonNakshatra.pada,
      moon: moonNakshatra.name,
      moonPada: moonNakshatra.pada
    },
    doshas: {
      mangalDosha,
      kalSarpaDosha,
      pitruDosha: false,
      shrapitDosha: false
    },
    yogas,
    dashas,
    currentDasha: currentDasha?.planet || null,
    generatedAt: new Date()
  };
}

export default {
  generateKundli,
  getJulianDay,
  getPlanetPosition,
  getAscendant,
  getNakshatra,
  calculateVimshottariDasha
};
