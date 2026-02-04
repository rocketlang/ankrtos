/**
 * AIS Message Parser
 * Extract Priority 1 fields from raw AIS NMEA messages
 *
 * Supports AIS Message Types:
 * - Type 1/2/3: Position Report (Class A)
 * - Type 5: Static and Voyage Related Data
 * - Type 18/19: Standard Class B Position Report
 * - Type 24: Static Data Report (Class B)
 *
 * Priority 1 Fields:
 * - Navigation dynamics: rateOfTurn, navigationStatus, positionAccuracy, maneuverIndicator, raimFlag, timestampSeconds
 * - Vessel characteristics: draught, dimensionToBow, dimensionToStern, dimensionToPort, dimensionToStarboard
 */

export interface ParsedAISMessage {
  messageType: number;
  mmsi: number;

  // Position Report (Type 1/2/3, 18, 19)
  latitude?: number;
  longitude?: number;
  speed?: number; // SOG in knots
  course?: number; // COG in degrees
  heading?: number; // True heading in degrees

  // Priority 1: Navigation dynamics
  rateOfTurn?: number; // degrees per minute (-720 to +720, -128 = not available)
  navigationStatus?: number; // 0-15 (Type 1/2/3 only)
  positionAccuracy?: boolean; // true = DGPS (<10m), false = unaugmented GNSS (>10m)
  maneuverIndicator?: number; // 0=not available, 1=no special maneuver, 2=special maneuver
  raimFlag?: boolean; // Receiver Autonomous Integrity Monitoring
  timestampSeconds?: number; // UTC second (0-59, 60=not available)

  // Static Data (Type 5)
  vesselName?: string;
  callSign?: string;
  imoNumber?: number;
  vesselType?: number; // AIS vessel type code (0-99)
  destination?: string;
  eta?: Date;

  // Priority 1: Vessel characteristics
  draught?: number; // Current draught in meters
  dimensionToBow?: number; // Distance from AIS unit to bow (meters)
  dimensionToStern?: number; // Distance from AIS unit to stern (meters)
  dimensionToPort?: number; // Distance from AIS unit to port side (meters)
  dimensionToStarboard?: number; // Distance from AIS unit to starboard side (meters)
}

/**
 * Parse AIS NMEA message
 * @param nmea Raw NMEA sentence (e.g., "!AIVDM,1,1,,A,15RTgt0PAso;90TKcjM8h6g208CQ,0*4A")
 */
export function parseAISMessage(nmea: string): ParsedAISMessage | null {
  try {
    // Parse NMEA envelope
    const parts = nmea.split(',');
    if (parts.length < 6) return null;

    const payload = parts[5].split('*')[0]; // Get payload before checksum
    const bits = decodeSixBit(payload);

    // Extract message type (bits 0-5)
    const messageType = extractBits(bits, 0, 6);

    // Extract MMSI (bits 8-37)
    const mmsi = extractBits(bits, 8, 30);

    const result: ParsedAISMessage = {
      messageType,
      mmsi,
    };

    // Parse based on message type
    switch (messageType) {
      case 1:
      case 2:
      case 3:
        parsePositionReport(bits, result);
        break;
      case 5:
        parseStaticData(bits, result);
        break;
      case 18:
      case 19:
        parseClassBPositionReport(bits, result);
        break;
      case 24:
        parseClassBStaticData(bits, result);
        break;
      default:
        // Unsupported message type
        break;
    }

    return result;
  } catch (error) {
    console.error('Error parsing AIS message:', error);
    return null;
  }
}

/**
 * Parse Position Report (Message Type 1/2/3)
 */
function parsePositionReport(bits: string, result: ParsedAISMessage): void {
  // Navigation Status (bits 38-41)
  result.navigationStatus = extractBits(bits, 38, 4);

  // Rate of Turn (bits 42-49) - signed 8-bit
  const rotRaw = extractBits(bits, 42, 8);
  if (rotRaw !== 128) { // 128 = not available
    // Convert from AIS ROT format to degrees per minute
    const rotSign = rotRaw & 0x80 ? -1 : 1;
    const rotValue = rotRaw & 0x7F;
    result.rateOfTurn = rotSign * Math.pow(rotValue / 4.733, 2);
  }

  // Speed Over Ground (bits 50-59) - 0.1 knot resolution
  const sogRaw = extractBits(bits, 50, 10);
  if (sogRaw !== 1023) { // 1023 = not available
    result.speed = sogRaw / 10;
  }

  // Position Accuracy (bit 60)
  result.positionAccuracy = extractBits(bits, 60, 1) === 1;

  // Longitude (bits 61-88) - signed 28-bit, 1/10000 minute resolution
  const lonRaw = extractSignedBits(bits, 61, 28);
  if (lonRaw !== 0x6791AC0) { // Default unavailable value
    result.longitude = lonRaw / 600000;
  }

  // Latitude (bits 89-116) - signed 27-bit, 1/10000 minute resolution
  const latRaw = extractSignedBits(bits, 89, 27);
  if (latRaw !== 0x3412140) { // Default unavailable value
    result.latitude = latRaw / 600000;
  }

  // Course Over Ground (bits 116-127) - 0.1 degree resolution
  const cogRaw = extractBits(bits, 116, 12);
  if (cogRaw !== 3600) { // 3600 = not available
    result.course = cogRaw / 10;
  }

  // True Heading (bits 128-136) - 1 degree resolution
  const headingRaw = extractBits(bits, 128, 9);
  if (headingRaw !== 511) { // 511 = not available
    result.heading = headingRaw;
  }

  // Time Stamp (bits 137-142) - UTC second
  result.timestampSeconds = extractBits(bits, 137, 6);

  // Maneuver Indicator (bits 143-144)
  result.maneuverIndicator = extractBits(bits, 143, 2);

  // RAIM flag (bit 148)
  result.raimFlag = extractBits(bits, 148, 1) === 1;
}

