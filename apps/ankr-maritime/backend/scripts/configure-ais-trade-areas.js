#!/usr/bin/env tsx
/**
 * AIS Trade Areas Configuration
 * Configures AISstream to track vessels in major global trade routes
 */
export const MAJOR_TRADE_AREAS = [
    // ASIA-PACIFIC
    {
        name: 'South China Sea',
        description: 'Major shipping lane connecting China, Southeast Asia, and beyond',
        boundingBox: [[5.0, 105.0], [25.0, 120.0]],
        priority: 1,
    },
    {
        name: 'Singapore Strait & Malacca Strait',
        description: 'World\'s busiest shipping lane, 25% of global trade',
        boundingBox: [[0.5, 98.0], [6.0, 105.0]],
        priority: 1,
    },
    {
        name: 'Taiwan Strait',
        description: 'Critical East Asian shipping corridor',
        boundingBox: [[23.0, 117.0], [26.0, 121.0]],
        priority: 2,
    },
    {
        name: 'East China Sea',
        description: 'Shanghai, Ningbo, and major Chinese ports',
        boundingBox: [[26.0, 120.0], [35.0, 130.0]],
        priority: 2,
    },
    {
        name: 'Bay of Bengal',
        description: 'India, Bangladesh, Myanmar access',
        boundingBox: [[5.0, 80.0], [22.0, 95.0]],
        priority: 2,
    },
    {
        name: 'Arabian Sea',
        description: 'India west coast, Pakistan, Oman',
        boundingBox: [[5.0, 55.0], [25.0, 75.0]],
        priority: 2,
    },
    // MIDDLE EAST
    {
        name: 'Persian Gulf',
        description: 'Oil & gas hub, Dubai, Qatar, Kuwait',
        boundingBox: [[23.0, 48.0], [30.0, 57.0]],
        priority: 1,
    },
    {
        name: 'Red Sea',
        description: 'Suez Canal approach, Jeddah, Aden',
        boundingBox: [[12.0, 37.0], [30.0, 45.0]],
        priority: 2,
    },
    {
        name: 'Suez Canal',
        description: 'Europe-Asia critical chokepoint',
        boundingBox: [[29.5, 32.2], [31.5, 32.6]],
        priority: 1,
    },
    // EUROPE
    {
        name: 'North Sea',
        description: 'Rotterdam, Hamburg, Antwerp, UK ports',
        boundingBox: [[50.0, -4.0], [60.0, 9.0]],
        priority: 1,
    },
    {
        name: 'English Channel',
        description: 'Dover Strait, busiest in Europe',
        boundingBox: [[49.5, -5.5], [51.5, 2.5]],
        priority: 1,
    },
    {
        name: 'Mediterranean Sea - West',
        description: 'Gibraltar, Spain, France, Italy',
        boundingBox: [[36.0, -6.0], [44.0, 10.0]],
        priority: 2,
    },
    {
        name: 'Mediterranean Sea - East',
        description: 'Greece, Turkey, Egypt, Israel',
        boundingBox: [[30.0, 20.0], [41.0, 37.0]],
        priority: 2,
    },
    {
        name: 'Baltic Sea',
        description: 'Northern Europe trade hub',
        boundingBox: [[53.0, 10.0], [66.0, 30.0]],
        priority: 3,
    },
    // NORTH AMERICA
    {
        name: 'US West Coast',
        description: 'LA/Long Beach, Oakland, Seattle, Tacoma',
        boundingBox: [[32.0, -125.0], [49.0, -117.0]],
        priority: 1,
    },
    {
        name: 'US East Coast',
        description: 'NY/NJ, Savannah, Norfolk, Charleston',
        boundingBox: [[25.0, -82.0], [45.0, -65.0]],
        priority: 1,
    },
    {
        name: 'US Gulf Coast',
        description: 'Houston, New Orleans, Mobile',
        boundingBox: [[24.0, -98.0], [31.0, -81.0]],
        priority: 2,
    },
    {
        name: 'Panama Canal',
        description: 'Pacific-Atlantic critical link',
        boundingBox: [[8.5, -80.5], [9.5, -79.0]],
        priority: 1,
    },
    {
        name: 'Caribbean Sea',
        description: 'Caribbean ports and transshipment hubs',
        boundingBox: [[10.0, -85.0], [25.0, -60.0]],
        priority: 3,
    },
    // AFRICA
    {
        name: 'Suez - Mediterranean',
        description: 'Port Said, Alexandria, Suez approaches',
        boundingBox: [[30.0, 29.0], [32.5, 34.5]],
        priority: 2,
    },
    {
        name: 'West Africa',
        description: 'Nigeria (Lagos), Ghana (Tema), Ivory Coast',
        boundingBox: [[4.0, -10.0], [8.0, 5.0]],
        priority: 3,
    },
    {
        name: 'South Africa',
        description: 'Cape of Good Hope, Durban, Cape Town',
        boundingBox: [[-35.0, 15.0], [-28.0, 33.0]],
        priority: 2,
    },
    // SOUTH AMERICA
    {
        name: 'Brazil East Coast',
        description: 'Santos, Rio de Janeiro, Salvador',
        boundingBox: [[-25.0, -50.0], [-5.0, -34.0]],
        priority: 2,
    },
    {
        name: 'Chile - Peru',
        description: 'Pacific coast trade',
        boundingBox: [[-40.0, -75.0], [-5.0, -70.0]],
        priority: 3,
    },
    // OCEANIA
    {
        name: 'Australia - East',
        description: 'Sydney, Melbourne, Brisbane',
        boundingBox: [[-38.0, 148.0], [-10.0, 155.0]],
        priority: 3,
    },
    {
        name: 'Australia - West',
        description: 'Fremantle, Perth',
        boundingBox: [[-35.0, 112.0], [-20.0, 120.0]],
        priority: 3,
    },
];
// Preset configurations
export const AIS_PRESETS = {
    // Global coverage (entire world)
    global: {
        name: 'Global Coverage',
        boundingBoxes: [[[-90, -180], [90, 180]]],
    },
    // Major hubs only (highest traffic)
    major_hubs: {
        name: 'Major Trade Hubs',
        boundingBoxes: MAJOR_TRADE_AREAS.filter(area => area.priority === 1).map(area => area.boundingBox),
    },
    // All high & medium priority areas
    high_priority: {
        name: 'High Priority Areas',
        boundingBoxes: MAJOR_TRADE_AREAS.filter(area => area.priority <= 2).map(area => area.boundingBox),
    },
    // All configured areas
    all_areas: {
        name: 'All Configured Trade Areas',
        boundingBoxes: MAJOR_TRADE_AREAS.map(area => area.boundingBox),
    },
    // Asia focus
    asia_pacific: {
        name: 'Asia-Pacific Focus',
        boundingBoxes: MAJOR_TRADE_AREAS.filter(area => area.name.includes('China') ||
            area.name.includes('Singapore') ||
            area.name.includes('Taiwan') ||
            area.name.includes('Bay of Bengal') ||
            area.name.includes('Arabian Sea')).map(area => area.boundingBox),
    },
    // Middle East focus
    middle_east: {
        name: 'Middle East Focus',
        boundingBoxes: MAJOR_TRADE_AREAS.filter(area => area.name.includes('Persian') ||
            area.name.includes('Red Sea') ||
            area.name.includes('Suez') ||
            area.name.includes('Arabian')).map(area => area.boundingBox),
    },
    // Europe focus
    europe: {
        name: 'Europe Focus',
        boundingBoxes: MAJOR_TRADE_AREAS.filter(area => area.name.includes('North Sea') ||
            area.name.includes('English') ||
            area.name.includes('Mediterranean') ||
            area.name.includes('Baltic')).map(area => area.boundingBox),
    },
    // Americas focus
    americas: {
        name: 'Americas Focus',
        boundingBoxes: MAJOR_TRADE_AREAS.filter(area => area.name.includes('US ') ||
            area.name.includes('Panama') ||
            area.name.includes('Caribbean') ||
            area.name.includes('Brazil') ||
            area.name.includes('Chile')).map(area => area.boundingBox),
    },
    // User's specified areas
    user_specified: {
        name: 'User Specified Areas',
        boundingBoxes: MAJOR_TRADE_AREAS.filter(area => [
            'South China Sea',
            'Singapore Strait & Malacca Strait',
            'Persian Gulf',
            'North Sea',
            'Indian Ocean',
            'Arabian Sea',
            'Bay of Bengal',
            'US West Coast',
            'US East Coast',
        ].some(name => area.name.includes(name.split(' ')[0]))).map(area => area.boundingBox),
    },
};
// Helper function to print area configuration
export function printAreaConfig(preset) {
    const config = AIS_PRESETS[preset];
    console.log(`\n📍 ${config.name}`);
    console.log(`   Areas: ${config.boundingBoxes.length}`);
    console.log(`   Coverage: ${estimateCoverage(config.boundingBoxes)} km²\n`);
}
function estimateCoverage(boxes) {
    // Rough estimate of coverage area
    let totalArea = 0;
    for (const box of boxes) {
        const [[lat1, lon1], [lat2, lon2]] = box;
        const latDiff = Math.abs(lat2 - lat1);
        const lonDiff = Math.abs(lon2 - lon1);
        // Very rough: 111km per degree latitude, varies for longitude
        const area = latDiff * 111 * lonDiff * 111 * Math.cos((lat1 * Math.PI) / 180);
        totalArea += area;
    }
    return totalArea.toLocaleString();
}
// CLI to show configurations
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('═'.repeat(80));
    console.log('🌊 AIS Trade Areas Configuration');
    console.log('═'.repeat(80));
    console.log('\n📊 Available Presets:\n');
    for (const [key, config] of Object.entries(AIS_PRESETS)) {
        console.log(`  ${key.padEnd(20)} - ${config.name} (${config.boundingBoxes.length} areas)`);
    }
    console.log('\n📍 All Configured Trade Areas:\n');
    for (const area of MAJOR_TRADE_AREAS) {
        const priority = '⭐'.repeat(4 - area.priority);
        console.log(`  ${priority} ${area.name.padEnd(40)} - ${area.description}`);
    }
    console.log('\n💡 Usage in code:');
    console.log(`
import { AIS_PRESETS } from './configure-ais-trade-areas.js';
import { aisStreamService } from '../src/services/aisstream-service.js';

// Connect with major hubs only
await aisStreamService.connect({
  boundingBoxes: AIS_PRESETS.major_hubs.boundingBoxes,
  messageTypes: ['PositionReport', 'ShipStaticData']
});

// Or user-specified areas
await aisStreamService.connect({
  boundingBoxes: AIS_PRESETS.user_specified.boundingBoxes,
  messageTypes: ['PositionReport', 'ShipStaticData']
});
  `);
}
//# sourceMappingURL=configure-ais-trade-areas.js.map