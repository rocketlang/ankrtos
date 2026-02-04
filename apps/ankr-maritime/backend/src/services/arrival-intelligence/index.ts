/**
 * Arrival Intelligence System - Exports
 *
 * Main entry point for all arrival intelligence services.
 * Part of the Agent Wedge Strategy (Mari8X Phase 1).
 */

export { ProximityDetectorService } from './proximity-detector.service';
export { DocumentCheckerService, STANDARD_DOCUMENTS } from './document-checker.service';
export { DAForecastService } from './da-forecast.service';
export { PortCongestionAnalyzerService } from './port-congestion-analyzer.service';
export { ArrivalIntelligenceService } from './arrival-intelligence.service';

// Types
export type { ProximityDetectionResult } from './proximity-detector.service';
export type { DocumentCheckResult } from './document-checker.service';
export type { DAForecast, DABreakdown } from './da-forecast.service';