/**
 * Parse Static and Voyage Data (Message Type 5)
 */
function parseStaticData(bits: string, result: ParsedAISMessage): void {
  // IMO Number (bits 40-69)
  const imoRaw = extractBits(bits, 40, 30);
  if (imoRaw !== 0) {
    result.imoNumber = imoRaw;
  }

  // Call Sign (bits 70-111) - 7 characters, 6-bit ASCII
  result.callSign = extractString(bits, 70, 42).trim();

  // Vessel Name (bits 112-231) - 20 characters, 6-bit ASCII
  result.vesselName = extractString(bits, 112, 120).trim();

  // Vessel Type (bits 232-239)
  result.vesselType = extractBits(bits, 232, 8);

  // Dimensions (bits 240-269)
  result.dimensionToBow = extractBits(bits, 240, 9);
  result.dimensionToStern = extractBits(bits, 249, 9);
  result.dimensionToPort = extractBits(bits, 258, 6);
  result.dimensionToStarboard = extractBits(bits, 264, 6);

  // Draught (bits 294-301) - 0.1 meter resolution
  const draughtRaw = extractBits(bits, 294, 8);
  if (draughtRaw !== 0) {
    result.draught = draughtRaw / 10;
  }

  // Destination (bits 302-421) - 20 characters, 6-bit ASCII
  result.destination = extractString(bits, 302, 120).trim();

  // ETA (bits 274-293)
  const etaMonth = extractBits(bits, 274, 4);
  const etaDay = extractBits(bits, 278, 5);
  const etaHour = extractBits(bits, 283, 5);
  const etaMinute = extractBits(bits, 288, 6);

  if (etaMonth !== 0 && etaDay !== 0) {
    const now = new Date();
    const year = now.getFullYear();
    result.eta = new Date(year, etaMonth - 1, etaDay, etaHour, etaMinute);

    // If ETA is in the past, assume next year
    if (result.eta < now) {
      result.eta.setFullYear(year + 1);
    }
  }
}

/**
 * Parse Class B Position Report (Message Type 18/19)
 */
function parseClassBPositionReport(bits: string, result: ParsedAISMessage): void {
  // Speed Over Ground (bits 46-55)
  const sogRaw = extractBits(bits, 46, 10);
  if (sogRaw !== 1023) {
    result.speed = sogRaw / 10;
  }

  // Position Accuracy (bit 56)
  result.positionAccuracy = extractBits(bits, 56, 1) === 1;

  // Longitude (bits 57-84)
  const lonRaw = extractSignedBits(bits, 57, 28);
  if (lonRaw !== 0x6791AC0) {
    result.longitude = lonRaw / 600000;
  }

  // Latitude (bits 85-111)
  const latRaw = extractSignedBits(bits, 85, 27);
  if (latRaw !== 0x3412140) {
    result.latitude = latRaw / 600000;
  }

  // Course Over Ground (bits 112-123)
  const cogRaw = extractBits(bits, 112, 12);
  if (cogRaw !== 3600) {
    result.course = cogRaw / 10;
  }

  // True Heading (bits 124-132)
  const headingRaw = extractBits(bits, 124, 9);
  if (headingRaw !== 511) {
    result.heading = headingRaw;
  }

  // Time Stamp (bits 133-138)
  result.timestampSeconds = extractBits(bits, 133, 6);

  // RAIM flag (bit 148 for Type 18, bit 147 for Type 19)
  const raimBit = result.messageType === 18 ? 148 : 147;
  result.raimFlag = extractBits(bits, raimBit, 1) === 1;
}

/**
 * Parse Class B Static Data (Message Type 24)
 */
function parseClassBStaticData(bits: string, result: ParsedAISMessage): void {
  // Part Number (bits 38-39)
  const partNumber = extractBits(bits, 38, 2);

  if (partNumber === 0) {
    // Part A: Vessel Name
    result.vesselName = extractString(bits, 40, 120).trim();
  } else if (partNumber === 1) {
    // Part B: Vessel type and dimensions
    result.vesselType = extractBits(bits, 40, 8);

    // Dimensions
    result.dimensionToBow = extractBits(bits, 132, 9);
    result.dimensionToStern = extractBits(bits, 141, 9);
    result.dimensionToPort = extractBits(bits, 150, 6);
    result.dimensionToStarboard = extractBits(bits, 156, 6);
  }
}

