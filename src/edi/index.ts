// Advanced EDI & Integration Exports
export {
  EDIEngine,
  getEDIEngine,
  setEDIEngine,
  type RegisterPartnerInput,
  type CreateTransactionInput,
  type ParseInboundInput,
  type GenerateOutboundInput,
  type AddValidationRuleInput,
  type EnqueueInput,
  type CreateFieldMappingInput,
} from './edi-engine';

// Re-export EDI types
export type {
  TradingPartner,
  TradingPartnerStatus,
  EDIFormat,
  EDITransport,
  EDITransaction,
  EDITransactionType,
  EDITransactionStatus,
  EDIError,
  EDIValidationRule,
  EDIValidationResult,
  EDIQueueItem,
  EDIQueueItemStatus,
  EDIFieldMapping,
  EDIStats,
} from '../types/edi';
