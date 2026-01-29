// =============================================================================
// ankrICD GraphQL Resolvers
// =============================================================================
// Resolvers delegate to engine singletons. Each engine manages its own
// in-memory state (or can be backed by a database via repository injection).
// =============================================================================

import { getFacilityManager } from '../../facility';
import { getContainerEngine } from '../../containers';
import { getYardEngine } from '../../yard';
import { getGateEngine } from '../../gate';
import { getRailEngine } from '../../rail';
import { getRoadEngine } from '../../road';
import { getWaterfrontEngine } from '../../waterfront';
import { getEquipmentEngine } from '../../equipment';
import { getBillingEngine } from '../../billing';
import { getCustomsEngine } from '../../customs';
import { getAnalyticsEngine } from '../../analytics';
import { getOperationsEngine } from '../../operations';
import { getDocumentationEngine } from '../../documentation';
import { getHardwareManager } from '../../hardware';
import { getIoTManager } from '../../iot';
import { getSystemInfo, VERSION } from '../../index';

import type { MercuriusContext } from 'mercurius';
import { subscriptionResolvers } from '../subscriptions';
import type { AuthContext } from '../auth/types';

// Extend context with tenant info and optional auth
interface GQLContext extends MercuriusContext {
  tenantId?: string;
  authContext?: AuthContext;
}

// Helper: extract tenantId from context
function tid(ctx: GQLContext): string {
  return ctx.tenantId ?? 'default';
}

// =============================================================================
// QUERY RESOLVERS
// =============================================================================

