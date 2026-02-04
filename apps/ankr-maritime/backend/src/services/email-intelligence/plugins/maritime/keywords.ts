/**
 * Maritime Keywords Library
 * Comprehensive maritime terminology for email parsing
 */

/**
 * Port names (100+ major ports worldwide)
 */
export const PORT_NAMES = [
  // Asia Pacific
  'Singapore', 'Shanghai', 'Busan', 'Ningbo', 'Qingdao', 'Guangzhou', 'Tianjin',
  'Dalian', 'Kaohsiung', 'Hong Kong', 'Colombo', 'Port Klang', 'Tanjung Pelepas',
  'Laem Chabang', 'Ho Chi Minh', 'Manila', 'Jakarta', 'Surabaya', 'Bangkok',

  // Middle East
  'Fujairah', 'Jeddah', 'Port Said', 'Aden', 'Djibouti', 'Bandar Abbas',
  'Ras Tanura', 'Yanbu', 'Salalah', 'Sohar', 'Abu Dhabi', 'Khor Fakkan',

  // India
  'Mumbai', 'JNPT', 'Jawaharlal Nehru', 'Kandla', 'Mundra', 'Vizag',
  'Visakhapatnam', 'Paradip', 'Haldia', 'Chennai', 'Tuticorin', 'Cochin',
  'Ennore', 'Kakinada', 'Mangalore', 'Mormugao',

  // Europe
  'Rotterdam', 'Antwerp', 'Hamburg', 'Amsterdam', 'Felixstowe', 'Southampton',
  'Immingham', 'Milford Haven', 'Piraeus', 'Algeciras', 'Valencia', 'Barcelona',
  'Marseille', 'Genoa', 'Gioia Tauro', 'La Spezia', 'Trieste', 'Koper',
  'Constanta', 'Gdansk', 'St Petersburg', 'Novorossiysk', 'Istanbul', 'Iskenderun',

  // Americas
  'Houston', 'Long Beach', 'Los Angeles', 'New York', 'Savannah', 'Norfolk',
  'Charleston', 'Baltimore', 'New Orleans', 'Corpus Christi', 'Galveston',
  'Miami', 'Tampa', 'Jacksonville', 'Port Everglades', 'Oakland', 'Seattle',
  'Tacoma', 'Portland', 'Vancouver', 'Prince Rupert', 'Montreal', 'Halifax',

  // South America
  'Santos', 'Buenos Aires', 'Paranagua', 'Rio de Janeiro', 'Vitoria', 'Itaqui',
  'Rosario', 'San Lorenzo', 'Callao', 'Guayaquil', 'Buenaventura', 'Cartagena',
  'Valparaiso', 'San Antonio',

  // Africa
  'Durban', 'Cape Town', 'Port Elizabeth', 'Richards Bay', 'Mombasa',
  'Dar es Salaam', 'Lagos', 'Abidjan', 'Dakar', 'Casablanca', 'Tangier',

  // Australia
  'Melbourne', 'Sydney', 'Brisbane', 'Fremantle', 'Adelaide', 'Newcastle',
  'Port Hedland', 'Dampier', 'Hay Point', 'Gladstone', 'Port Kembla',
];

/**
 * Cargo types (70+ common commodities)
 */
export const CARGO_TYPES = [
  // Liquid bulk
  'crude oil', 'fuel oil', 'gas oil', 'diesel', 'naphtha', 'jet fuel',
  'gasoline', 'kerosene', 'LNG', 'LPG', 'condensate', 'bitumen',
  'vegetable oil', 'palm oil', 'sunflower oil', 'rapeseed oil',
  'molasses', 'caustic soda', 'methanol', 'ethanol', 'chemicals',

  // Dry bulk
  'iron ore', 'coal', 'thermal coal', 'coking coal', 'met coke', 'petcoke',
  'bauxite', 'alumina', 'manganese ore', 'nickel ore', 'copper concentrate',
  'zinc concentrate', 'chrome ore', 'ilmenite', 'rutile',

  // Grains & Agriculture
  'grain', 'wheat', 'corn', 'maize', 'soybeans', 'soybean meal', 'soybean oil',
  'rice', 'barley', 'sorghum', 'sugar', 'raw sugar', 'white sugar',

  // Fertilizers
  'fertilizer', 'urea', 'DAP', 'MOP', 'TSP', 'phosphate', 'potash', 'sulphur',
  'ammonia', 'ammonium nitrate',

  // Industrial
  'cement', 'clinker', 'gypsum', 'limestone', 'salt', 'sand', 'aggregates',
  'steel coils', 'steel slabs', 'steel billets', 'steel plates', 'steel pipes',
  'pig iron', 'scrap', 'scrap metal', 'HMS', 'shredded scrap',

  // Forest products
  'woodchips', 'logs', 'lumber', 'timber', 'pulp', 'paper',

  // Containers & breakbulk
  'containers', 'TEU', 'FEU', 'general cargo', 'project cargo', 'breakbulk',
  'heavy lift', 'oversized cargo', 'machinery', 'equipment',
];

/**
 * Vessel types
 */
