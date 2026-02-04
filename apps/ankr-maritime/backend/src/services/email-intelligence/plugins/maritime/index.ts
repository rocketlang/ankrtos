/**
 * Maritime Email Intelligence Plugin
 * Reference implementation for shipping & maritime industry
 *
 * @package @ankr/email-intelligence
 * @industry Maritime & Shipping
 * @version 1.0.0
 */

import type { IndustryPlugin, EntityExtractor } from '../../core/types.js';
import {
  PORT_NAMES,
  CARGO_TYPES,
  VESSEL_TYPES,
  URGENCY_KEYWORDS,
  ACTIONABILITY_KEYWORDS,
} from './keywords.js';

// ============================================================================
// Entity Extractors
// ============================================================================

/**
 * Vessel name extractor
 * Patterns: M/V ATLANTIC STAR, MT PACIFIC GLORY, SS OCEAN PRIDE
 */
const vesselExtractor: EntityExtractor = {
  name: 'Vessel',
  description: 'Extract vessel names with prefixes (M/V, MT, SS)',
  pattern: /\b(?:M\/V|MV|M\.V\.|MT|M\.T\.|SS|S\.S\.)\s+["']?([A-Z][A-Za-z0-9\s\-.]{2,40}?)["']?(?=\s*[,.\-;:()\n]|$)/gi,
  validator: (value) => {
    const cleaned = value.trim();
    return cleaned.length >= 3 && cleaned.length <= 40;
  },
  transformer: (value) => value.trim().toUpperCase(),
  weight: 0.95,
};

/**
 * Port name extractor
 * Uses predefined list of 100+ major ports
 */
const portExtractor: EntityExtractor = {
  name: 'Port',
  description: 'Extract port names from predefined list',
  pattern: new RegExp(
    `\\b(${PORT_NAMES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  ),
  validator: (value) => {
    const normalized = value.toLowerCase();
    return PORT_NAMES.some((port) => port.toLowerCase() === normalized);
  },
  weight: 0.9,
};

/**
 * Cargo type extractor
 * Uses predefined list of 70+ cargo types
 */
const cargoExtractor: EntityExtractor = {
  name: 'Cargo',
  description: 'Extract cargo types from predefined list',
  pattern: new RegExp(
    `\\b(${CARGO_TYPES.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  ),
  validator: (value) => {
    const normalized = value.toLowerCase();
    return CARGO_TYPES.some((cargo) => cargo.toLowerCase() === normalized);
  },
  weight: 0.85,
};

/**
 * IMO number extractor
 * Pattern: IMO 1234567 (7 digits)
 */
const imoExtractor: EntityExtractor = {
  name: 'IMO',
  description: 'Extract IMO numbers (7 digits)',
  pattern: /\bIMO\s*[:#]?\s*(\d{7})\b/gi,
  validator: (value) => /^\d{7}$/.test(value),
  weight: 0.98,
};

/**
 * MMSI number extractor
 * Pattern: MMSI 123456789 (9 digits)
 */
const mmsiExtractor: EntityExtractor = {
  name: 'MMSI',
  description: 'Extract MMSI numbers (9 digits)',
  pattern: /\bMMSI\s*[:#]?\s*(\d{9})\b/gi,
  validator: (value) => /^\d{9}$/.test(value),
  weight: 0.98,
};

/**
 * DWT (deadweight tonnage) extractor
 * Pattern: 75,000 DWT, 50000 MT DWT
 */
const dwtExtractor: EntityExtractor = {
  name: 'DWT',
  description: 'Extract deadweight tonnage',
  pattern: /(\d{1,3}(?:,\d{3})*)\s*(?:MT\s+)?DWT/gi,
  transformer: (value) => parseFloat(value.replace(/,/g, '')),
  validator: (value) => {
    const num = typeof value === 'number' ? value : parseFloat(value);
    return !isNaN(num) && num > 0 && num < 1000000;
  },
  weight: 0.9,
};

/**
 * Freight rate extractor
 * Pattern: USD 15.50/mt, $12,500/day
 */
const freightRateExtractor: EntityExtractor = {
  name: 'FreightRate',
  description: 'Extract freight or hire rates',
  patterns: [
    /(?:USD|US\$|\$)\s*([\d,]+(?:\.\d+)?)\s*\/\s*(mt|mton|ton|day|pd)/gi,
    /(?:freight|hire)\s*[:=]?\s*(?:USD|US\$|\$)\s*([\d,]+(?:\.\d+)?)/gi,
  ],
  transformer: (value) => parseFloat(value.replace(/,/g, '')),
  weight: 0.9,
};

/**
 * Date extractor (multiple formats)
 * ISO: 2025-01-15
 * Written: Jan 15, 2025
 * Slash: 15/01/2025
 */
const dateExtractor: EntityExtractor = {
  name: 'Date',
  description: 'Extract dates in multiple formats',
  patterns: [
    // ISO format
    /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g,
    // Written format: Jan 15, 2025
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:[,\s]+\d{4})?)\b/gi,
    // Reversed: 15 Jan 2025
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?(?:[,\s]+\d{4})?)\b/gi,
    // Slash format: 15/01/2025
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,
  ],
  weight: 0.8,
};

/**
 * Amount extractor (with currency and multipliers)
 * Pattern: USD 50,000, $12.5M, EUR 3.2K
 */
const amountExtractor: EntityExtractor = {
  name: 'Amount',
  description: 'Extract monetary amounts with currency',
  pattern: /(\$|USD|EUR|GBP|JPY|SGD|AED|INR)\s*([\d,]+(?:\.\d+)?)\s*([MmBbKk])?/gi,
  transformer: (value) => {
    // Extract components: currency, number, multiplier
    const match = value.match(/(\$|USD|EUR|GBP|JPY|SGD|AED|INR)\s*([\d,]+(?:\.\d+)?)\s*([MmBbKk])?/i);
    if (!match) return value;

    const currency = match[1] === '$' ? 'USD' : match[1].toUpperCase();
    const rawValue = parseFloat(match[2].replace(/,/g, ''));
    const multiplier = match[3]
      ? match[3].toUpperCase() === 'K'
        ? 1000
        : match[3].toUpperCase() === 'M'
        ? 1000000
        : match[3].toUpperCase() === 'B'
        ? 1000000000
        : 1
      : 1;

    return {
      value: rawValue * multiplier,
      currency,
      rawValue,
      multiplier: match[3] || '',
    };
  },
  weight: 0.9,
};

// ============================================================================
// Maritime Plugin Configuration
// ============================================================================

export const maritimePlugin: IndustryPlugin = {
  industry: 'maritime',
  displayName: 'Maritime & Shipping',
  version: '1.0.0',
  description: 'Email intelligence for maritime industry including vessels, ports, cargo, and chartering',
  author: 'ANKR Labs',

  config: {
    industry: 'maritime',
    displayName: 'Maritime & Shipping',
    version: '1.0.0',
    description: 'Shipping, chartering, and port operations',

    // Entity extractors
    entityExtractors: {
      vessel: vesselExtractor,
      port: portExtractor,
      cargo: cargoExtractor,
      imo: imoExtractor,
      mmsi: mmsiExtractor,
      dwt: dwtExtractor,
      freightRate: freightRateExtractor,
      date: dateExtractor,
      amount: amountExtractor,
    },

    // Keywords for quick lookup
    keywords: {
      vessel: ['vessel', 'ship', 'MV', 'MT', 'SS', 'IMO', 'MMSI', 'DWT'],
      port: PORT_NAMES,
      cargo: CARGO_TYPES,
      fixture: ['fixture', 'offer', 'stem', 'position list', 'tonnage', 'subjects', 'recap'],
      operations: ['ETA', 'ETB', 'ETD', 'berthing', 'noon report', 'SOF', 'NOR'],
      claims: ['demurrage', 'despatch', 'claim', 'dispute', 'laytime'],
      bunker: ['bunker', 'IFO', 'MGO', 'VLSFO', 'fuel'],
      compliance: ['IMO', 'MARPOL', 'SOLAS', 'ISPS', 'ISM', 'PSC'],
    },

    // Categories
    categories: [
      {
        name: 'fixture',
        displayName: 'Fixture Negotiation',
        keywords: [
          'fixture', 'offer', 'stem', 'position list', 'tonnage', 'subjects',
          'recap', 'freight rate', 'hire rate', 'laycan', 'charter party',
          'C/P', 'clean fixed', 'fixing', 'firm offer', 'on subs',
        ],
        weight: 1.0,
        description: 'Charter party negotiations and fixture offers',
      },
      {
        name: 'operations',
        displayName: 'Voyage Operations',
        keywords: [
          'ETA', 'ETB', 'ETD', 'berthing', 'arrival', 'departure',
          'noon report', 'position', 'weather', 'speed', 'consumption',
          'ROB', 'SOF', 'NOR', 'loading', 'discharge', 'sailing',
        ],
        weight: 1.0,
        description: 'Vessel operations and voyage updates',
      },
      {
        name: 'claims',
        displayName: 'Claims & Disputes',
        keywords: [
          'demurrage', 'despatch', 'claim', 'dispute', 'laytime',
          'time sheet', 'statement of facts', 'time lost', 'off-hire',
          'damage', 'shortage', 'contamination', 'liability',
        ],
        weight: 1.2,
        description: 'Laytime claims and cargo disputes',
      },
      {
        name: 'bunker',
        displayName: 'Bunker Operations',
        keywords: [
          'bunker', 'IFO', 'MGO', 'VLSFO', 'HSFO', 'LSFO', 'fuel',
          'bunker stem', 'bunker call', 'bunker delivery', 'BDN',
          'fuel quality', 'sulphur', 'bunkering',
        ],
        weight: 0.9,
        description: 'Bunker enquiries and deliveries',
      },
      {
        name: 'compliance',
        displayName: 'Compliance & Certificates',
        keywords: [
          'IMO', 'MARPOL', 'SOLAS', 'ISPS', 'ISM', 'MLC',
          'compliance', 'certificate', 'audit', 'inspection', 'PSC',
          'vetting', 'class', 'survey', 'EEXI', 'CII', 'EU ETS',
        ],
        weight: 1.0,
        description: 'Regulatory compliance and certifications',
      },
      {
        name: 'commercial',
        displayName: 'Commercial & Market',
        keywords: [
          'market', 'rates', 'trend', 'baltic', 'BDI', 'outlook',
          'sentiment', 'last done', 'market update', 'freight index',
        ],
        weight: 0.8,
        description: 'Market intelligence and commercial updates',
      },
    ],

    // Buckets (routing rules)
    buckets: [
      {
        id: 'urgent_fixtures',
        name: 'Urgent Fixture Offers',
        displayName: 'Urgent Fixtures',
        description: 'Critical fixture offers requiring immediate response',
        conditions: [
          { field: 'category', operator: 'equals', value: 'fixture' },
          { field: 'urgency', operator: 'in', value: ['critical', 'high'] },
        ],
        assignTo: 'commercial_manager',
        notificationChannels: ['sms', 'slack', 'email'],
        escalationRules: {
          afterMinutes: 60,
          escalateTo: 'director_commercial',
        },
        autoRespond: true,
      },
      {
        id: 'fixture_normal',
        name: 'Fixture Offers',
        displayName: 'Fixtures',
        description: 'Normal priority fixture offers and negotiations',
        conditions: [
          { field: 'category', operator: 'equals', value: 'fixture' },
        ],
        assignTo: 'commercial_manager',
        notificationChannels: ['email', 'slack'],
        autoCreateLead: true,
      },
      {
        id: 'port_agent_operations',
        name: 'Port Agent Operations',
        displayName: 'Port Agent',
        description: 'Operational emails for port agents',
        conditions: [
          { field: 'category', operator: 'equals', value: 'operations' },
          { field: 'entities', operator: 'contains', value: 'port' },
        ],
        assignTo: 'port_agent',
        notificationChannels: ['email'],
        autoCreateTask: true,
      },
      {
        id: 'critical_operations',
        name: 'Critical Operations',
        displayName: 'Critical Ops',
        description: 'Urgent operational issues',
        conditions: [
          { field: 'category', operator: 'equals', value: 'operations' },
          { field: 'urgency', operator: 'equals', value: 'critical' },
        ],
        assignTo: 'ops_manager',
        notificationChannels: ['sms', 'slack'],
        escalationRules: {
          afterMinutes: 30,
          escalateTo: 'director_operations',
        },
      },
      {
        id: 'claims_disputes',
        name: 'Claims & Disputes',
        displayName: 'Claims',
        description: 'Demurrage claims and cargo disputes',
        conditions: [
          { field: 'category', operator: 'equals', value: 'claims' },
        ],
        assignTo: 'commercial_manager',
        notificationChannels: ['email', 'slack'],
      },
      {
        id: 'bunker_enquiries',
        name: 'Bunker Enquiries',
        displayName: 'Bunker',
        description: 'Bunker stem enquiries and deliveries',
        conditions: [
          { field: 'category', operator: 'equals', value: 'bunker' },
        ],
        assignTo: 'ops_manager',
        notificationChannels: ['email'],
      },
      {
        id: 'compliance_alerts',
        name: 'Compliance Alerts',
        displayName: 'Compliance',
        description: 'Regulatory compliance and certificate issues',
        conditions: [
          { field: 'category', operator: 'equals', value: 'compliance' },
        ],
        assignTo: 'compliance_officer',
        notificationChannels: ['email', 'slack'],
      },
      {
        id: 'general',
        name: 'General Correspondence',
        displayName: 'General',
        description: 'General emails not matching other categories',
        conditions: [
          { field: 'category', operator: 'equals', value: 'general' },
        ],
        assignTo: 'user',
        notificationChannels: ['email'],
      },
    ],

    // Urgency keywords (maritime-specific additions)
    urgencyKeywords: URGENCY_KEYWORDS,

    // Actionability keywords (maritime-specific additions)
    actionabilityKeywords: ACTIONABILITY_KEYWORDS,
  },
};
