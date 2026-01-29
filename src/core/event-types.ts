// ankrICD Event Types - 150+ Event Definitions

// ============================================================================
// CONTAINER EVENTS
// ============================================================================

export type ContainerEventType =
  // Lifecycle
  | 'container.registered'
  | 'container.updated'
  | 'container.deleted'

  // Arrival
  | 'container.announced'
  | 'container.arrived'
  | 'container.pre_advised'

  // Gate operations
  | 'container.gate_in_started'
  | 'container.gated_in'
  | 'container.gate_out_started'
  | 'container.gated_out'

  // Yard operations
  | 'container.grounded'
  | 'container.picked'
  | 'container.moved'
  | 'container.restacked'
  | 'container.transferred'

  // Special handling
  | 'container.stuffing_started'
  | 'container.stuffing_completed'
  | 'container.destuffing_started'
  | 'container.destuffing_completed'

  // Loading/Unloading
  | 'container.loaded_truck'
  | 'container.unloaded_truck'
  | 'container.loaded_rail'
  | 'container.unloaded_rail'
  | 'container.loaded_vessel'
  | 'container.unloaded_vessel'

  // Status changes
  | 'container.status_changed'
  | 'container.condition_changed'

  // Holds
  | 'container.hold_placed'
  | 'container.hold_released'

  // Reefer
  | 'container.reefer_plugged'
  | 'container.reefer_unplugged'
  | 'container.reefer_temp_alert'
  | 'container.reefer_temp_normal'

  // Inspection
  | 'container.inspection_started'
  | 'container.inspection_completed'
  | 'container.damage_reported'
  | 'container.repair_started'
  | 'container.repair_completed'

  // Departure
  | 'container.departed'
  | 'container.released';

// ============================================================================
// YARD EVENTS
// ============================================================================

export type YardEventType =
  // Slot management
  | 'yard.slot_reserved'
  | 'yard.slot_released'
  | 'yard.slot_occupied'
  | 'yard.slot_vacated'
  | 'yard.slot_blocked'
  | 'yard.slot_unblocked'

  // Planning
  | 'yard.plan_created'
  | 'yard.plan_approved'
  | 'yard.plan_started'
  | 'yard.plan_completed'
  | 'yard.plan_cancelled'

  // Restacking
  | 'yard.restack_planned'
  | 'yard.restack_started'
  | 'yard.restack_completed'
  | 'yard.restack_cancelled'

  // Alerts
  | 'yard.congestion_alert'
  | 'yard.capacity_warning'
  | 'yard.capacity_critical'
  | 'yard.occupancy_changed'

  // Work orders
  | 'yard.work_order_created'
  | 'yard.work_order_assigned'
  | 'yard.work_order_started'
  | 'yard.work_order_completed'
  | 'yard.work_order_cancelled'
  | 'yard.work_order_failed';

// ============================================================================
// GATE EVENTS
// ============================================================================

export type GateEventType =
  // Gate configuration
  | 'gate.registered'
  | 'gate.updated'
  | 'gate.lane_status_changed'

  // Truck arrival
  | 'gate.truck_arrived'
  | 'gate.vehicle_arrived'
  | 'gate.truck_queued'
  | 'gate.truck_called'

  // Gate-in process
  | 'gate.gatein_started'
  | 'gate.check_in_started'
  | 'gate.ocr_captured'
  | 'gate.rfid_detected'
  | 'gate.document_check_completed'
  | 'gate.document_verified'
  | 'gate.weighed'
  | 'gate.weighbridge_captured'
  | 'gate.photos_captured'
  | 'gate.inspection_completed'
  | 'gate.gatein_completed'
  | 'gate.check_in_completed'
  | 'gate.check_in_failed'

  // Gate-out process
  | 'gate.gateout_started'
  | 'gate.check_out_started'
  | 'gate.gateout_completed'
  | 'gate.check_out_completed'
  | 'gate.check_out_failed'

  // Transaction
  | 'gate.transaction_cancelled'

  // Appointments
  | 'gate.appointment_created'
  | 'gate.appointment_confirmed'
  | 'gate.appointment_status_changed'
  | 'gate.appointment_arrived'
  | 'gate.appointment_no_show'
  | 'gate.appointment_cancelled'

  // Alerts
  | 'gate.queue_alert'
  | 'gate.lane_opened'
  | 'gate.lane_closed';