export const VESSEL_TYPES = [
  // Bulk carriers
  'capesize', 'panamax', 'supramax', 'handymax', 'handysize',
  'mini bulker', 'bulk carrier', 'bulker',

  // Tankers
  'VLCC', 'suezmax', 'aframax', 'panamax tanker', 'MR tanker', 'LR1', 'LR2',
  'handy tanker', 'product tanker', 'crude tanker', 'chemical tanker',
  'LNG carrier', 'LPG carrier', 'gas carrier',

  // Container ships
  'container ship', 'feeder', 'feedermax', 'panamax container', 'post-panamax',
  'new panamax', 'ultra large container', 'ULCS',

  // Specialized
  'ro-ro', 'car carrier', 'reefer', 'multipurpose', 'general cargo ship',
  'heavy lift vessel', 'offshore vessel', 'supply vessel', 'tug', 'barge',
];

/**
 * Maritime terms
 */
export const MARITIME_TERMS = [
  // Chartering
  'fixture', 'charter party', 'C/P', 'time charter', 'voyage charter',
  'bareboat charter', 'COA', 'contract of affreightment', 'laycan',
  'laytime', 'demurrage', 'despatch', 'freight', 'hire', 'ballast bonus',
  'deadfreight', 'address commission', 'brokerage',

  // Operations
  'ETA', 'ETB', 'ETD', 'ATA', 'ATB', 'ATD', 'NOR', 'notice of readiness',
  'SOF', 'statement of facts', 'noon report', 'arrival report', 'departure report',
  'berthing', 'anchorage', 'pilot', 'pilotage', 'towage', 'tug', 'mooring',

  // Documents
  'bill of lading', 'BOL', 'B/L', 'cargo manifest', 'stowage plan',
  'crew list', 'passenger list', 'cargo declaration', 'dangerous cargo list',
  'ship stores', 'maritime declaration of health', 'pre-arrival notification',

  // Certificates
  'certificate of registry', 'classification certificate', 'class cert',
  'ISPS certificate', 'ISM certificate', 'IOPP certificate', 'ITC certificate',
  'load line certificate', 'tonnage certificate', 'safe manning certificate',
  'insurance certificate', 'P&I certificate',

  // Cargo operations
  'loading', 'discharging', 'cargo ops', 'stevedoring', 'shore handling',
  'lashing', 'securing', 'stowage', 'trimming', 'draft survey',

  // Commercial
  'fixture list', 'position list', 'open tonnage', 'prompt', 'spot',
  'forward', 'market rate', 'last done', 'firm offer', 'subjects',
  'on subs', 'clean fixed', 'fixing', 'failed', 'recap',

  // Bunker
  'bunker', 'IFO', 'VLSFO', 'HSFO', 'LSFO', 'MGO', 'MDO', 'LSMGO',
  'bunker stem', 'bunker call', 'ROB', 'remaining on board',
  'bunker delivery note', 'BDN',

  // Technical
  'drydock', 'special survey', 'class renewal', 'BWTS', 'scrubber',
  'ballast water treatment', 'exhaust gas cleaning', 'EEXI', 'CII',

  // Compliance
  'IMO', 'MARPOL', 'SOLAS', 'ISPS', 'ISM', 'MLC', 'EU ETS', 'EEDI',
  'port state control', 'PSC', 'flag state', 'vetting', 'SIRE',
];

/**
 * Urgency indicators
 */
export const URGENCY_KEYWORDS = {
  critical: [
    'URGENT', 'CRITICAL', 'EMERGENCY', 'ASAP', 'IMMEDIATELY',
    'TIME-SENSITIVE', 'TIME SENSITIVE', 'DEADLINE',
    'EXPIRE', 'EXPIRING', 'LAST CHANCE', 'ACT NOW',
    'TIME IS OF THE ESSENCE', 'WITHOUT DELAY',
  ],
  high: [
    'important', 'priority', 'high priority', 'expedite',
    'please confirm asap', 'soon as possible', 'earliest convenience',
    'kindly revert', 'awaiting urgently',
  ],
  medium: [
    'please', 'kindly', 'at your convenience', 'when possible',
  ],
  low: [
    'fyi', 'for your information', 'for your records', 'for your reference',
    'note', 'please note',
  ],
};

/**
 * Actionability indicators
 */
export const ACTIONABILITY_KEYWORDS = {
  requires_approval: [
    'please approve', 'for your approval', 'request approval',
    'authorization required', 'please review and approve',
    'sign off required', 'need your approval', 'awaiting approval',
  ],
  requires_response: [
    'please confirm', 'kindly revert', 'awaiting your response',
    'please advise', 'need confirmation', 'require feedback',
    'what is your view', 'do you agree', 'please reply',
  ],
  requires_action: [
    'please arrange', 'kindly provide', 'please send', 'submit',
    'prepare', 'please ensure', 'arrange payment', 'send documents',
    'issue invoice', 'please forward', 'kindly forward',
  ],
  informational: [
    'fyi', 'for your information', 'for your records',
    'for your reference', 'please note', 'as discussed',
  ],
};
