// ankrICD Configuration Presets

import type { ICDFeatureFlags } from './feature-flags';
import { DEFAULT_FEATURE_FLAGS } from './feature-flags';

export type ICDPresetType =
  | 'FULL_ICD'             // Full-featured ICD
  | 'BASIC_ICD'            // Basic ICD without advanced features
  | 'CFS_ONLY'             // Container Freight Station only
  | 'RAIL_TERMINAL'        // Rail-focused terminal
  | 'PORT_TERMINAL'        // Waterfront/port terminal
  | 'DRY_PORT'             // Inland dry port
  | 'MULTI_MODAL'          // Full multimodal facility
  | 'STARTER';             // Minimal starter config

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

export const ICD_PRESETS: Record<ICDPresetType, Partial<ICDFeatureFlags>> = {
  // Full-featured ICD with all capabilities
  FULL_ICD: {
    ...DEFAULT_FEATURE_FLAGS,
    portOperations: false,
    berthPlanning: false,
    vesselOperations: false,
    cranePlanning: false,
    stowPlanning: false,
    vesselTracking: false,
  },

  // Basic ICD without advanced AI/automation
  BASIC_ICD: {
    ...DEFAULT_FEATURE_FLAGS,
    // Disable port
    portOperations: false,
    berthPlanning: false,
    vesselOperations: false,
    cranePlanning: false,
    stowPlanning: false,
    vesselTracking: false,
    // Disable advanced features
    aiYardOptimization: false,
    yardVisualization3D: false,
    predictiveAnalytics: false,
    // Disable automation
    automatedGate: false,
    ocrIntegration: false,
    rfidIntegration: false,
  },

  // CFS-only configuration
  CFS_ONLY: {
    ...DEFAULT_FEATURE_FLAGS,
    // Disable ICD-specific
    icdOperations: false,
    railTerminal: false,
    portOperations: false,
    dryPort: false,
    // Disable rail
    rakeManagement: false,
    wagonPlanning: false,
    railYardVisualization: false,
    railManifestProcessing: false,
    intermodalCoordination: false,
    // Disable port
    berthPlanning: false,
    vesselOperations: false,
    cranePlanning: false,
    stowPlanning: false,
    vesselTracking: false,
    // Keep CFS enabled
    cfsOperations: true,
    advancedYardPlanning: true,
  },

  // Rail-focused terminal
  RAIL_TERMINAL: {
    ...DEFAULT_FEATURE_FLAGS,
    // Disable port
    portOperations: false,
    berthPlanning: false,
    vesselOperations: false,
    cranePlanning: false,
    stowPlanning: false,
    vesselTracking: false,
    // Minimal CFS
    cfsOperations: false,
    // Enable all rail features
    railTerminal: true,
    rakeManagement: true,
    wagonPlanning: true,
    railYardVisualization: true,
    railManifestProcessing: true,
    intermodalCoordination: true,
  },

  // Port/waterfront terminal
  PORT_TERMINAL: {
    ...DEFAULT_FEATURE_FLAGS,
    // Enable port
    portOperations: true,
    berthPlanning: true,
    vesselOperations: true,
    cranePlanning: true,
    stowPlanning: true,
    vesselTracking: true,
    // Disable rail (unless multimodal)
    railTerminal: false,
    rakeManagement: false,
    wagonPlanning: false,
    railYardVisualization: false,
    railManifestProcessing: false,
    intermodalCoordination: false,
  },

  // Inland dry port
  DRY_PORT: {
    ...DEFAULT_FEATURE_FLAGS,
    // Disable waterfront
    portOperations: false,
    berthPlanning: false,
    vesselOperations: false,
    cranePlanning: false,
    stowPlanning: false,
    vesselTracking: false,
    // Enable rail and road
    railTerminal: true,
    intermodalCoordination: true,
    // Enable customs
    icegateIntegration: true,
    boeProcessing: true,
    sbProcessing: true,
  },

  // Full multimodal facility
  MULTI_MODAL: {
    ...DEFAULT_FEATURE_FLAGS,
    // All modes enabled
    icdOperations: true,
    cfsOperations: true,
    railTerminal: true,
    portOperations: true,
    // All advanced features
    aiYardOptimization: true,
    yardVisualization3D: true,
    predictiveAnalytics: true,
    intermodalCoordination: true,
  },

  // Minimal starter configuration
  STARTER: {
    // Core only
    multipleDepots: false,
    multipleTenants: false,
    icdOperations: true,
    cfsOperations: false,
    railTerminal: false,
    portOperations: false,
    dryPort: false,

    // Basic container
    reeferManagement: true,
    hazmatHandling: false,
    overweightContainers: false,
    oversizeContainers: false,
    emptyContainerManagement: true,
    realTimeTracking: true,
    containerHistory: true,
    vgmCapture: false,

    // Basic yard
    advancedYardPlanning: false,
    aiYardOptimization: false,
    restackOptimization: false,
    dwellTimeOptimization: false,
    yardVisualization2D: true,
    yardVisualization3D: false,
    yardHeatMaps: false,
    zoneManagement: true,
    reeferZone: true,
    hazmatZone: false,
    examinationZone: true,
    bondedZone: false,

    // Manual gate
    automatedGate: false,
    ocrIntegration: false,
    rfidIntegration: false,
    weighbridgeIntegration: true,
    photoCapture: true,
    appointmentScheduling: true,
    appointmentNotifications: true,
    gateQueueManagement: false,

    // No rail
    rakeManagement: false,
    wagonPlanning: false,
    railYardVisualization: false,
    railManifestProcessing: false,
    intermodalCoordination: false,

    // No waterfront
    berthPlanning: false,
    vesselOperations: false,
    cranePlanning: false,
    stowPlanning: false,
    vesselTracking: false,

    // Basic equipment
    equipmentTelematics: false,
    gpsTracking: false,
    fuelMonitoring: false,
    preventiveMaintenance: true,
    preShiftChecklists: true,
    maintenanceAlerts: true,
    workOrderOptimization: false,
    equipmentUtilizationReports: true,

    // Basic billing
    automatedBilling: true,
    tariffManagement: true,
    multiCurrency: false,
    demurrageManagement: true,
    demurrageAlerts: true,
    autoInvoicing: false,
    onlinePayments: false,
    creditManagement: true,

    // Basic customs
    icegateIntegration: true,
    boeProcessing: true,
    sbProcessing: true,
    igmProcessing: true,
    eWayBillIntegration: true,
    examinationManagement: true,
    holdManagement: true,

    // No EDI
    ediIntegration: false,
    edifactSupport: false,
    x12Support: false,

    // Basic notifications
    smsNotifications: true,
    emailNotifications: true,
    whatsappNotifications: false,
    pushNotifications: false,
    shippingLineIntegration: false,
    freightForwarderPortal: false,

    // Basic analytics
    realTimeDashboard: true,
    executiveDashboard: false,
    operationalReports: true,
    financialReports: true,
    complianceReports: true,
    predictiveAnalytics: false,
    customReports: false,

    // No mobile
    mobileOperations: false,
    mobileGateApp: false,
    mobileYardApp: false,
    mobileEquipmentApp: false,
    customerMobileApp: false,

    // No portals
    customerPortal: false,
    chaPortal: false,
    transporterPortal: false,
    vendorPortal: false,
  },
};

