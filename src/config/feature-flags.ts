// ankrICD Feature Flags - 60+ Feature Toggles

export interface ICDFeatureFlags {
  // ============================================================================
  // CORE FEATURES
  // ============================================================================

  // Multi-facility
  multipleDepots: boolean;
  multipleTenants: boolean;

  // Facility types
  icdOperations: boolean;
  cfsOperations: boolean;
  railTerminal: boolean;
  portOperations: boolean;
  dryPort: boolean;

  // ============================================================================
  // CONTAINER FEATURES
  // ============================================================================

  // Container types
  reeferManagement: boolean;
  hazmatHandling: boolean;
  overweightContainers: boolean;
  oversizeContainers: boolean;  // OOG
  emptyContainerManagement: boolean;

  // Container tracking
  realTimeTracking: boolean;
  containerHistory: boolean;
  vgmCapture: boolean;

  // ============================================================================
  // YARD FEATURES
  // ============================================================================

  // Planning
  advancedYardPlanning: boolean;
  aiYardOptimization: boolean;
  restackOptimization: boolean;
  dwellTimeOptimization: boolean;

  // Visualization
  yardVisualization2D: boolean;
  yardVisualization3D: boolean;
  yardHeatMaps: boolean;

  // Zones
  zoneManagement: boolean;
  reeferZone: boolean;
  hazmatZone: boolean;
  examinationZone: boolean;
  bondedZone: boolean;

  // ============================================================================
  // GATE FEATURES
  // ============================================================================

  // Automation
  automatedGate: boolean;
  ocrIntegration: boolean;
  rfidIntegration: boolean;
  weighbridgeIntegration: boolean;
  photoCapture: boolean;

  // Appointments
  appointmentScheduling: boolean;
  appointmentNotifications: boolean;
  gateQueueManagement: boolean;

  // ============================================================================
  // RAIL FEATURES
  // ============================================================================

  rakeManagement: boolean;
  wagonPlanning: boolean;
  railYardVisualization: boolean;
  railManifestProcessing: boolean;
  intermodalCoordination: boolean;

  // ============================================================================
  // WATERFRONT FEATURES
  // ============================================================================

  berthPlanning: boolean;
  vesselOperations: boolean;
  cranePlanning: boolean;
  stowPlanning: boolean;
  vesselTracking: boolean;

  // ============================================================================
  // EQUIPMENT FEATURES
  // ============================================================================

  // Tracking
  equipmentTelematics: boolean;
  gpsTracking: boolean;
  fuelMonitoring: boolean;

  // Maintenance
  preventiveMaintenance: boolean;
  preShiftChecklists: boolean;
  maintenanceAlerts: boolean;

  // Optimization
  workOrderOptimization: boolean;
  equipmentUtilizationReports: boolean;

  // ============================================================================
  // BILLING FEATURES
  // ============================================================================

  // Core billing
  automatedBilling: boolean;
  tariffManagement: boolean;
  multiCurrency: boolean;

  // Demurrage
  demurrageManagement: boolean;
  demurrageAlerts: boolean;
  autoInvoicing: boolean;

  // Payments
  onlinePayments: boolean;
  creditManagement: boolean;

  // ============================================================================
  // CUSTOMS FEATURES
  // ============================================================================

  // ICEGATE
  icegateIntegration: boolean;
  boeProcessing: boolean;
  sbProcessing: boolean;
  igmProcessing: boolean;

  // Compliance
  eWayBillIntegration: boolean;
  examinationManagement: boolean;
  holdManagement: boolean;

  // ============================================================================
  // INTEGRATION FEATURES
  // ============================================================================

  // EDI
  ediIntegration: boolean;
  edifactSupport: boolean;
  x12Support: boolean;

  // Notifications
  smsNotifications: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  pushNotifications: boolean;

  // External systems
  shippingLineIntegration: boolean;
  freightForwarderPortal: boolean;

  // ============================================================================
  // ANALYTICS FEATURES
  // ============================================================================

  // Dashboards
  realTimeDashboard: boolean;
  executiveDashboard: boolean;

  // Reports
  operationalReports: boolean;
  financialReports: boolean;
  complianceReports: boolean;

  // Advanced
  predictiveAnalytics: boolean;
  customReports: boolean;

  // ============================================================================
  // MOBILE FEATURES
  // ============================================================================

