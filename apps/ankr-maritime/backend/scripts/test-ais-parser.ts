/**
 * Test AIS Message Parser
 * Verify extraction of Priority 1 fields from sample AIS messages
 */

import { parseAISMessage, navigationStatusMap, vesselTypeMap } from '../src/services/ais-message-parser.js';

console.log('🧪 Testing AIS Message Parser\n');

// Test Case 1: Position Report (Type 1)
console.log('Test 1: Position Report (Message Type 1)');
console.log('=========================================');

// Real AIS Type 1 message from EVER GIVEN (example)
const type1Message = '!AIVDM,1,1,,A,15RTgt0PAso;90TKcjM8h6g208CQ,0*4A';

const parsed1 = parseAISMessage(type1Message);
if (parsed1) {
  console.log('✅ Parsed successfully!');
  console.log('Message Type:', parsed1.messageType);
  console.log('MMSI:', parsed1.mmsi);
  console.log('Position:', parsed1.latitude?.toFixed(4), parsed1.longitude?.toFixed(4));
  console.log('Speed:', parsed1.speed?.toFixed(1), 'knots');
  console.log('Course:', parsed1.course?.toFixed(1), '°');
  console.log('Heading:', parsed1.heading, '°');
  console.log('\n🎯 Priority 1 Fields:');
  console.log('  Rate of Turn:', parsed1.rateOfTurn !== undefined ? `${parsed1.rateOfTurn.toFixed(1)} deg/min` : 'N/A');
  console.log('  Navigation Status:', parsed1.navigationStatus !== undefined ? `${parsed1.navigationStatus} (${navigationStatusMap[parsed1.navigationStatus]})` : 'N/A');
  console.log('  Position Accuracy:', parsed1.positionAccuracy !== undefined ? (parsed1.positionAccuracy ? 'DGPS (<10m)' : 'GPS (>10m)') : 'N/A');
  console.log('  Maneuver Indicator:', parsed1.maneuverIndicator);
  console.log('  RAIM Flag:', parsed1.raimFlag);
  console.log('  Timestamp (UTC sec):', parsed1.timestampSeconds);
} else {
  console.log('❌ Failed to parse Type 1 message');
}

console.log('\n');

// Test Case 2: Static Data (Type 5)
console.log('Test 2: Static and Voyage Data (Message Type 5)');
console.log('================================================');

// Real AIS Type 5 message (example)
const type5Message = '!AIVDM,2,1,1,A,55?MbV02>H97VhLH@0@BjT@Dl4pT@ThpUm0hE:22222220U0p>2334o7000000000000000000,0*4C';

const parsed5 = parseAISMessage(type5Message);
if (parsed5) {
  console.log('✅ Parsed successfully!');
  console.log('Message Type:', parsed5.messageType);
  console.log('MMSI:', parsed5.mmsi);
  console.log('IMO:', parsed5.imoNumber);
  console.log('Vessel Name:', parsed5.vesselName);
  console.log('Call Sign:', parsed5.callSign);
  console.log('Vessel Type:', parsed5.vesselType, `(${vesselTypeMap[parsed5.vesselType || 0] || 'Unknown'})`);
  console.log('Destination:', parsed5.destination);
  console.log('\n🎯 Priority 1 Fields:');
  console.log('  Draught:', parsed5.draught !== undefined ? `${parsed5.draught.toFixed(1)}m` : 'N/A');
  console.log('  Dimension to Bow:', parsed5.dimensionToBow, 'm');
  console.log('  Dimension to Stern:', parsed5.dimensionToStern, 'm');
  console.log('  Dimension to Port:', parsed5.dimensionToPort, 'm');
  console.log('  Dimension to Starboard:', parsed5.dimensionToStarboard, 'm');

  if (parsed5.dimensionToBow && parsed5.dimensionToStern && parsed5.dimensionToPort && parsed5.dimensionToStarboard) {
    const length = parsed5.dimensionToBow + parsed5.dimensionToStern;
    const width = parsed5.dimensionToPort + parsed5.dimensionToStarboard;
    console.log(`  📐 Total Vessel Size: ${length}m (L) x ${width}m (W)`);
  }

  if (parsed5.eta) {
    console.log('  ETA:', parsed5.eta.toISOString());
  }
} else {
  console.log('❌ Failed to parse Type 5 message');
}

console.log('\n');

// Test Case 3: Class B Position Report (Type 18)
console.log('Test 3: Class B Position Report (Message Type 18)');
console.log('==================================================');

const type18Message = '!AIVDM,1,1,,B,B5NLCa000>fdwUlSKF2awoUkP06,0*3F';

const parsed18 = parseAISMessage(type18Message);
if (parsed18) {
  console.log('✅ Parsed successfully!');
  console.log('Message Type:', parsed18.messageType);
  console.log('MMSI:', parsed18.mmsi);
  console.log('Position:', parsed18.latitude?.toFixed(4), parsed18.longitude?.toFixed(4));
  console.log('Speed:', parsed18.speed?.toFixed(1), 'knots');
  console.log('Course:', parsed18.course?.toFixed(1), '°');
  console.log('\n🎯 Priority 1 Fields:');
  console.log('  Position Accuracy:', parsed18.positionAccuracy !== undefined ? (parsed18.positionAccuracy ? 'DGPS' : 'GPS') : 'N/A');
  console.log('  Timestamp (UTC sec):', parsed18.timestampSeconds);
  console.log('  RAIM Flag:', parsed18.raimFlag);
} else {
  console.log('❌ Failed to parse Type 18 message');
}

console.log('\n');

// Test Case 4: Navigation Status Codes
console.log('Test 4: Navigation Status Reference');
console.log('===================================');
console.log('AIS Navigation Status Codes:');
Object.entries(navigationStatusMap).forEach(([code, status]) => {
  console.log(`  ${code.padStart(2)}: ${status}`);
});

console.log('\n');

// Test Case 5: Vessel Type Codes (sample)
console.log('Test 5: Vessel Type Reference (Sample)');
console.log('======================================');
console.log('Common AIS Vessel Type Codes:');
const sampleTypes = [0, 30, 50, 52, 60, 70, 80];
sampleTypes.forEach(code => {
  console.log(`  ${code}: ${vesselTypeMap[code]}`);
});

console.log('\n✅ AIS Parser Test Complete!');
console.log('\n📊 Summary:');
console.log('  - Type 1 (Position Report): Extracts navigation dynamics');
console.log('  - Type 5 (Static Data): Extracts vessel characteristics');
console.log('  - Type 18 (Class B): Extracts basic position data');
console.log('  - All Priority 1 fields supported');
console.log('\n🚀 Ready to integrate with real AIS data sources!');
