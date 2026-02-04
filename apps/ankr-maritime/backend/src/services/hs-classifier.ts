// hs-classifier.ts
// HS Code classification engine: keyword-based cargo classification, validation, related codes, restrictions.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HSClassification {
  hsCode: string;
  confidence: number;         // 0.0 to 1.0
  description: string;
  alternatives: HSAlternative[];
}

export interface HSAlternative {
  hsCode: string;
  confidence: number;
  description: string;
}

export interface HSValidation {
  isValid: boolean;
  level: string;              // 'chapter' | 'heading' | 'subheading' | 'tariff_item' | 'invalid'
  formatted: string;
}

export interface RestrictionResult {
  restricted: boolean;
  reason?: string;
  licenseRequired: boolean;
}

// ---------------------------------------------------------------------------
// Constants — Cargo keyword-to-HS mapping (30+ common maritime cargo types)
// ---------------------------------------------------------------------------

interface CargoMapping {
  hsCode: string;
  description: string;
  keywords: string[];
  alternatives?: { hsCode: string; description: string }[];
}

const CARGO_HS_MAP: CargoMapping[] = [
  {
    hsCode: '2709',
    description: 'Crude petroleum oils',
    keywords: ['crude oil', 'crude petroleum', 'crude'],
    alternatives: [
      { hsCode: '2709.00.10', description: 'Petroleum crude - low sulphur' },
      { hsCode: '2709.00.20', description: 'Petroleum crude - high sulphur' },
    ],
  },
  {
    hsCode: '2601',
    description: 'Iron ores and concentrates',
    keywords: ['iron ore', 'iron fines', 'iron pellets', 'iron concentrate'],
    alternatives: [
      { hsCode: '2601.11', description: 'Iron ore - non-agglomerated' },
      { hsCode: '2601.12', description: 'Iron ore - agglomerated (pellets)' },
    ],
  },
  {
    hsCode: '2701',
    description: 'Coal; briquettes, ovoids',
    keywords: ['coal', 'anthracite', 'bituminous coal', 'thermal coal', 'coking coal', 'steam coal'],
    alternatives: [
      { hsCode: '2701.11', description: 'Anthracite coal' },
      { hsCode: '2701.12', description: 'Bituminous coal' },
      { hsCode: '2701.19', description: 'Other coal' },
    ],
  },
  {
    hsCode: '1001',
    description: 'Wheat and meslin',
    keywords: ['wheat', 'meslin', 'durum wheat'],
    alternatives: [
      { hsCode: '1001.11', description: 'Durum wheat - seed' },
      { hsCode: '1001.19', description: 'Durum wheat - other' },
      { hsCode: '1001.91', description: 'Other wheat - seed' },
      { hsCode: '1001.99', description: 'Other wheat - other' },
    ],
  },
  {
    hsCode: '1006',
    description: 'Rice',
    keywords: ['rice', 'basmati', 'paddy', 'broken rice', 'husked rice'],
    alternatives: [
      { hsCode: '1006.10', description: 'Rice in the husk (paddy)' },
      { hsCode: '1006.20', description: 'Husked (brown) rice' },
      { hsCode: '1006.30', description: 'Semi-milled or wholly milled rice' },
      { hsCode: '1006.40', description: 'Broken rice' },
    ],
  },
  {
    hsCode: '1701',
    description: 'Cane or beet sugar',
    keywords: ['sugar', 'raw sugar', 'refined sugar', 'cane sugar', 'beet sugar'],
    alternatives: [
      { hsCode: '1701.13', description: 'Cane sugar - raw' },
      { hsCode: '1701.14', description: 'Other cane sugar' },
      { hsCode: '1701.91', description: 'Refined sugar - flavoured' },
      { hsCode: '1701.99', description: 'Other refined sugar' },
    ],
  },
  {
    hsCode: '5201',
    description: 'Cotton, not carded or combed',
    keywords: ['cotton', 'raw cotton', 'cotton bales', 'lint cotton'],
    alternatives: [
      { hsCode: '5201.00.10', description: 'Indian cotton' },
      { hsCode: '5201.00.20', description: 'Other raw cotton' },
    ],
  },
  {
    hsCode: '3102',
    description: 'Mineral or chemical nitrogenous fertilisers',
    keywords: ['fertilizer', 'fertiliser', 'urea', 'ammonium nitrate', 'nitrogenous fertilizer'],
    alternatives: [
      { hsCode: '3102.10', description: 'Urea' },
      { hsCode: '3102.30', description: 'Ammonium nitrate' },
      { hsCode: '3102.40', description: 'Ammonium nitrate mixtures' },
    ],
  },
  {
    hsCode: '7208',
    description: 'Flat-rolled products of iron/steel, hot-rolled',
    keywords: ['steel coil', 'steel coils', 'hr coil', 'hot rolled steel', 'flat rolled steel', 'hr steel'],
    alternatives: [
      { hsCode: '7208.10', description: 'Hot-rolled coils - patterns in relief' },
      { hsCode: '7208.25', description: 'Hot-rolled coils - pickled, >=4.75mm' },
      { hsCode: '7208.26', description: 'Hot-rolled coils - pickled, 3-4.75mm' },
      { hsCode: '7208.27', description: 'Hot-rolled coils - pickled, <3mm' },
    ],
  },
  {
    hsCode: '2523',
    description: 'Portland cement, aluminous cement, slag cement',
    keywords: ['cement', 'portland cement', 'clinker', 'slag cement'],
    alternatives: [
      { hsCode: '2523.10', description: 'Cement clinkers' },
      { hsCode: '2523.21', description: 'White Portland cement' },
      { hsCode: '2523.29', description: 'Other Portland cement' },
      { hsCode: '2523.90', description: 'Other hydraulic cements' },
    ],
  },
  {
    hsCode: '2711',
    description: 'Petroleum gases and other gaseous hydrocarbons',
    keywords: ['lng', 'liquefied natural gas', 'lpg', 'liquefied petroleum gas', 'propane', 'butane', 'natural gas'],
    alternatives: [
      { hsCode: '2711.11', description: 'LNG - liquefied natural gas' },
      { hsCode: '2711.12', description: 'Propane' },
      { hsCode: '2711.13', description: 'Butane' },
      { hsCode: '2711.19', description: 'Other petroleum gases - liquefied' },
      { hsCode: '2711.21', description: 'Natural gas - gaseous' },
    ],
  },
  {
    hsCode: '4403',
    description: 'Wood in the rough',
    keywords: ['timber', 'logs', 'wood', 'lumber', 'round wood', 'rough wood'],
    alternatives: [
      { hsCode: '4403.11', description: 'Coniferous wood - treated' },
      { hsCode: '4403.12', description: 'Coniferous wood - untreated' },
      { hsCode: '4403.49', description: 'Tropical wood - other' },
    ],
  },
  {
    hsCode: '7403',
    description: 'Refined copper and copper alloys',
    keywords: ['copper', 'refined copper', 'copper cathode', 'copper ingot'],
    alternatives: [
      { hsCode: '7403.11', description: 'Copper cathodes' },
      { hsCode: '7403.12', description: 'Copper wire-bars' },
      { hsCode: '7403.13', description: 'Copper billets' },
      { hsCode: '7403.19', description: 'Other refined copper' },
    ],
  },
  {
    hsCode: '7601',
    description: 'Unwrought aluminium',
    keywords: ['aluminum', 'aluminium', 'aluminum ingot', 'aluminium ingot', 'unwrought aluminium'],
    alternatives: [
      { hsCode: '7601.10', description: 'Aluminium - not alloyed' },
      { hsCode: '7601.20', description: 'Aluminium alloys' },
    ],
  },
  {
    hsCode: '7901',
    description: 'Unwrought zinc',
    keywords: ['zinc', 'zinc ingot', 'unwrought zinc', 'zinc slab'],
    alternatives: [
      { hsCode: '7901.11', description: 'Zinc - not alloyed, >=99.99%' },
      { hsCode: '7901.12', description: 'Zinc - not alloyed, <99.99%' },
      { hsCode: '7901.20', description: 'Zinc alloys' },
    ],
  },
  {
    hsCode: '7502',
    description: 'Unwrought nickel',
    keywords: ['nickel', 'nickel cathode', 'unwrought nickel', 'nickel briquettes'],
    alternatives: [
      { hsCode: '7502.10', description: 'Nickel - not alloyed' },
      { hsCode: '7502.20', description: 'Nickel alloys' },
    ],
  },
  {
    hsCode: '1511',
    description: 'Palm oil and its fractions',
    keywords: ['palm oil', 'crude palm oil', 'cpo', 'rbd palm oil', 'palm olein'],
    alternatives: [
      { hsCode: '1511.10', description: 'Crude palm oil' },
      { hsCode: '1511.90', description: 'Refined palm oil' },
    ],
  },
  {
    hsCode: '1201',
    description: 'Soya beans',
    keywords: ['soybean', 'soybeans', 'soya', 'soya beans', 'soy'],
    alternatives: [
      { hsCode: '1201.10', description: 'Soya beans - seed' },
      { hsCode: '1201.90', description: 'Soya beans - other' },
    ],
  },
  {
    hsCode: '1005',
    description: 'Maize (corn)',
    keywords: ['corn', 'maize', 'yellow corn', 'white corn'],
    alternatives: [
      { hsCode: '1005.10', description: 'Maize - seed' },
      { hsCode: '1005.90', description: 'Maize - other' },
    ],
  },
  {
    hsCode: '2606',
    description: 'Aluminium ores and concentrates (bauxite)',
    keywords: ['bauxite', 'aluminium ore', 'aluminum ore'],
    alternatives: [
      { hsCode: '2606.00.10', description: 'Bauxite - calcined' },
      { hsCode: '2606.00.90', description: 'Bauxite - other' },
    ],
  },
  {
    hsCode: '2602',
    description: 'Manganese ores and concentrates',
    keywords: ['manganese', 'manganese ore', 'mn ore'],
    alternatives: [
      { hsCode: '2602.00.10', description: 'Manganese ore - battery grade' },
      { hsCode: '2602.00.90', description: 'Manganese ore - other' },
    ],
  },
  {
    hsCode: '2510',
    description: 'Natural calcium phosphates',
    keywords: ['phosphate', 'rock phosphate', 'phosphate rock', 'calcium phosphate'],
    alternatives: [
      { hsCode: '2510.10', description: 'Natural phosphates - unground' },
      { hsCode: '2510.20', description: 'Natural phosphates - ground' },
    ],
  },
  {
    hsCode: '2503',
    description: 'Sulphur of all kinds',
    keywords: ['sulphur', 'sulfur', 'brimstone'],
    alternatives: [
      { hsCode: '2503.00.10', description: 'Sublimed or precipitated sulphur' },
      { hsCode: '2503.00.90', description: 'Other sulphur' },
    ],
  },
  {
    hsCode: '2710',
    description: 'Petroleum oils (not crude)',
    keywords: ['petroleum products', 'diesel', 'petrol', 'gasoline', 'naphtha', 'fuel oil', 'kerosene', 'jet fuel'],
    alternatives: [
      { hsCode: '2710.12', description: 'Light petroleum oils (gasoline, naphtha)' },
      { hsCode: '2710.19', description: 'Heavy petroleum oils (diesel, fuel oil)' },
      { hsCode: '2710.20', description: 'Biodiesel blends' },
    ],
  },
  {
    hsCode: '2902',
    description: 'Cyclic hydrocarbons',
    keywords: ['chemicals', 'benzene', 'toluene', 'xylene', 'styrene', 'cyclic hydrocarbons'],
    alternatives: [
      { hsCode: '2902.20', description: 'Benzene' },
      { hsCode: '2902.30', description: 'Toluene' },
      { hsCode: '2902.41', description: 'o-Xylene' },
      { hsCode: '2902.44', description: 'Mixed xylene isomers' },
    ],
  },
  {
    hsCode: '8609',
    description: 'Containers for transport',
    keywords: ['container', 'containers', 'shipping container', 'freight container', 'iso container'],
    alternatives: [
      { hsCode: '8609.00.10', description: 'Containers - 20ft standard' },
      { hsCode: '8609.00.20', description: 'Containers - 40ft standard' },
      { hsCode: '8609.00.90', description: 'Other containers' },
    ],
  },
  {
    hsCode: '8703',
    description: 'Motor cars and vehicles for transport of persons',
    keywords: ['vehicle', 'vehicles', 'cars', 'automobile', 'motor car', 'passenger vehicle', 'suv'],
    alternatives: [
      { hsCode: '8703.21', description: 'Vehicles - spark ignition, <=1000cc' },
      { hsCode: '8703.22', description: 'Vehicles - spark ignition, 1000-1500cc' },
      { hsCode: '8703.23', description: 'Vehicles - spark ignition, 1500-3000cc' },
      { hsCode: '8703.24', description: 'Vehicles - spark ignition, >3000cc' },
      { hsCode: '8703.80', description: 'Electric vehicles' },
    ],
  },
  {
    hsCode: '8429',
    description: 'Self-propelled bulldozers, excavators, loaders',
    keywords: ['machinery', 'bulldozer', 'excavator', 'loader', 'grader', 'earth moving', 'construction machinery'],
    alternatives: [
      { hsCode: '8429.11', description: 'Bulldozers - track laying' },
      { hsCode: '8429.20', description: 'Graders and levellers' },
      { hsCode: '8429.51', description: 'Front-end shovel loaders' },
      { hsCode: '8429.52', description: 'Excavators' },
    ],
  },
  {
    hsCode: '8471',
    description: 'Automatic data processing machines (computers)',
    keywords: ['electronics', 'computer', 'laptop', 'server', 'data processing', 'pc'],
    alternatives: [
      { hsCode: '8471.30', description: 'Laptops and notebooks' },
      { hsCode: '8471.41', description: 'Other ADP machines - with CPU and I/O' },
      { hsCode: '8471.49', description: 'Other ADP machines - systems' },
      { hsCode: '8471.60', description: 'Input or output units' },
    ],
  },
  {
    hsCode: '5208',
    description: 'Woven cotton fabrics',
    keywords: ['textiles', 'cotton fabric', 'woven cotton', 'cotton cloth'],
    alternatives: [
      { hsCode: '5208.11', description: 'Cotton fabric - plain weave, <=100g/m2' },
      { hsCode: '5208.12', description: 'Cotton fabric - plain weave, >100g/m2' },
      { hsCode: '5208.21', description: 'Cotton fabric - bleached, plain weave' },
    ],
  },
  {
    hsCode: '2844',
    description: 'Radioactive chemical elements',
    keywords: ['uranium', 'radioactive', 'nuclear material', 'plutonium', 'thorium'],
    alternatives: [
      { hsCode: '2844.10', description: 'Natural uranium' },
      { hsCode: '2844.20', description: 'Enriched uranium and plutonium' },
      { hsCode: '2844.40', description: 'Radioactive elements - other' },
    ],
  },
  {
    hsCode: '3105',
    description: 'Mineral or chemical fertilisers with N, P, K',
    keywords: ['npk', 'dap', 'complex fertilizer', 'compound fertilizer', 'npk fertilizer'],
    alternatives: [
      { hsCode: '3105.10', description: 'Fertiliser tablets or similar forms' },
      { hsCode: '3105.20', description: 'NPK fertiliser' },
      { hsCode: '3105.30', description: 'Diammonium phosphate (DAP)' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constants — HS chapter descriptions
// ---------------------------------------------------------------------------

const HS_CHAPTER_DESCRIPTIONS: Record<string, string> = {
  '01': 'Live animals',
  '02': 'Meat and edible meat offal',
  '03': 'Fish and crustaceans, molluscs',
  '04': 'Dairy produce; birds\' eggs; natural honey',
  '05': 'Products of animal origin, not elsewhere specified',
  '06': 'Live trees and other plants; bulbs, roots; cut flowers',
  '07': 'Edible vegetables and certain roots and tubers',
  '08': 'Edible fruit and nuts; peel of citrus fruit or melons',
  '09': 'Coffee, tea, mate and spices',
  '10': 'Cereals',
  '11': 'Products of the milling industry; malt; starches',
  '12': 'Oil seeds and oleaginous fruits; miscellaneous grains',
  '13': 'Lac; gums, resins and other vegetable saps and extracts',
  '14': 'Vegetable plaiting materials; vegetable products n.e.s.',
  '15': 'Animal or vegetable fats and oils; prepared edible fats',
  '16': 'Preparations of meat, fish or crustaceans',
  '17': 'Sugars and sugar confectionery',
  '18': 'Cocoa and cocoa preparations',
  '19': 'Preparations of cereals, flour, starch or milk',
  '20': 'Preparations of vegetables, fruit, nuts',
  '21': 'Miscellaneous edible preparations',
  '22': 'Beverages, spirits and vinegar',
  '23': 'Residues and waste from the food industries; prepared animal fodder',
  '24': 'Tobacco and manufactured tobacco substitutes',
  '25': 'Salt; sulphur; earths and stone; plastering materials, lime and cement',
  '26': 'Ores, slag and ash',
  '27': 'Mineral fuels, mineral oils; bituminous substances; mineral waxes',
  '28': 'Inorganic chemicals; compounds of precious metals, rare-earth metals',
  '29': 'Organic chemicals',
  '30': 'Pharmaceutical products',
  '31': 'Fertilisers',
  '32': 'Tanning or dyeing extracts; tannins; pigments; paints; putty',
  '33': 'Essential oils and resinoids; perfumery, cosmetic preparations',
  '34': 'Soap, washing preparations; lubricating preparations; waxes',
  '35': 'Albuminoidal substances; modified starches; glues; enzymes',
  '36': 'Explosives; pyrotechnic products; matches; pyrophoric alloys',
  '37': 'Photographic or cinematographic goods',
  '38': 'Miscellaneous chemical products',
  '39': 'Plastics and articles thereof',
  '40': 'Rubber and articles thereof',
  '41': 'Raw hides and skins (other than furskins) and leather',
  '42': 'Articles of leather; saddlery and harness; travel goods',
  '43': 'Furskins and artificial fur; manufactures thereof',
  '44': 'Wood and articles of wood; wood charcoal',
  '45': 'Cork and articles of cork',
  '46': 'Manufactures of straw, esparto or other plaiting materials',
  '47': 'Pulp of wood or of other fibrous cellulosic material',
  '48': 'Paper and paperboard; articles of paper pulp',
  '49': 'Printed books, newspapers, pictures; manuscripts, typescripts',
  '50': 'Silk',
  '51': 'Wool, fine or coarse animal hair; horsehair yarn and fabric',
  '52': 'Cotton',
  '53': 'Other vegetable textile fibres; paper yarn and woven fabrics',
  '54': 'Man-made filaments; strip of man-made textile materials',
  '55': 'Man-made staple fibres',
  '56': 'Wadding, felt and nonwovens; special yarns; twine, cordage',
  '57': 'Carpets and other textile floor coverings',
  '58': 'Special woven fabrics; tufted textile fabrics; lace; tapestries',
  '59': 'Impregnated, coated, covered or laminated textile fabrics',
  '60': 'Knitted or crocheted fabrics',
  '61': 'Articles of apparel and clothing accessories, knitted or crocheted',
  '62': 'Articles of apparel and clothing accessories, not knitted',
  '63': 'Other made up textile articles; sets; worn clothing; rags',
  '64': 'Footwear, gaiters and the like; parts of such articles',
  '65': 'Headgear and parts thereof',
  '66': 'Umbrellas, walking sticks, seat-sticks, whips, riding-crops',
  '67': 'Prepared feathers and down; artificial flowers',
  '68': 'Articles of stone, plaster, cement, asbestos, mica',
  '69': 'Ceramic products',
  '70': 'Glass and glassware',
  '71': 'Natural or cultured pearls, precious stones, precious metals',
  '72': 'Iron and steel',
  '73': 'Articles of iron or steel',
  '74': 'Copper and articles thereof',
  '75': 'Nickel and articles thereof',
  '76': 'Aluminium and articles thereof',
  '78': 'Lead and articles thereof',
  '79': 'Zinc and articles thereof',
  '80': 'Tin and articles thereof',
  '81': 'Other base metals; cermets; articles thereof',
  '82': 'Tools, implements, cutlery, spoons and forks, of base metal',
  '83': 'Miscellaneous articles of base metal',
  '84': 'Nuclear reactors, boilers, machinery and mechanical appliances',
  '85': 'Electrical machinery and equipment; sound recorders; TV',
  '86': 'Railway or tramway locomotives, rolling stock; track fixtures',
  '87': 'Vehicles other than railway or tramway rolling stock',
  '88': 'Aircraft, spacecraft, and parts thereof',
  '89': 'Ships, boats and floating structures',
  '90': 'Optical, photographic, measuring, checking, medical instruments',
  '91': 'Clocks and watches and parts thereof',
  '92': 'Musical instruments; parts and accessories thereof',
  '93': 'Arms and ammunition; parts and accessories thereof',
  '94': 'Furniture; bedding, mattresses, cushions; lamps; prefab buildings',
  '95': 'Toys, games and sports requisites; parts and accessories',
  '96': 'Miscellaneous manufactured articles',
  '97': 'Works of art, collectors\' pieces and antiques',
  '98': 'Project imports; laboratory chemicals; passengers\' baggage',
  '99': 'Miscellaneous goods (postal, stores, special transactions)',
};

// ---------------------------------------------------------------------------
// Constants — related codes within same heading
// ---------------------------------------------------------------------------

const RELATED_CODES_MAP: Record<string, string[]> = {
  '2709': ['2709.00.10', '2709.00.20', '2710.12', '2710.19'],
  '2601': ['2601.11', '2601.12', '2601.20'],
  '2701': ['2701.11', '2701.12', '2701.19', '2701.20'],
  '1001': ['1001.11', '1001.19', '1001.91', '1001.99'],
  '1006': ['1006.10', '1006.20', '1006.30', '1006.40'],
  '7208': ['7208.10', '7208.25', '7208.26', '7208.27', '7208.36', '7208.37', '7208.38', '7208.39'],
  '2711': ['2711.11', '2711.12', '2711.13', '2711.14', '2711.19', '2711.21', '2711.29'],
  '7403': ['7403.11', '7403.12', '7403.13', '7403.19', '7403.21', '7403.22', '7403.29'],
  '7601': ['7601.10', '7601.20'],
  '7901': ['7901.11', '7901.12', '7901.20'],
  '8703': ['8703.10', '8703.21', '8703.22', '8703.23', '8703.24', '8703.31', '8703.32', '8703.33', '8703.80'],
  '8471': ['8471.30', '8471.41', '8471.49', '8471.50', '8471.60', '8471.70', '8471.80'],
  '2523': ['2523.10', '2523.21', '2523.29', '2523.30', '2523.90'],
  '1511': ['1511.10', '1511.90'],
  '1201': ['1201.10', '1201.90'],
  '1005': ['1005.10', '1005.90'],
  '5208': ['5208.11', '5208.12', '5208.13', '5208.19', '5208.21', '5208.22', '5208.23', '5208.29'],
  '2710': ['2710.12', '2710.19', '2710.20', '2710.91', '2710.99'],
  '3102': ['3102.10', '3102.21', '3102.29', '3102.30', '3102.40', '3102.50', '3102.60', '3102.80', '3102.90'],
};

// ---------------------------------------------------------------------------
// Constants — restricted items
// ---------------------------------------------------------------------------

interface RestrictionEntry {
  chapterPrefix: string;
  direction: 'import' | 'export' | 'both';
  reason: string;
  licenseRequired: boolean;
}

const RESTRICTED_ITEMS: RestrictionEntry[] = [
  { chapterPrefix: '93', direction: 'both', reason: 'Arms and ammunition — restricted under Arms Act', licenseRequired: true },
  { chapterPrefix: '2844', direction: 'both', reason: 'Radioactive materials — restricted under Atomic Energy Act', licenseRequired: true },
  { chapterPrefix: '2922', direction: 'both', reason: 'Drug precursor chemicals — controlled under NDPS Act', licenseRequired: true },
  { chapterPrefix: '2939', direction: 'import', reason: 'Alkaloids (including narcotic) — controlled substance', licenseRequired: true },
  { chapterPrefix: '0106', direction: 'both', reason: 'Live animals (CITES-listed species) — requires DGFT license', licenseRequired: true },
  { chapterPrefix: '9705', direction: 'export', reason: 'Antiques over 100 years old — export restricted under Antiquities Act', licenseRequired: true },
  { chapterPrefix: '2612', direction: 'export', reason: 'Uranium or thorium ores — restricted under Atomic Energy Act', licenseRequired: true },
  { chapterPrefix: '1211', direction: 'import', reason: 'Plants used in drugs/perfumery — may require phytosanitary certificate', licenseRequired: false },
  { chapterPrefix: '3601', direction: 'both', reason: 'Propellent powders — restricted under Explosives Act', licenseRequired: true },
  { chapterPrefix: '3602', direction: 'both', reason: 'Prepared explosives — restricted under Explosives Act', licenseRequired: true },
  { chapterPrefix: '3603', direction: 'both', reason: 'Detonators and fuses — restricted under Explosives Act', licenseRequired: true },
  { chapterPrefix: '8710', direction: 'both', reason: 'Tanks and armoured fighting vehicles — defence article', licenseRequired: true },
  { chapterPrefix: '8906', direction: 'both', reason: 'Warships — defence article', licenseRequired: true },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function extractChapter(hsCode: string): string {
  const clean = hsCode.replace(/[\s.]/g, '');
  return clean.substring(0, 2).padStart(2, '0');
}

function extractHeading(hsCode: string): string {
  const clean = hsCode.replace(/[\s.]/g, '');
  return clean.substring(0, 4).padStart(4, '0');
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Classify a cargo description to the most likely HS code using keyword matching.
 * Returns the best match with confidence score and alternatives.
 */
export function classifyCargoToHS(description: string): HSClassification {
  const normalized = normalizeText(description);
  const words = normalized.split(/\s+/);

  interface ScoredMatch {
    mapping: CargoMapping;
    score: number;
  }

  const scored: ScoredMatch[] = [];

  for (const mapping of CARGO_HS_MAP) {
    let bestKeywordScore = 0;

    for (const keyword of mapping.keywords) {
      const kwNorm = normalizeText(keyword);
      const kwWords = kwNorm.split(/\s+/);

      // Exact full-phrase match
      if (normalized.includes(kwNorm)) {
        const phraseScore = kwWords.length / Math.max(words.length, 1);
        // Boost multi-word phrase matches
        const multiWordBonus = kwWords.length > 1 ? 0.2 : 0;
        bestKeywordScore = Math.max(bestKeywordScore, Math.min(phraseScore + 0.5 + multiWordBonus, 1.0));
        continue;
      }

      // Partial word matching
      let matchedWords = 0;
      for (const kw of kwWords) {
        if (words.some(w => w === kw || w.includes(kw) || kw.includes(w))) {
          matchedWords++;
        }
      }

      if (matchedWords > 0) {
        const partialScore = (matchedWords / kwWords.length) * 0.4;
        bestKeywordScore = Math.max(bestKeywordScore, partialScore);
      }
    }

    if (bestKeywordScore > 0) {
      scored.push({ mapping, score: bestKeywordScore });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      hsCode: '9999',
      confidence: 0,
      description: 'Unclassified — no matching keywords found',
      alternatives: [],
    };
  }

  const best = scored[0];
  const alternatives: HSAlternative[] = scored
    .slice(1, 4)
    .filter(s => s.score > 0.1)
    .map(s => ({
      hsCode: s.mapping.hsCode,
      confidence: Math.round(s.score * 100) / 100,
      description: s.mapping.description,
    }));

  // Add sub-code alternatives from the best match
  if (best.mapping.alternatives) {
    for (const alt of best.mapping.alternatives) {
      alternatives.push({
        hsCode: alt.hsCode,
        confidence: Math.round(best.score * 0.9 * 100) / 100,
        description: alt.description,
      });
    }
  }

  return {
    hsCode: best.mapping.hsCode,
    confidence: Math.round(best.score * 100) / 100,
    description: best.mapping.description,
    alternatives,
  };
}

/**
 * Get the HS chapter description by chapter number (2 digits).
 * Accepts either a 2-digit chapter string or a full HS code (extracts chapter).
 */
export function getHSChapterDescription(chapter: string): string {
  const ch = chapter.length > 2 ? extractChapter(chapter) : chapter.padStart(2, '0');
  return HS_CHAPTER_DESCRIPTIONS[ch] ?? `Unknown chapter ${ch}`;
}

/**
 * Validate HS code structure and determine its classification level.
 *
 * - 2 digits: chapter
 * - 4 digits: heading
 * - 6 digits: subheading
 * - 8 digits: tariff item (India uses 8-digit codes)
 */
export function validateHSCode(code: string): HSValidation {
  // Strip dots, spaces, dashes for validation
  const clean = code.replace(/[\s.\-]/g, '');

  // Must be numeric
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, level: 'invalid', formatted: code };
  }

  // Must be 2, 4, 6, or 8 digits
  const len = clean.length;
  if (len !== 2 && len !== 4 && len !== 6 && len !== 8) {
    return { isValid: false, level: 'invalid', formatted: code };
  }

  // Chapter must be 01-99
  const chapterNum = parseInt(clean.substring(0, 2), 10);
  if (chapterNum < 1 || chapterNum > 99) {
    return { isValid: false, level: 'invalid', formatted: code };
  }

  let level: string;
  let formatted: string;

  switch (len) {
    case 2:
      level = 'chapter';
      formatted = clean;
      break;
    case 4:
      level = 'heading';
      formatted = `${clean.substring(0, 2)}.${clean.substring(2, 4)}`;
      break;
    case 6:
      level = 'subheading';
      formatted = `${clean.substring(0, 4)}.${clean.substring(4, 6)}`;
      break;
    case 8:
      level = 'tariff_item';
      formatted = `${clean.substring(0, 4)}.${clean.substring(4, 6)}.${clean.substring(6, 8)}`;
      break;
    default:
      level = 'invalid';
      formatted = code;
  }

  return { isValid: true, level, formatted };
}

/**
 * Suggest related HS codes within the same heading.
 * Useful for exploring nearby classifications.
 */
export function suggestRelatedCodes(hsCode: string): string[] {
  const clean = hsCode.replace(/[\s.\-]/g, '');
  const heading = clean.length >= 4 ? clean.substring(0, 4) : clean.padEnd(4, '0');

  // Check direct match
  if (RELATED_CODES_MAP[heading]) {
    return RELATED_CODES_MAP[heading];
  }

  // Check if the full clean code matches a key
  if (RELATED_CODES_MAP[clean]) {
    return RELATED_CODES_MAP[clean];
  }

  // Generate plausible subcodes for the heading
  const generated: string[] = [];
  for (let i = 10; i <= 90; i += 10) {
    generated.push(`${heading}.${i.toString().padStart(2, '0')}`);
  }
  return generated;
}

/**
 * Check if a cargo HS code is restricted for import or export in India.
 * Returns restriction status and licensing requirements.
 */
export function isRestrictedCargo(
  hsCode: string,
  direction: 'import' | 'export',
): RestrictionResult {
  const clean = hsCode.replace(/[\s.\-]/g, '');

  for (const entry of RESTRICTED_ITEMS) {
    const prefix = entry.chapterPrefix.replace(/[\s.\-]/g, '');

    if (clean.startsWith(prefix)) {
      if (entry.direction === 'both' || entry.direction === direction) {
        return {
          restricted: true,
          reason: entry.reason,
          licenseRequired: entry.licenseRequired,
        };
      }
    }
  }

  return {
    restricted: false,
    licenseRequired: false,
  };
}