  mobileOperations: boolean;
  mobileGateApp: boolean;
  mobileYardApp: boolean;
  mobileEquipmentApp: boolean;
  customerMobileApp: boolean;

  // ============================================================================
  // PORTAL FEATURES
  // ============================================================================

  customerPortal: boolean;
  chaPortal: boolean;           // Customs House Agent
  transporterPortal: boolean;
  vendorPortal: boolean;
}

// Default feature flags - all enabled for full functionality
export const DEFAULT_FEATURE_FLAGS: ICDFeatureFlags = {
  // Core
  multipleDepots: true,
  multipleTenants: true,
  icdOperations: true,
  cfsOperations: true,
  railTerminal: true,
  portOperations: true,
  dryPort: true,

  // Container
  reeferManagement: true,
  hazmatHandling: true,
  overweightContainers: true,
  oversizeContainers: true,
  emptyContainerManagement: true,
  realTimeTracking: true,
  containerHistory: true,
  vgmCapture: true,

  // Yard
  advancedYardPlanning: true,
  aiYardOptimization: true,
  restackOptimization: true,
  dwellTimeOptimization: true,
  yardVisualization2D: true,
  yardVisualization3D: true,
  yardHeatMaps: true,
  zoneManagement: true,
  reeferZone: true,
  hazmatZone: true,
  examinationZone: true,
  bondedZone: true,

  // Gate
  automatedGate: true,
  ocrIntegration: true,
  rfidIntegration: true,
  weighbridgeIntegration: true,
  photoCapture: true,
  appointmentScheduling: true,
  appointmentNotifications: true,
  gateQueueManagement: true,

  // Rail
  rakeManagement: true,
  wagonPlanning: true,
  railYardVisualization: true,
  railManifestProcessing: true,
  intermodalCoordination: true,

  // Waterfront
  berthPlanning: true,
  vesselOperations: true,
  cranePlanning: true,
  stowPlanning: true,
  vesselTracking: true,

  // Equipment
  equipmentTelematics: true,
  gpsTracking: true,
  fuelMonitoring: true,
  preventiveMaintenance: true,
  preShiftChecklists: true,
  maintenanceAlerts: true,
  workOrderOptimization: true,
  equipmentUtilizationReports: true,

  // Billing
  automatedBilling: true,
  tariffManagement: true,
  multiCurrency: true,
  demurrageManagement: true,
  demurrageAlerts: true,
  autoInvoicing: true,
  onlinePayments: true,
  creditManagement: true,

  // Customs
  icegateIntegration: true,
  boeProcessing: true,
  sbProcessing: true,
  igmProcessing: true,
  eWayBillIntegration: true,
  examinationManagement: true,
  holdManagement: true,

  // Integration
  ediIntegration: true,
  edifactSupport: true,
  x12Support: true,
  smsNotifications: true,
  emailNotifications: true,
  whatsappNotifications: true,
  pushNotifications: true,
  shippingLineIntegration: true,
  freightForwarderPortal: true,
  transporterPortal: true,

  // Analytics
  realTimeDashboard: true,
  executiveDashboard: true,
  operationalReports: true,
  financialReports: true,
  complianceReports: true,
  predictiveAnalytics: true,
  customReports: true,

  // Mobile
  mobileOperations: true,
  mobileGateApp: true,
  mobileYardApp: true,
  mobileEquipmentApp: true,
  customerMobileApp: true,

  // Portal
  customerPortal: true,
  chaPortal: true,
  vendorPortal: true,
};

// Feature flag checker
export function isFeatureEnabled(
  flags: ICDFeatureFlags,
  feature: keyof ICDFeatureFlags
): boolean {
  return flags[feature] === true;
}

// Check multiple features
export function areFeaturesEnabled(
  flags: ICDFeatureFlags,
  features: (keyof ICDFeatureFlags)[]
): boolean {
  return features.every((feature) => isFeatureEnabled(flags, feature));
}

// Merge feature flags
export function mergeFeatureFlags(
  base: ICDFeatureFlags,
  overrides: Partial<ICDFeatureFlags>
): ICDFeatureFlags {
  return { ...base, ...overrides };
}

// Get enabled features list
export function getEnabledFeatures(flags: ICDFeatureFlags): string[] {
  return Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);
}

// Get disabled features list
export function getDisabledFeatures(flags: ICDFeatureFlags): string[] {
  return Object.entries(flags)
    .filter(([, enabled]) => !enabled)
    .map(([feature]) => feature);
}