const Query = {
  // ---- System ----
  systemInfo: () => getSystemInfo(),

  healthStatus: () => ({
    status: 'healthy',
    version: VERSION,
    timestamp: new Date(),
    engines: {
      facilities: 'active',
      containers: 'active',
      yard: 'active',
      gate: 'active',
      rail: 'active',
      road: 'active',
      waterfront: 'active',
      equipment: 'active',
      billing: 'active',
      customs: 'active',
      analytics: 'active',
      operations: 'active',
      documentation: 'active',
      hardware: 'active',
      iot: 'active',
    },
  }),

  // ---- Facility ----
  facility: (_: unknown, { id }: { id: string }) => {
    return getFacilityManager().getFacility(id);
  },

  facilities: (_: unknown, { tenantId: tenantArg }: { tenantId?: string }) => {
    return getFacilityManager().getAllFacilities(tenantArg);
  },

  // ---- Container ----
  container: (_: unknown, { id }: { id: string }) => {
    return getContainerEngine().getContainer(id);
  },

  containerByNumber: (_: unknown, { containerNumber }: { containerNumber: string }) => {
    return getContainerEngine().getContainerByNumber(containerNumber);
  },

  containers: (_: unknown, args: { facilityId: string; status?: string }) => {
    const all = getContainerEngine().getContainersByFacility(args.facilityId, {
      status: args.status as any,
    });
    return {
      data: all,
      pageInfo: {
        total: all.length,
        page: 1,
        pageSize: all.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };
  },

  containerStats: (_: unknown, { facilityId }: { facilityId: string }) => {
    return getContainerEngine().getContainerStats(facilityId);
  },

  // ---- Yard ----
  yardOccupancy: (_: unknown, { facilityId }: { facilityId: string }) => {
    return getYardEngine().getYardOccupancy(facilityId);
  },

  workOrders: (_: unknown, { facilityId, status }: { facilityId: string; status?: string }) => {
    return getYardEngine().getWorkOrdersByFacility(facilityId, status);
  },

  // ---- Gate ----
  gate: (_: unknown, { id }: { id: string }) => {
    return getGateEngine().getGate(id);
  },

  gates: (_: unknown, { facilityId }: { facilityId: string }) => {
    return getGateEngine().getGatesByFacility(facilityId);
  },

  gateTransaction: (_: unknown, { id }: { id: string }) => {
    return getGateEngine().getTransaction(id);
  },

  gateTransactions: (_: unknown, args: { facilityId: string; status?: string }) => {
    const all = getGateEngine().getTransactionsByFacility(args.facilityId, {
      status: args.status as any,
    });
    return {
      data: all,
      pageInfo: {
        total: all.length,
        page: 1,
        pageSize: all.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };
  },

  appointments: (_: unknown, { facilityId }: { facilityId: string }) => {
    return getGateEngine().getAppointmentsByFacility(facilityId);
  },

  activeGateTransactions: (_: unknown, { facilityId }: { facilityId: string }) => {
    return getGateEngine().getActiveTransactions(facilityId);
  },

  // ---- Rail ----
  railTracks: (_: unknown, { facilityId }: { facilityId: string }, ctx: GQLContext) => {
    return getRailEngine().listTracks({ facilityId, tenantId: tid(ctx) }).data;
  },

  rake: (_: unknown, { id }: { id: string }) => {
    return getRailEngine().getRake(id);
  },

  rakes: (_: unknown, { facilityId, status }: { facilityId: string; status?: string }, ctx: GQLContext) => {
    return getRailEngine().listRakes({ facilityId, tenantId: tid(ctx), status: status as any }).data;
  },

  railTerminalStats: (_: unknown, _args: Record<string, unknown>, ctx: GQLContext) => {
    return getRailEngine().getTerminalStats(tid(ctx));
  },

  // ---- Road ----
  transporters: (_: unknown, { status }: { status?: string }, ctx: GQLContext) => {
    return getRoadEngine().listTransporters({ tenantId: tid(ctx), status: status as any }).data;
  },

  truckAppointments: (_: unknown, { status }: { status?: string }, ctx: GQLContext) => {
    return getRoadEngine().listAppointments({ tenantId: tid(ctx), status: status as any }).data;
  },

  eWayBills: (_: unknown, { status }: { status?: string }, ctx: GQLContext) => {
    return getRoadEngine().listEWayBills({ tenantId: tid(ctx), status: status as any }).data;
  },

  roadTransportStats: (_: unknown, _args: Record<string, unknown>, ctx: GQLContext) => {
    return getRoadEngine().getStats(tid(ctx));
  },

  // ---- Waterfront ----
  berths: (_: unknown, { facilityId }: { facilityId: string }, ctx: GQLContext) => {
    return getWaterfrontEngine().listBerths({ facilityId, tenantId: tid(ctx) }).data;
  },

  vesselVisit: (_: unknown, { id }: { id: string }) => {
    return getWaterfrontEngine().getVesselVisit(id);
  },

  vesselVisits: (_: unknown, { facilityId, status }: { facilityId: string; status?: string }, ctx: GQLContext) => {
    return getWaterfrontEngine().listVesselVisits({ facilityId, tenantId: tid(ctx), status: status as any }).data;
  },

  waterfrontStats: (_: unknown, _args: Record<string, unknown>, ctx: GQLContext) => {
    return getWaterfrontEngine().getWaterfrontStats(tid(ctx));
  },

  // ---- Equipment ----
  equipment: (_: unknown, { facilityId, type, status }: { facilityId: string; type?: string; status?: string }, ctx: GQLContext) => {
    return getEquipmentEngine().listEquipment({ facilityId, tenantId: tid(ctx), type: type as any, status: status as any }).data;
  },

  equipmentById: (_: unknown, { id }: { id: string }) => {
    return getEquipmentEngine().getEquipment(id);
  },

  equipmentFleetStats: (_: unknown, _args: Record<string, unknown>, ctx: GQLContext) => {
    return getEquipmentEngine().getFleetStats(tid(ctx));
  },

  // ---- Billing ----
  customer: (_: unknown, { id }: { id: string }) => {
    return getBillingEngine().getCustomer(id);
  },

  customers: (_: unknown, { facilityId, type, status }: { facilityId: string; type?: string; status?: string }, ctx: GQLContext) => {
    return getBillingEngine().listCustomers({ facilityId, tenantId: tid(ctx), type: type as any, status: status as any }).data;
  },

  tariffs: (_: unknown, _args: Record<string, unknown>, ctx: GQLContext) => {
    return getBillingEngine().listTariffs({ tenantId: tid(ctx) }).data;
  },

  invoice: (_: unknown, { id }: { id: string }) => {
    return getBillingEngine().getInvoice(id);
  },

  invoices: (_: unknown, { facilityId, customerId, status }: { facilityId: string; customerId?: string; status?: string }, ctx: GQLContext) => {
    return getBillingEngine().listInvoices({ facilityId, tenantId: tid(ctx), customerId, status: status as any }).data;
  },

  calculateDemurrage: (_: unknown, { containerId, containerNumber, containerSize }: { containerId: string; containerNumber?: string; containerSize?: string }, ctx: GQLContext) => {
    const result = getBillingEngine().calculateDemurrage({
      tenantId: tid(ctx),
      containerId,
      containerNumber: containerNumber ?? '',
      containerSize: (containerSize ?? '20') as any,
      arrivalDate: new Date(),
    });
    return result.data;
  },

  billingStats: (_: unknown, _args: Record<string, unknown>, ctx: GQLContext) => {
    return getBillingEngine().getBillingStats(tid(ctx));
  },

  // ---- Customs ----
  billOfEntry: (_: unknown, { id }: { id: string }) => {
    return getCustomsEngine().getBillOfEntry(id);
  },

  billsOfEntry: (_: unknown, { facilityId, status }: { facilityId: string; status?: string }, ctx: GQLContext) => {
    return getCustomsEngine().listBillsOfEntry({ facilityId, tenantId: tid(ctx), status: status as any }).data;
  },

  shippingBill: (_: unknown, { id }: { id: string }) => {
    return getCustomsEngine().getShippingBill(id);
  },

  shippingBills: (_: unknown, { facilityId, status }: { facilityId: string; status?: string }, ctx: GQLContext) => {
    return getCustomsEngine().listShippingBills({ facilityId, tenantId: tid(ctx), status: status as any }).data;
  },

  customsStats: (_: unknown, _args: Record<string, unknown>, ctx: GQLContext) => {
    return getCustomsEngine().getCustomsStats(tid(ctx));
  },

  // ---- Analytics ----
  terminalKPIs: (_: unknown, { facilityId }: { facilityId: string }, ctx: GQLContext) => {
    return getAnalyticsEngine().getTerminalKPIs(tid(ctx), facilityId);
  },

  dwellTimeAnalytics: (_: unknown, { facilityId }: { facilityId: string }) => {
    return getAnalyticsEngine().getDwellTimeAnalytics(facilityId);
  },

  operationsDashboard: (_: unknown, { facilityId }: { facilityId: string }, ctx: GQLContext) => {
    return getAnalyticsEngine().getOperationsDashboard(tid(ctx), facilityId);
  },

  performanceScorecard: (_: unknown, { facilityId }: { facilityId: string }, ctx: GQLContext) => {
    return getAnalyticsEngine().generateScorecard(tid(ctx), facilityId);
  },

  // ---- Operations ----
  stuffingOperation: (_: unknown, { id }: { id: string }) => {
    return getOperationsEngine().getStuffing(id);
  },

  stuffingOperations: (_: unknown, { facilityId, status }: { facilityId: string; status?: string }, ctx: GQLContext) => {
    return getOperationsEngine().listStuffingOps({ tenantId: tid(ctx), facilityId, status: status as any });
  },

  destuffingOperation: (_: unknown, { id }: { id: string }) => {
    return getOperationsEngine().getDestuffing(id);
  },

  destuffingOperations: (_: unknown, { facilityId, status }: { facilityId: string; status?: string }, ctx: GQLContext) => {
    return getOperationsEngine().listDestuffingOps({ tenantId: tid(ctx), facilityId, status: status as any });
  },

  lclConsolidation: (_: unknown, { id }: { id: string }) => {
    return getOperationsEngine().getConsolidation(id);
  },

  lclConsolidations: (_: unknown, { facilityId, status }: { facilityId: string; status?: string }, ctx: GQLContext) => {
    return getOperationsEngine().listConsolidations({ tenantId: tid(ctx), facilityId, status: status as any });
  },

  fclOperation: (_: unknown, { id }: { id: string }) => {
    return getOperationsEngine().getFCLOperation(id);
  },

  fclOperations: (_: unknown, { facilityId, status, operationType }: { facilityId: string; status?: string; operationType?: string }, ctx: GQLContext) => {
    return getOperationsEngine().listFCLOperations({ tenantId: tid(ctx), facilityId, status: status as any, operationType: operationType as any });
  },

  crossDockOperation: (_: unknown, { id }: { id: string }) => {
    return getOperationsEngine().getCrossDock(id);
  },

  crossDockOperations: (_: unknown, { facilityId, status }: { facilityId: string; status?: string }, ctx: GQLContext) => {
    return getOperationsEngine().listCrossDocks({ tenantId: tid(ctx), facilityId, status: status as any });
  },

  cargoInspection: (_: unknown, { id }: { id: string }) => {
    return getOperationsEngine().getInspection(id);
  },

  cargoInspections: (_: unknown, { facilityId, status, inspectionType }: { facilityId: string; status?: string; inspectionType?: string }, ctx: GQLContext) => {
    return getOperationsEngine().listInspections({ tenantId: tid(ctx), facilityId, status: status as any, inspectionType: inspectionType as any });
  },

  operationsStats: (_: unknown, _args: Record<string, unknown>, ctx: GQLContext) => {
    return getOperationsEngine().getOperationsStats(tid(ctx));
  },

  // ---- Documentation ----
  billOfLadingById: (_: unknown, { id }: { id: string }) => {
    return getDocumentationEngine().getBL(id);
  },

  billOfLadingByNumber: (_: unknown, { blNumber }: { blNumber: string }) => {
    return getDocumentationEngine().getBLByNumber(blNumber);
  },

  billsOfLading: (_: unknown, { facilityId, status, blType }: { facilityId: string; status?: string; blType?: string }, ctx: GQLContext) => {
    return getDocumentationEngine().listBLs({ tenantId: tid(ctx), facilityId, status: status as any, blType: blType as any });
  },

  deliveryOrder: (_: unknown, { id }: { id: string }) => {
    return getDocumentationEngine().getDO(id);
  },

  deliveryOrderByNumber: (_: unknown, { doNumber }: { doNumber: string }) => {
    return getDocumentationEngine().getDOByNumber(doNumber);
  },

  deliveryOrders: (_: unknown, { facilityId, status, blNumber }: { facilityId: string; status?: string; blNumber?: string }, ctx: GQLContext) => {
    return getDocumentationEngine().listDOs({ tenantId: tid(ctx), facilityId, status: status as any, blNumber });
  },

  ediMessage: (_: unknown, { id }: { id: string }) => {
    return getDocumentationEngine().getEDIMessage(id);
  },

  ediMessages: (_: unknown, { facilityId, messageType, direction, status }: { facilityId: string; messageType?: string; direction?: string; status?: string }, ctx: GQLContext) => {
    return getDocumentationEngine().listEDIMessages({ tenantId: tid(ctx), facilityId, messageType: messageType as any, direction: direction as any, status: status as any });
  },

  docManifest: (_: unknown, { id }: { id: string }) => {
    return getDocumentationEngine().getManifest(id);
  },

  docManifests: (_: unknown, { facilityId, manifestType, status }: { facilityId: string; manifestType?: string; status?: string }, ctx: GQLContext) => {
    return getDocumentationEngine().listManifests({ tenantId: tid(ctx), facilityId, manifestType: manifestType as any, status: status as any });
  },

  documentationStats: (_: unknown, _args: Record<string, unknown>, ctx: GQLContext) => {
    return getDocumentationEngine().getDocumentationStats(tid(ctx));
  },

  // ---- Hardware ----
  hardwareDevice: (_: unknown, { id }: { id: string }) => {
    return getHardwareManager().getDevice(id);
  },

  hardwareDevices: (_: unknown, { facilityId, deviceType, status }: { facilityId: string; deviceType?: string; status?: string }, ctx: GQLContext) => {
    return getHardwareManager().listDevices({ tenantId: tid(ctx), facilityId, deviceType: deviceType as any, status: status as any });
  },

  rfidReads: (_: unknown, { deviceId, limit }: { deviceId: string; limit?: number }) => {
    return getHardwareManager().getRecentRFIDReads(deviceId, limit);
  },

  weighbridgeReads: (_: unknown, { deviceId, limit }: { deviceId: string; limit?: number }) => {
    return getHardwareManager().getWeighbridgeReads(deviceId, limit);
  },

  hardwareStats: (_: unknown, _args: Record<string, unknown>, ctx: GQLContext) => {
    return getHardwareManager().getHardwareStats(tid(ctx));
  },

  // ---- IoT ----
  iotSensor: (_: unknown, { id }: { id: string }) => {
    return getIoTManager().getSensor(id);
  },

  iotSensors: (_: unknown, { facilityId, sensorType, status }: { facilityId: string; sensorType?: string; status?: string }, ctx: GQLContext) => {
    return getIoTManager().listSensors({ tenantId: tid(ctx), facilityId, sensorType: sensorType as any, status: status as any });
  },

  sensorReadings: (_: unknown, { sensorId, limit }: { sensorId: string; limit?: number }) => {
    return getIoTManager().getReadings(sensorId, limit);
  },

  sensorAlerts: (_: unknown, { facilityId, limit }: { facilityId: string; limit?: number }) => {
    return getIoTManager().getAlerts(facilityId, limit);
  },

  reeferProfile: (_: unknown, { containerId }: { containerId: string }) => {
    return getIoTManager().getReeferProfile(containerId);
  },

  reeferProfiles: (_: unknown, { facilityId }: { facilityId: string }) => {
    return getIoTManager().listReeferProfiles(facilityId);
  },

  gpsTrack: (_: unknown, { entityType, entityId }: { entityType: string; entityId: string }) => {
    return getIoTManager().getGPSTrack(entityType, entityId);
  },

  gpsTracks: (_: unknown, { facilityId }: { facilityId: string }) => {
    return getIoTManager().listGPSTracks(facilityId);
  },

  iotStats: (_: unknown, _args: Record<string, unknown>, ctx: GQLContext) => {
    return getIoTManager().getIoTStats(tid(ctx));
  },
};

// =============================================================================
// MUTATION RESOLVERS
// =============================================================================

const Mutation = {
  // ---- Facility ----
  createFacility: (_: unknown, { input }: { input: any }) => {
    const result = getFacilityManager().createFacility(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  createZone: (_: unknown, { input }: { input: any }) => {
    const result = getFacilityManager().createZone(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  createBlock: (_: unknown, { input }: { input: any }) => {
    const result = getFacilityManager().createBlock(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Container ----
  registerContainer: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getContainerEngine().registerContainer({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  gateInContainer: (_: unknown, { containerId, input }: { containerId: string; input: any }) => {
    const result = getContainerEngine().gateIn(containerId, input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  groundContainer: (_: unknown, { containerId, location }: { containerId: string; location: any }) => {
    const result = getContainerEngine().ground(containerId, location);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  pickContainer: (_: unknown, { containerId }: { containerId: string }) => {
    const result = getContainerEngine().pick(containerId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  gateOutContainer: (_: unknown, { containerId, input }: { containerId: string; input: any }) => {
    const result = getContainerEngine().gateOut(containerId, input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  placeHold: (_: unknown, { containerId, input }: { containerId: string; input: any }) => {
    const result = getContainerEngine().placeHold(containerId, input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  releaseHold: (_: unknown, { containerId, holdId, releasedBy }: { containerId: string; holdId: string; releasedBy?: string }) => {
    const result = getContainerEngine().releaseHold(containerId, holdId, releasedBy ?? 'system');
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Gate ----
  registerGate: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getGateEngine().registerGate({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  addLane: (_: unknown, { input }: { input: any }) => {
    const result = getGateEngine().addLane(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  createAppointment: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getGateEngine().createAppointment({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  startGateIn: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getGateEngine().startGateIn({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  completeGateIn: (_: unknown, { transactionId }: { transactionId: string }) => {
    const result = getGateEngine().completeGateIn(transactionId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  startGateOut: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getGateEngine().startGateOut({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  completeGateOut: (_: unknown, { transactionId }: { transactionId: string }) => {
    const result = getGateEngine().completeGateOut(transactionId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Rail ----
  registerTrack: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getRailEngine().registerTrack({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  announceRake: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getRailEngine().announceRake({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  addWagon: (_: unknown, { input }: { input: any }) => {
    const result = getRailEngine().addWagon(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  assignTrack: (_: unknown, { rakeId, trackId }: { rakeId: string; trackId: string }) => {
    const result = getRailEngine().assignTrack(rakeId, trackId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  arriveRake: (_: unknown, { rakeId }: { rakeId: string }) => {
    const result = getRailEngine().recordRakeArrival(rakeId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  startUnloading: (_: unknown, { rakeId }: { rakeId: string }) => {
    const result = getRailEngine().startUnloading(rakeId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  completeUnloading: (_: unknown, { rakeId }: { rakeId: string }) => {
    const result = getRailEngine().completeUnloading(rakeId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  startLoading: (_: unknown, { rakeId }: { rakeId: string }) => {
    const result = getRailEngine().startLoading(rakeId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  completeLoading: (_: unknown, { rakeId }: { rakeId: string }) => {
    const result = getRailEngine().completeLoading(rakeId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  departRake: (_: unknown, { rakeId }: { rakeId: string }) => {
    const result = getRailEngine().dispatchRake(rakeId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Road ----
  registerTransporter: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getRoadEngine().registerTransporter({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  registerEWayBill: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getRoadEngine().registerEWayBill({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Waterfront ----
  registerBerth: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getWaterfrontEngine().registerBerth({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  announceVessel: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getWaterfrontEngine().announceVessel({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  assignBerth: (_: unknown, { vesselVisitId, berthId }: { vesselVisitId: string; berthId: string }) => {
    const result = getWaterfrontEngine().assignBerth(vesselVisitId, berthId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  arriveVessel: (_: unknown, { vesselVisitId }: { vesselVisitId: string }) => {
    const result = getWaterfrontEngine().recordArrival(vesselVisitId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  startDischarge: (_: unknown, { vesselVisitId }: { vesselVisitId: string }) => {
    const result = getWaterfrontEngine().startDischarge(vesselVisitId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  completeDischarge: (_: unknown, { vesselVisitId }: { vesselVisitId: string }) => {
    const result = getWaterfrontEngine().completeDischarge(vesselVisitId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  startVesselLoading: (_: unknown, { vesselVisitId }: { vesselVisitId: string }) => {
    const result = getWaterfrontEngine().startLoading(vesselVisitId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  completeVesselLoading: (_: unknown, { vesselVisitId }: { vesselVisitId: string }) => {
    const result = getWaterfrontEngine().completeLoading(vesselVisitId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  departVessel: (_: unknown, { vesselVisitId }: { vesselVisitId: string }) => {
    const result = getWaterfrontEngine().recordDeparture(vesselVisitId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  registerCrane: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getWaterfrontEngine().registerCrane({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Equipment ----
  registerEquipment: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getEquipmentEngine().registerEquipment({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  updateEquipmentStatus: (_: unknown, { equipmentId, status, reason }: { equipmentId: string; status: string; reason?: string }) => {
    const result = getEquipmentEngine().updateStatus(equipmentId, status as any, reason);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  scheduleMaintenance: (_: unknown, { input }: { input: any }) => {
    const result = getEquipmentEngine().scheduleMaintenance(input);
    return { success: result.success, error: result.error, errorCode: result.errorCode };
  },

  // ---- Billing ----
  registerCustomer: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getBillingEngine().registerCustomer({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  createTariff: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getBillingEngine().createTariff({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  createInvoice: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getBillingEngine().createInvoice({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  approveInvoice: (_: unknown, { invoiceId, approvedBy }: { invoiceId: string; approvedBy?: string }) => {
    const result = getBillingEngine().approveInvoice(invoiceId, approvedBy ?? 'system');
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  recordPayment: (_: unknown, { input }: { input: any }) => {
    const result = getBillingEngine().recordPayment(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Customs ----
  createBillOfEntry: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getCustomsEngine().createBillOfEntry({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  submitBOE: (_: unknown, { boeId }: { boeId: string }) => {
    const result = getCustomsEngine().submitBOE(boeId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  assessBOE: (_: unknown, { boeId, assessableValue, basicDuty, igst }: { boeId: string; assessableValue?: number; basicDuty?: number; igst?: number }) => {
    const result = getCustomsEngine().assessBOE(boeId, { assessableValue, basicDuty, igst });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  payDuty: (_: unknown, { boeId, paymentMode, challanNumber }: { boeId: string; paymentMode?: string; challanNumber?: string }) => {
    const result = getCustomsEngine().recordDutyPayment(boeId, { paymentMode: (paymentMode ?? 'online') as any, challanNumber });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  outOfCharge: (_: unknown, { boeId }: { boeId: string }) => {
    const result = getCustomsEngine().grantOutOfCharge(boeId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  createShippingBill: (_: unknown, { facilityId, input }: { facilityId: string; input: any }) => {
    const result = getCustomsEngine().createShippingBill({ ...input, facilityId });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  submitSB: (_: unknown, { sbId }: { sbId: string }) => {
    const result = getCustomsEngine().submitShippingBill(sbId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  letExport: (_: unknown, { sbId, officer }: { sbId: string; officer?: string }) => {
    const result = getCustomsEngine().grantLetExport(sbId, officer ?? 'system');
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  orderExamination: (_: unknown, { input }: { input: any }) => {
    const result = getCustomsEngine().orderExamination(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Operations - Stuffing ----
  createStuffing: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getOperationsEngine().createStuffing({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  startStuffing: (_: unknown, { operationId }: { operationId: string }) => {
    const result = getOperationsEngine().startStuffing(operationId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  completeStuffing: (_: unknown, { operationId, sealNumber }: { operationId: string; sealNumber?: string }) => {
    const result = getOperationsEngine().completeStuffing(operationId, sealNumber);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  pauseStuffing: (_: unknown, { operationId, reason }: { operationId: string; reason: string }) => {
    const result = getOperationsEngine().pauseStuffing(operationId, reason);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  cancelStuffing: (_: unknown, { operationId, reason }: { operationId: string; reason: string }) => {
    const result = getOperationsEngine().cancelStuffing(operationId, reason);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Operations - Destuffing ----
  createDestuffing: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getOperationsEngine().createDestuffing({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  startDestuffing: (_: unknown, { operationId, sealIntact }: { operationId: string; sealIntact?: boolean }) => {
    const result = getOperationsEngine().startDestuffing(operationId, sealIntact);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  completeDestuffing: (_: unknown, { operationId }: { operationId: string }) => {
    const result = getOperationsEngine().completeDestuffing(operationId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Operations - LCL Consolidation ----
  createConsolidation: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getOperationsEngine().createConsolidation({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  addConsignment: (_: unknown, { input }: { input: any }) => {
    const result = getOperationsEngine().addConsignment(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  closeConsolidation: (_: unknown, { consolidationId, containerId, containerNumber, masterBlNumber }: { consolidationId: string; containerId: string; containerNumber: string; masterBlNumber?: string }) => {
    const result = getOperationsEngine().closeConsolidation(consolidationId, containerId, containerNumber, masterBlNumber);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Operations - FCL ----
  createFCLOperation: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getOperationsEngine().createFCLOperation({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  startFCLOperation: (_: unknown, { operationId }: { operationId: string }) => {
    const result = getOperationsEngine().startFCLOperation(operationId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  completeFCLOperation: (_: unknown, { operationId, remarks }: { operationId: string; remarks?: string }) => {
    const result = getOperationsEngine().completeFCLOperation(operationId, remarks);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Operations - Cross-Dock ----
  createCrossDock: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getOperationsEngine().createCrossDock({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  receiveCrossDock: (_: unknown, { operationId }: { operationId: string }) => {
    const result = getOperationsEngine().receiveCrossDock(operationId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  sortCrossDock: (_: unknown, { operationId }: { operationId: string }) => {
    const result = getOperationsEngine().sortCrossDock(operationId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  dispatchCrossDock: (_: unknown, { operationId, outboundContainerNumber }: { operationId: string; outboundContainerNumber?: string }) => {
    const result = getOperationsEngine().dispatchCrossDock(operationId, outboundContainerNumber);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Operations - Inspection ----
  createInspection: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getOperationsEngine().createInspection({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  startInspection: (_: unknown, { inspectionId }: { inspectionId: string }) => {
    const result = getOperationsEngine().startInspection(inspectionId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  completeInspection: (_: unknown, { inspectionId, result: inspResult, findings, actualWeight }: { inspectionId: string; result: string; findings: string; actualWeight?: number }) => {
    const res = getOperationsEngine().completeInspection(inspectionId, inspResult as any, findings, actualWeight);
    if (!res.success) throw new Error(res.error);
    return res.data;
  },

  // ---- Documentation - Bill of Lading ----
  createBillOfLading: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getDocumentationEngine().createBL({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  issueBL: (_: unknown, { blId }: { blId: string }) => {
    const result = getDocumentationEngine().issueBL(blId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  surrenderBL: (_: unknown, { blId }: { blId: string }) => {
    const result = getDocumentationEngine().surrenderBL(blId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  accomplishBL: (_: unknown, { blId }: { blId: string }) => {
    const result = getDocumentationEngine().accomplishBL(blId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Documentation - Delivery Order ----
  createDeliveryOrder: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getDocumentationEngine().createDO({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  issueDO: (_: unknown, { doId }: { doId: string }) => {
    const result = getDocumentationEngine().issueDO(doId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  clearDOCharges: (_: unknown, { doId }: { doId: string }) => {
    const result = getDocumentationEngine().clearCharges(doId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  clearDOCustoms: (_: unknown, { doId }: { doId: string }) => {
    const result = getDocumentationEngine().clearCustoms(doId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  verifyDO: (_: unknown, { doId, verifiedBy, pinCode }: { doId: string; verifiedBy: string; pinCode?: string }) => {
    const result = getDocumentationEngine().verifyDO(doId, verifiedBy, pinCode);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  recordDODelivery: (_: unknown, { doId, receivedBy }: { doId: string; receivedBy: string }) => {
    const result = getDocumentationEngine().recordDelivery(doId, receivedBy);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Documentation - EDI ----
  sendEDIMessage: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getDocumentationEngine().sendEDI({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  receiveEDIMessage: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getDocumentationEngine().receiveEDI({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  acknowledgeEDI: (_: unknown, { messageId }: { messageId: string }) => {
    const result = getDocumentationEngine().acknowledgeEDI(messageId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  rejectEDI: (_: unknown, { messageId, reason }: { messageId: string; reason: string }) => {
    const result = getDocumentationEngine().rejectEDI(messageId, reason);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Documentation - Manifest ----
  createDocManifest: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getDocumentationEngine().createManifest({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  addManifestItem: (_: unknown, { input }: { input: any }) => {
    const result = getDocumentationEngine().addManifestItem(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  fileManifest: (_: unknown, { manifestId, filedBy, filingReference }: { manifestId: string; filedBy: string; filingReference?: string }) => {
    const result = getDocumentationEngine().fileManifest(manifestId, filedBy, filingReference);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  amendManifest: (_: unknown, { manifestId, reason }: { manifestId: string; reason: string }) => {
    const result = getDocumentationEngine().amendManifest(manifestId, reason);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  closeDocManifest: (_: unknown, { manifestId }: { manifestId: string }) => {
    const result = getDocumentationEngine().closeManifest(manifestId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- Hardware ----
  registerHardwareDevice: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getHardwareManager().registerDevice({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  updateDeviceStatus: (_: unknown, { deviceId, status }: { deviceId: string; status: string }) => {
    const result = getHardwareManager().updateDeviceStatus(deviceId, status as any);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  heartbeatDevice: (_: unknown, { deviceId }: { deviceId: string }) => {
    const result = getHardwareManager().heartbeat(deviceId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  recordRFID: (_: unknown, { input }: { input: any }) => {
    const result = getHardwareManager().recordRFIDRead(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  recordOCR: (_: unknown, { input }: { input: any }) => {
    const result = getHardwareManager().recordOCRRead(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  validateOCR: (_: unknown, { readId, validatedText, validatedBy }: { readId: string; validatedText: string; validatedBy: string }) => {
    const result = getHardwareManager().validateOCR(readId, validatedText, validatedBy);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  recordWeigh: (_: unknown, { input }: { input: any }) => {
    const result = getHardwareManager().recordWeigh(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- IoT - Sensors ----
  registerSensor: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getIoTManager().registerSensor({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  activateSensor: (_: unknown, { sensorId }: { sensorId: string }) => {
    const result = getIoTManager().activateSensor(sensorId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  deactivateSensor: (_: unknown, { sensorId }: { sensorId: string }) => {
    const result = getIoTManager().deactivateSensor(sensorId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  recordSensorReading: (_: unknown, { input }: { input: any }) => {
    const result = getIoTManager().recordReading(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- IoT - Reefer ----
  createReeferProfile: (_: unknown, { facilityId, input }: { facilityId: string; input: any }, ctx: GQLContext) => {
    const result = getIoTManager().createReeferProfile({ ...input, facilityId, tenantId: tid(ctx) });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  plugInReefer: (_: unknown, { containerId, powerSource }: { containerId: string; powerSource?: string }) => {
    const result = getIoTManager().plugInReefer(containerId, powerSource);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  unplugReefer: (_: unknown, { containerId }: { containerId: string }) => {
    const result = getIoTManager().unplugReefer(containerId);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  acknowledgeReeferAlarm: (_: unknown, { containerId, alarmId, acknowledgedBy }: { containerId: string; alarmId: string; acknowledgedBy: string }) => {
    const result = getIoTManager().acknowledgeReeferAlarm(containerId, alarmId, acknowledgedBy);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  resolveReeferAlarm: (_: unknown, { containerId, alarmId, resolvedBy }: { containerId: string; alarmId: string; resolvedBy: string }) => {
    const result = getIoTManager().resolveReeferAlarm(containerId, alarmId, resolvedBy);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  // ---- IoT - GPS ----
  updateGPS: (_: unknown, { input }: { input: any }) => {
    const result = getIoTManager().updateGPS({
      ...input,
      position: {
        latitude: input.latitude,
        longitude: input.longitude,
        altitude: input.altitude,
        speed: input.speed,
        heading: input.heading,
        timestamp: new Date(),
      },
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },
};

// =============================================================================
// EXPORT
// =============================================================================

export const resolvers = {
  Query,
  Mutation,
  Subscription: subscriptionResolvers,
};