// ============================================================================
// RAIL EVENTS
// ============================================================================

export type RailEventType =
  // Rake lifecycle
  | 'rail.rake_announced'
  | 'rail.rake_updated'
  | 'rail.rake_cancelled'
  | 'rail.rake_status_changed'

  // Track operations
  | 'rail.track_registered'
  | 'rail.track_assigned'
  | 'rail.track_released'

  // Arrival/Departure
  | 'rail.rake_arrived'
  | 'rail.rake_positioned'
  | 'rail.rake_departed'

  // Loading/Unloading
  | 'rail.unloading_started'
  | 'rail.unloading_progress'
  | 'rail.unloading_completed'
  | 'rail.loading_started'
  | 'rail.loading_progress'
  | 'rail.loading_completed'

  // Wagon operations
  | 'rail.wagon_loaded'
  | 'rail.wagon_unloaded'
  | 'rail.container_loaded_wagon'
  | 'rail.container_unloaded_wagon'

  // Intermodal
  | 'rail.container_transferred_to_yard'
  | 'rail.container_transferred_from_yard'

  // Documentation
  | 'rail.manifest_submitted'
  | 'rail.manifest_acknowledged';

// ============================================================================
// ROAD EVENTS
// ============================================================================

export type RoadEventType =
  // Transporter
  | 'road.transporter_registered'
  | 'road.transporter_updated'
  | 'road.transporter_blacklisted'

  // Appointment lifecycle
  | 'road.appointment_created'
  | 'road.appointment_confirmed'
  | 'road.appointment_cancelled'
  | 'road.appointment_completed'
  | 'road.appointment_no_show'

  // Truck movements
  | 'road.truck_arrived'
  | 'road.truck_check_in'
  | 'road.truck_check_out'
  | 'road.truck_departed'

  // E-way bill
  | 'road.eway_bill_registered'
  | 'road.eway_bill_updated'
  | 'road.eway_bill_cancelled'
  | 'road.eway_bill_expired'
  | 'road.eway_bill_validated';

// ============================================================================
// VESSEL EVENTS
// ============================================================================

export type VesselEventType =
  // Vessel lifecycle
  | 'vessel.announced'
  | 'vessel.updated'
  | 'vessel.cancelled'

  // Berth operations
  | 'vessel.berth_requested'
  | 'vessel.berth_assigned'
  | 'vessel.berth_changed'
  | 'vessel.berth_released'

  // Arrival/Departure
  | 'vessel.at_anchorage'
  | 'vessel.berthing'
  | 'vessel.alongside'
  | 'vessel.unberthing'
  | 'vessel.departed'

  // Cargo operations
  | 'vessel.discharge_started'
  | 'vessel.discharge_progress'
  | 'vessel.discharge_completed'
  | 'vessel.loading_started'
  | 'vessel.loading_progress'
  | 'vessel.loading_completed'

  // Crane operations
  | 'vessel.crane_assigned'
  | 'vessel.crane_released'
  | 'vessel.crane_working_bay'

  // Stow plan
  | 'vessel.stow_plan_received'
  | 'vessel.stow_plan_approved';

// ============================================================================
// EQUIPMENT EVENTS
// ============================================================================

export type EquipmentEventType =
  // Assignment
  | 'equipment.assigned'
  | 'equipment.released'
  | 'equipment.reserved'

  // Operations
  | 'equipment.started_task'
  | 'equipment.completed_task'
  | 'equipment.move_completed'

  // Status changes
  | 'equipment.status_changed'
  | 'equipment.location_updated'

  // Alerts
  | 'equipment.breakdown'
  | 'equipment.breakdown_resolved'
  | 'equipment.maintenance_due'
  | 'equipment.maintenance_started'
  | 'equipment.maintenance_completed'
  | 'equipment.fuel_low'
  | 'equipment.battery_low'
  | 'equipment.over_speed'
  | 'equipment.geo_fence_alert'

  // Checklist
  | 'equipment.checklist_completed'
  | 'equipment.checklist_failed';