/**
 * Decode 6-bit ASCII to binary string
 */
function decodeSixBit(payload: string): string {
  const armoring = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_ !"#$%&\'()*+,-./0123456789:;<=>?';
  let bits = '';

  for (const char of payload) {
    const value = armoring.indexOf(char);
    if (value === -1) continue;
    bits += value.toString(2).padStart(6, '0');
  }

  return bits;
}

/**
 * Extract bits from binary string
 */
function extractBits(bits: string, start: number, length: number): number {
  const bitString = bits.substring(start, start + length);
  return parseInt(bitString, 2);
}

/**
 * Extract signed bits (two's complement)
 */
function extractSignedBits(bits: string, start: number, length: number): number {
  const bitString = bits.substring(start, start + length);
  const value = parseInt(bitString, 2);

  // Check if negative (MSB is 1)
  if (bitString[0] === '1') {
    // Two's complement
    return value - Math.pow(2, length);
  }

  return value;
}

/**
 * Extract 6-bit ASCII string
 */
function extractString(bits: string, start: number, length: number): string {
  const chars: string[] = [];

  for (let i = 0; i < length; i += 6) {
    const charBits = bits.substring(start + i, start + i + 6);
    const charCode = parseInt(charBits, 2);

    if (charCode === 0) break; // Null terminator

    // Convert 6-bit ASCII to standard ASCII
    if (charCode < 32) {
      chars.push(String.fromCharCode(charCode + 64));
    } else {
      chars.push(String.fromCharCode(charCode));
    }
  }

  return chars.join('').replace(/@/g, ' '); // @ represents space in 6-bit ASCII
}

/**
 * Navigation status code to string mapping
 */
export const navigationStatusMap: Record<number, string> = {
  0: 'under_way_engine',
  1: 'at_anchor',
  2: 'not_under_command',
  3: 'restricted_maneuverability',
  4: 'constrained_by_draught',
  5: 'moored',
  6: 'aground',
  7: 'fishing',
  8: 'under_way_sailing',
  9: 'reserved_hsc',
  10: 'reserved_wing',
  11: 'power_driven_towing_astern',
  12: 'power_driven_pushing',
  13: 'reserved',
  14: 'ais_sart',
  15: 'undefined',
};

/**
 * AIS vessel type code to description mapping (subset of 99 types)
 */
export const vesselTypeMap: Record<number, string> = {
  // Not available
  0: 'Not available',

  // Reserved
  1: 'Reserved',

  // Wing in ground (WIG)
  20: 'WIG',
  21: 'WIG - Hazardous category A',
  22: 'WIG - Hazardous category B',
  23: 'WIG - Hazardous category C',
  24: 'WIG - Hazardous category D',

  // Fishing
  30: 'Fishing',

  // Towing
  31: 'Towing',
  32: 'Towing: length exceeds 200m or breadth exceeds 25m',

  // Dredging or underwater ops
  33: 'Dredging or underwater ops',

  // Diving ops
  34: 'Diving ops',

  // Military ops
  35: 'Military ops',

  // Sailing
  36: 'Sailing',
  37: 'Pleasure Craft',

  // High speed craft (HSC)
  40: 'HSC',
  41: 'HSC - Hazardous category A',
  42: 'HSC - Hazardous category B',
  43: 'HSC - Hazardous category C',
  44: 'HSC - Hazardous category D',
  49: 'HSC - No additional information',

  // Pilot Vessel
  50: 'Pilot Vessel',

  // Search and Rescue vessel
  51: 'Search and Rescue vessel',

  // Tug
  52: 'Tug',

  // Port Tender
  53: 'Port Tender',

  // Anti-pollution equipment
  54: 'Anti-pollution equipment',

  // Law Enforcement
  55: 'Law Enforcement',

  // Medical Transport
  58: 'Medical Transport',

  // Passenger
  60: 'Passenger',
  61: 'Passenger - Hazardous category A',
  62: 'Passenger - Hazardous category B',
  63: 'Passenger - Hazardous category C',
  64: 'Passenger - Hazardous category D',
  69: 'Passenger - No additional information',

  // Cargo
  70: 'Cargo',
  71: 'Cargo - Hazardous category A',
  72: 'Cargo - Hazardous category B',
  73: 'Cargo - Hazardous category C',
  74: 'Cargo - Hazardous category D',
  79: 'Cargo - No additional information',

  // Tanker
  80: 'Tanker',
  81: 'Tanker - Hazardous category A',
  82: 'Tanker - Hazardous category B',
  83: 'Tanker - Hazardous category C',
  84: 'Tanker - Hazardous category D',
  89: 'Tanker - No additional information',

  // Other
  90: 'Other Type',
  91: 'Other Type - Hazardous category A',
  92: 'Other Type - Hazardous category B',
  93: 'Other Type - Hazardous category C',
  94: 'Other Type - Hazardous category D',
  99: 'Other Type - No additional information',
};