// ============================================================================
// PRESET FUNCTIONS
// ============================================================================

/**
 * Get feature flags for a preset
 */
export function getPresetConfig(preset: ICDPresetType): ICDFeatureFlags {
  const presetConfig = ICD_PRESETS[preset];
  return { ...DEFAULT_FEATURE_FLAGS, ...presetConfig };
}

/**
 * Create custom config from a preset with overrides
 */
export function createCustomConfig(
  basePreset: ICDPresetType,
  overrides: Partial<ICDFeatureFlags>
): ICDFeatureFlags {
  const presetConfig = getPresetConfig(basePreset);
  return { ...presetConfig, ...overrides };
}

/**
 * Get preset name from feature flags (best match)
 */
export function detectPreset(flags: ICDFeatureFlags): ICDPresetType | null {
  // Check for exact matches
  for (const [preset, config] of Object.entries(ICD_PRESETS)) {
    const presetFlags = { ...DEFAULT_FEATURE_FLAGS, ...config };
    const isMatch = Object.keys(presetFlags).every(
      (key) => flags[key as keyof ICDFeatureFlags] === presetFlags[key as keyof ICDFeatureFlags]
    );
    if (isMatch) {
      return preset as ICDPresetType;
    }
  }
  return null;
}

/**
 * Get recommended preset based on facility requirements
 */
export function recommendPreset(requirements: {
  hasRail: boolean;
  hasWaterfront: boolean;
  hasCFS: boolean;
  isMultiTenant: boolean;
  wantsAutomation: boolean;
}): ICDPresetType {
  if (requirements.hasRail && requirements.hasWaterfront) {
    return 'MULTI_MODAL';
  }
  if (requirements.hasWaterfront) {
    return 'PORT_TERMINAL';
  }
  if (requirements.hasRail && !requirements.hasCFS) {
    return 'RAIL_TERMINAL';
  }
  if (requirements.hasCFS && !requirements.hasRail) {
    return 'CFS_ONLY';
  }
  if (requirements.wantsAutomation) {
    return 'FULL_ICD';
  }
  if (requirements.isMultiTenant) {
    return 'BASIC_ICD';
  }
  return 'STARTER';
}