// ============================================================================
// CUSTOMS EVENTS
// ============================================================================

export type CustomsEventType =
  // Bill of Entry
  | 'customs.boe_created'
  | 'customs.boe_submitted'
  | 'customs.boe_registered'
  | 'customs.boe_assessed'
  | 'customs.boe_query_raised'
  | 'customs.boe_query_replied'

  // Duty
  | 'customs.duty_calculated'
  | 'customs.duty_payment_initiated'
  | 'customs.duty_paid'
  | 'customs.duty_payment_failed'

  // Examination
  | 'customs.examination_ordered'
  | 'customs.examination_scheduled'
  | 'customs.examination_started'
  | 'customs.examination_completed'
  | 'customs.discrepancy_found'

  // Clearance
  | 'customs.out_of_charge'
  | 'customs.hold_placed'
  | 'customs.hold_released'

  // Shipping Bill
  | 'customs.sb_created'
  | 'customs.sb_submitted'
  | 'customs.sb_registered'
  | 'customs.sb_assessed'
  | 'customs.let_export'
  | 'customs.eos_generated';

// ============================================================================
// BILLING EVENTS
// ============================================================================

export type BillingEventType =
  // Invoice
  | 'billing.invoice_created'
  | 'billing.invoice_approved'
  | 'billing.invoice_sent'
  | 'billing.invoice_disputed'
  | 'billing.invoice_cancelled'

  // Payment
  | 'billing.payment_received'
  | 'billing.payment_confirmed'
  | 'billing.payment_failed'
  | 'billing.payment_reversed'

  // Demurrage
  | 'billing.free_time_expiring'
  | 'billing.free_time_expired'
  | 'billing.demurrage_triggered'
  | 'billing.demurrage_calculated'

  // Credit
  | 'billing.credit_limit_warning'
  | 'billing.credit_limit_exceeded'
  | 'billing.customer_blocked';

// ============================================================================
// SYSTEM EVENTS
// ============================================================================

export type SystemEventType =
  // Facility
  | 'system.facility_opened'
  | 'system.facility_closed'
  | 'system.shift_started'
  | 'system.shift_ended'

  // Integration
  | 'system.icegate_connected'
  | 'system.icegate_disconnected'
  | 'system.edi_received'
  | 'system.edi_sent'
  | 'system.edi_error'

  // Alerts
  | 'system.alert_triggered'
  | 'system.alert_acknowledged'
  | 'system.alert_resolved'

  // Maintenance
  | 'system.maintenance_started'
  | 'system.maintenance_ended';

// ============================================================================
// BOND EVENTS
// ============================================================================

export type BondEventType =
  | 'bond.registered'
  | 'bond.status_changed'
  | 'bond.renewed'
  | 'bond.container_bonded'
  | 'bond.container_released'
  | 'bond.extension_granted'
  | 'bond.container_transferred'
  | 'bond.overdue_alert'
  | 'bond.expiry_alert';

// ============================================================================
// COMPLIANCE EVENTS
// ============================================================================

export type ComplianceEventType =
  | 'compliance.eway_generated'
  | 'compliance.eway_extended'
  | 'compliance.eway_cancelled'
  | 'compliance.einvoice_generated'
  | 'compliance.einvoice_cancelled'
  | 'compliance.gst_return_filed';

// ============================================================================
// SCHEDULING EVENTS
// ============================================================================

export type SchedulingEventType =
  | 'scheduling.slot_registered'
  | 'scheduling.slot_status_changed'
  | 'scheduling.appointment_created'
  | 'scheduling.appointment_confirmed'
  | 'scheduling.appointment_cancelled'
  | 'scheduling.appointment_completed'
  | 'scheduling.appointment_no_show'
  | 'scheduling.trailer_registered'
  | 'scheduling.trailer_assigned'
  | 'scheduling.trailer_released'
  | 'scheduling.empty_received'
  | 'scheduling.empty_allotted'
  | 'scheduling.empty_released'
  | 'scheduling.stacking_rule_added'
  | 'scheduling.stacking_recommendation';

// ============================================================================
// INSPECTION EVENTS
// ============================================================================

export type InspectionEventType =
  | 'inspection.survey_scheduled'
  | 'inspection.survey_started'
  | 'inspection.survey_completed'
  | 'inspection.damage_reported'
  | 'inspection.exam_ordered'
  | 'inspection.exam_started'
  | 'inspection.exam_completed'
  | 'inspection.exam_discrepancy'
  | 'inspection.qc_check_created'
  | 'inspection.qc_passed'
  | 'inspection.qc_failed'
  | 'inspection.qc_hold_placed'
  | 'inspection.qc_hold_released';

// ============================================================================
// CONGESTION EVENTS
// ============================================================================

export type CongestionEventType =
  | 'congestion.alert_triggered'
  | 'congestion.alert_resolved'
  | 'congestion.action_created'
  | 'congestion.level_changed';

// ============================================================================
// RECONCILIATION EVENTS
// ============================================================================

export type ReconciliationEventType =
  | 'reconciliation.count_planned'
  | 'reconciliation.count_started'
  | 'reconciliation.count_completed'
  | 'reconciliation.entry_recorded'
  | 'reconciliation.variance_detected'
  | 'reconciliation.variance_resolved'
  | 'reconciliation.customs_notified'
  | 'reconciliation.adjustment_created'
  | 'reconciliation.adjustment_approved'
  | 'reconciliation.adjustment_applied';

// ============================================================================
// COMBINED EVENT TYPE
// ============================================================================

export type ICDEventType =
  | ContainerEventType
  | YardEventType
  | GateEventType
  | RailEventType
  | RoadEventType
  | VesselEventType
  | EquipmentEventType
  | CustomsEventType
  | BillingEventType
  | BondEventType
  | ComplianceEventType
  | SchedulingEventType
  | InspectionEventType
  | CongestionEventType
  | ReconciliationEventType
  | SystemEventType;

// Event categories for subscription filtering
export const EVENT_CATEGORIES = {
  container: 'container.*',
  yard: 'yard.*',
  gate: 'gate.*',
  rail: 'rail.*',
  road: 'road.*',
  vessel: 'vessel.*',
  equipment: 'equipment.*',
  customs: 'customs.*',
  billing: 'billing.*',
  scheduling: 'scheduling.*',
  inspection: 'inspection.*',
  reconciliation: 'reconciliation.*',
  system: 'system.*',
} as const;

// Event severity levels
export type EventSeverity = 'info' | 'warning' | 'error' | 'critical';

// Map events to their default severity
export const EVENT_SEVERITY: Partial<Record<ICDEventType, EventSeverity>> = {
  // Critical events
  'equipment.breakdown': 'critical',
  'customs.hold_placed': 'critical',
  'billing.credit_limit_exceeded': 'critical',
  'yard.capacity_critical': 'critical',
  'container.reefer_temp_alert': 'critical',

  // Warning events
  'yard.capacity_warning': 'warning',
  'yard.congestion_alert': 'warning',
  'billing.free_time_expiring': 'warning',
  'billing.credit_limit_warning': 'warning',
  'equipment.fuel_low': 'warning',
  'equipment.battery_low': 'warning',
  'equipment.maintenance_due': 'warning',
  'gate.queue_alert': 'warning',

  // Error events
  'gate.check_in_failed': 'error',
  'gate.check_out_failed': 'error',
  'customs.duty_payment_failed': 'error',
  'system.edi_error': 'error',
  'system.icegate_disconnected': 'error',

  // Inspection events
  'inspection.exam_discrepancy': 'warning',
  'inspection.qc_failed': 'warning',
  'inspection.qc_hold_placed': 'warning',
  'inspection.damage_reported': 'warning',

  // Reconciliation events
  'reconciliation.variance_detected': 'warning',
  'reconciliation.customs_notified': 'warning',
};

// Get severity for an event type
export function getEventSeverity(eventType: ICDEventType): EventSeverity {
  return EVENT_SEVERITY[eventType] ?? 'info';
}

// Check if event matches a pattern (e.g., 'container.*' matches 'container.arrived')
export function matchesEventPattern(eventType: ICDEventType, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern === eventType) return true;
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return eventType.startsWith(prefix + '.');
  }
  return false;
}
