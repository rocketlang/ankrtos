// =============================================================================
// ankrICD GraphQL Schema - Type Definitions
// =============================================================================

export const typeDefs = `
  scalar DateTime
  scalar JSON
  scalar Decimal

  # ===========================================================================
  # COMMON TYPES
  # ===========================================================================

  type PageInfo {
    total: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
    hasNext: Boolean!
    hasPrevious: Boolean!
  }

  type OperationResult {
    success: Boolean!
    error: String
    errorCode: String
  }

  type Address {
    line1: String!
    line2: String
    city: String!
    state: String!
    country: String!
    postalCode: String!
  }

  type Coordinates {
    latitude: Float!
    longitude: Float!
  }

  input AddressInput {
    line1: String!
    line2: String
    city: String!
    state: String!
    country: String!
    postalCode: String!
  }

  input PaginationInput {
    page: Int = 1
    pageSize: Int = 25
    sortBy: String
    sortOrder: String = "desc"
  }

  # ===========================================================================
  # FACILITY
  # ===========================================================================

  type Facility {
    id: ID!
    tenantId: String!
    code: String!
    name: String!
    type: String!
    status: String!
    address: JSON!
    coordinates: JSON
    portCode: String
    customsCode: String
    capacityTEU: Int!
    currentUtilization: Int
    groundSlots: Int!
    maxStackHeight: Int!
    operatingHours: JSON!
    timeZone: String!
    contacts: JSON!
    features: JSON!
    config: JSON!
    createdAt: DateTime!
    updatedAt: DateTime!

    zones: [FacilityZone!]!
    blocks: [YardBlock!]!
  }

  type FacilityZone {
    id: ID!
    facilityId: ID!
    code: String!
    name: String!
    type: String!
    status: String!
    totalSlots: Int!
    maxStackHeight: Int!
    allowedContainerTypes: [String!]!
    blocks: [YardBlock!]!
  }

  type YardBlock {
    id: ID!
    facilityId: ID!
    zoneId: ID!
    code: String!
    name: String!
    type: String!
    status: String!
    rows: Int!
    slotsPerRow: Int!
    maxTiers: Int!
    occupiedSlots: Int!
    utilizationPercent: Int!
    isReeferCapable: Boolean!
    isHazmatCapable: Boolean!
  }

  input CreateFacilityInput {
    code: String!
    name: String!
    type: String!
    address: JSON!
    capacityTEU: Int!
    groundSlots: Int!
    maxStackHeight: Int = 5
    operatingHours: JSON!
    timeZone: String = "Asia/Kolkata"
    features: JSON
    config: JSON
  }

  input CreateZoneInput {
    facilityId: ID!
    code: String!
    name: String!
    type: String!
    maxStackHeight: Int = 5
    allowedContainerTypes: [String!]
  }

  input CreateBlockInput {
    facilityId: ID!
    zoneId: ID!
    code: String!
    name: String!
    type: String!
    rows: Int!
    slotsPerRow: Int!
    maxTiers: Int = 5
    isReeferCapable: Boolean = false
    isHazmatCapable: Boolean = false
  }

  # ===========================================================================
  # CONTAINER
  # ===========================================================================

  type Container {
    id: ID!
    containerNumber: String!
    isoType: String!
    size: String!
    type: String!
    height: String!
    status: String!
    condition: String!
    owner: String!
    ownerName: String!
    operator: String
    tareWeight: Float!
    grossWeight: Float
    maxPayload: Float!
    currentLocation: JSON
    bookingRef: String
    blNumber: String
    vesselVoyage: String
    customsStatus: String!
    hazmat: JSON
    reefer: JSON
    gateInTime: DateTime
    groundedTime: DateTime
    gateOutTime: DateTime
    freeTimeExpiry: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!

    holds: [ContainerHold!]!
    movements: [ContainerMovement!]!
  }

  type ContainerHold {
    id: ID!
    type: String!
    reason: String!
    placedAt: DateTime!
    placedBy: String!
    releasedAt: DateTime
    releasedBy: String
    priority: String!
  }

  type ContainerMovement {
    id: ID!
    movementType: String!
    fromLocation: JSON
    toLocation: JSON
    equipmentId: ID
    movementTime: DateTime!
    duration: Int
    notes: String
  }

  type ContainerPage {
    data: [Container!]!
    pageInfo: PageInfo!
  }

  type ContainerStats {
    total: Int!
    byStatus: JSON!
    bySize: JSON!
    byType: JSON!
    totalTEU: Int!
    reeferCount: Int!
    reeferPluggedIn: Int!
    hazmatCount: Int!
    onHoldCount: Int!
    overdueCount: Int!
  }

  input RegisterContainerInput {
    containerNumber: String!
    isoType: String!
    owner: String!
    ownerName: String!
    operator: String
    tareWeight: Float!
    maxPayload: Float!
    bookingRef: String
    blNumber: String
    vesselVoyage: String
  }

  input GateInInput {
    containerId: ID!
    truckNumber: String!
    driverName: String!
    sealNumbers: [String!]
    grossWeight: Float
    condition: String
  }

  input GateOutInput {
    containerId: ID!
    truckNumber: String!
    driverName: String!
  }

  input PlaceHoldInput {
    containerId: ID!
    type: String!
    reason: String!
    priority: String = "medium"
    autoRelease: DateTime
  }

  # ===========================================================================
  # GATE
  # ===========================================================================

  type Gate {
    id: ID!
    gateId: String!
    name: String!
    gateType: String!
    totalLanes: Int!
    hasWeighbridge: Boolean!
    hasOCR: Boolean!
    hasRFID: Boolean!
    is24x7: Boolean!
    status: String!
    lanes: [GateLane!]!
  }

  type GateLane {
    id: ID!
    laneNumber: String!
    laneType: String!
    status: String!
    hasOCR: Boolean!
    hasRFID: Boolean!
    vehiclesInQueue: Int!
  }

  type GateTransaction {
    id: ID!
    transactionNumber: String!
    transactionType: String!
    truckNumber: String!
    driverName: String!
    driverPhone: String!
    containerNumber: String
    status: String!
    arrivalTime: DateTime!
    completionTime: DateTime
    totalProcessingMinutes: Int
    ocrCapture: JSON
    weighbridgeData: JSON
    photos: JSON!
  }

  type GateTransactionPage {
    data: [GateTransaction!]!
    pageInfo: PageInfo!
  }

  input RegisterGateInput {
    gateId: String!
    name: String!
    gateType: String = "main"
    hasWeighbridge: Boolean = false
    hasOCR: Boolean = false
    hasRFID: Boolean = false
    is24x7: Boolean = false
  }

  input AddLaneInput {
    gateId: ID!
    laneNumber: String!
    laneType: String!
    hasOCR: Boolean = false
    hasRFID: Boolean = false
  }

  input CreateAppointmentInput {
    appointmentType: String!
    scheduledTime: DateTime!
    windowMinutes: Int = 60
    transporterName: String!
    truckNumber: String!
    driverName: String!
    driverLicense: String!
    driverPhone: String!
    containers: [String!]!
    deliveryOrderNumber: String
    eWayBillNumber: String
  }

  input StartGateInInput {
    gateId: ID!
    laneId: ID!
    truckNumber: String!
    driverName: String!
    driverLicense: String!
    driverPhone: String!
    containerNumber: String
    appointmentId: ID
  }

  input StartGateOutInput {
    gateId: ID!
    laneId: ID!
    truckNumber: String!
    driverName: String!
    driverLicense: String!
    driverPhone: String!
    containerNumber: String
  }

  # ===========================================================================
  # RAIL TERMINAL
  # ===========================================================================

  type RailTrack {
    id: ID!
    trackNumber: String!
    name: String
    trackType: String!
    status: String!
    length: Float!
    wagonCapacity: Int!
    electrified: Boolean!
    gaugeType: String!
    currentRakeId: ID
  }

  type Rake {
    id: ID!
    rakeNumber: String!
    trainNumber: String!
    origin: String!
    originName: String!
    destination: String!
    destinationName: String!
    eta: DateTime!
    ata: DateTime
    etd: DateTime!
    atd: DateTime
    trackNumber: String
    totalWagons: Int!
    totalTEU: Int!
    importContainers: Int!
    exportContainers: Int!
    emptyContainers: Int!
    status: String!
    wagons: [Wagon!]!
  }

  type Wagon {
    id: ID!
    wagonNumber: String!
    wagonType: String!
    position: Int!
    maxLoadCapacity: Float!
    maxContainers: Int!
    containers: JSON!
    currentLoad: Float!
    condition: String!
  }

  type RailTerminalStats {
    totalTracks: Int!
    availableTracks: Int!
    occupiedTracks: Int!
    activeRakes: Int!
    rakesUnloading: Int!
    rakesLoading: Int!
    rakesReadyForDeparture: Int!
    todayExpectedArrivals: Int!
    todayDepartures: Int!
  }

  input RegisterTrackInput {
    trackNumber: String!
    name: String
    trackType: String!
    length: Float!
    wagonCapacity: Int!
    electrified: Boolean = false
    gaugeType: String = "broad"
  }

  input AnnounceRakeInput {
    rakeNumber: String!
    trainNumber: String!
    origin: String!
    originName: String!
    destination: String!
    destinationName: String!
    eta: DateTime!
    etd: DateTime!
    totalWagons: Int
  }

  input AddWagonInput {
    rakeId: ID!
    wagonNumber: String!
    wagonType: String!
    position: Int!
    maxLoadCapacity: Float!
    maxContainers: Int = 2
    tareWeight: Float!
  }

  # ===========================================================================
  # ROAD TRANSPORT
  # ===========================================================================

  type Transporter {
    id: ID!
    code: String!
    name: String!
    legalName: String!
    gstin: String
    status: String!
    fleetSize: Int
    rating: Float
    onTimePercent: Float
  }

  type TruckAppointment {
    id: ID!
    appointmentNumber: String!
    appointmentType: String!
    scheduledTime: DateTime!
    windowStart: DateTime!
    windowEnd: DateTime!
    transporterName: String!
    truckNumber: String!
    driverName: String!
    status: String!
    actualArrival: DateTime
    checkOutTime: DateTime
  }

  type EWayBill {
    id: ID!
    eWayBillNumber: String!
    validFrom: DateTime!
    validTo: DateTime!
    fromGstin: String!
    toGstin: String!
    transportMode: String!
    vehicleNumber: String
    totalValue: Float!
    status: String!
  }

  type RoadTransportStats {
    totalAppointments: Int!
    completed: Int!
    pending: Int!
    inProgress: Int!
    noShows: Int!
    cancelled: Int!
    onTimePercent: Float!
    activeEWayBills: Int!
    expiringEWayBillsToday: Int!
  }

  input RegisterTransporterInput {
    code: String!
    name: String!
    legalName: String!
    gstin: String
    panNumber: String
    address: JSON!
    email: String
    phone: String
  }

  input RegisterEWayBillInput {
    eWayBillNumber: String!
    validFrom: DateTime!
    validTo: DateTime!
    fromGstin: String!
    fromTradeName: String!
    toGstin: String!
    toTradeName: String!
    transportMode: String!
    vehicleNumber: String
    documentType: String!
    documentNumber: String!
    documentDate: DateTime!
    hsnCode: String!
    productDescription: String!
    quantity: Float!
    unit: String!
    taxableValue: Float!
    totalValue: Float!
  }

  # ===========================================================================
  # WATERFRONT
  # ===========================================================================

  type Berth {
    id: ID!
    berthNumber: String!
    name: String
    length: Float!
    depth: Float!
    maxLOA: Float!
    maxDraft: Float!
    status: String!
    currentVesselId: ID
  }

  type VesselVisit {
    id: ID!
    vesselName: String!
    imoNumber: String!
    voyageNumber: String!
    shippingLine: String!
    loa: Float!
    beam: Float!
    draft: Float!
    eta: DateTime!
    ata: DateTime
    etd: DateTime!
    atd: DateTime
    berthNumber: String
    berthSide: String!
    dischargeContainers: Int!
    loadContainers: Int!
    dischargeDone: Int!
    loadDone: Int!
    status: String!
  }

  type QuayCrane {
    id: ID!
    craneName: String!
    craneNumber: String!
    craneType: String!
    outreach: Float!
    liftCapacity: Float!
    status: String!
    movesPerHour: Int
    movesToday: Int
  }

  type WaterfrontStats {
    totalBerths: Int!
    availableBerths: Int!
    occupiedBerths: Int!
    activeVessels: Int!
    vesselsAtAnchorage: Int!
    vesselsWorking: Int!
    totalCranes: Int!
    workingCranes: Int!
    todayDischargeTarget: Int!
    todayLoadTarget: Int!
    todayDischargeDone: Int!
    todayLoadDone: Int!
  }

  input RegisterBerthInput {
    berthNumber: String!
    name: String
    length: Float!
    depth: Float!
    maxLOA: Float!
    maxBeam: Float!
    maxDraft: Float!
  }

  input AnnounceVesselInput {
    vesselName: String!
    imoNumber: String!
    flag: String!
    vesselType: String = "container"
    voyageNumber: String!
    shippingLine: String!
    loa: Float!
    beam: Float!
    draft: Float!
    eta: DateTime!
    etd: DateTime!
    dischargeContainers: Int = 0
    loadContainers: Int = 0
  }

  input RegisterCraneInput {
    craneName: String!
    craneNumber: String!
    craneType: String!
    outreach: Float!
    liftCapacity: Float!
    liftHeight: Float!
    hoistSpeed: Float!
    trolleySpeed: Float!
    spreaderType: String = "single"
  }

  # ===========================================================================
  # EQUIPMENT
  # ===========================================================================

  type Equipment {
    id: ID!
    equipmentNumber: String!
    type: String!
    status: String!
    make: String!
    model: String!
    yearOfManufacture: Int!
    liftCapacity: Float!
    maxStack: Int
    fuelType: String!
    currentFuelLevel: Float
    engineHours: Float!
    telematics: JSON
    notes: String
  }

  type EquipmentFleetStats {
    totalEquipment: Int!
    available: Int!
    inUse: Int!
    maintenance: Int!
    breakdown: Int!
    byType: JSON!
    averageUtilization: Float!
    maintenanceDueCount: Int!
  }

  input RegisterEquipmentInput {
    equipmentNumber: String!
    type: String!
    make: String!
    model: String!
    yearOfManufacture: Int!
    liftCapacity: Float!
    maxReach: Float
    maxStack: Int
    fuelType: String!
    fuelCapacity: Float
    canHandleReefer: Boolean = false
    canHandleHazmat: Boolean = false
    canHandleOOG: Boolean = false
  }

  input ScheduleMaintenanceInput {
    equipmentId: ID!
    type: String!
    maintenanceType: String!
    scheduledDate: DateTime!
    description: String!
    estimatedDuration: Float
  }

  # ===========================================================================
  # BILLING
  # ===========================================================================

  type Customer {
    id: ID!
    code: String!
    name: String!
    legalName: String!
    type: String!
    status: String!
    iecCode: String
    creditLimit: Float!
    currentOutstanding: Float!
    creditStatus: String!
    paymentTerms: Int!
    totalContainersHandled: Int!
    createdAt: DateTime!
  }

  type Tariff {
    id: ID!
    tariffCode: String!
    name: String!
    description: String
    effectiveFrom: DateTime!
    effectiveTo: DateTime
    isActive: Boolean!
    charges: JSON!
  }

  type Invoice {
    id: ID!
    invoiceNumber: String!
    invoiceType: String!
    status: String!
    customerId: ID!
    customerName: String!
    invoiceDate: DateTime!
    dueDate: DateTime!
    lineItems: JSON!
    subtotal: Float!
    cgst: Float!
    sgst: Float!
    igst: Float!
    totalTax: Float!
    totalAmount: Float!
    paidAmount: Float!
    balanceAmount: Float!
    currency: String!
    createdAt: DateTime!
  }

  type Payment {
    id: ID!
    invoiceId: ID!
    paymentDate: DateTime!
    amount: Float!
    paymentMethod: String!
    reference: String
    status: String!
  }

  type DemurrageResult {
    containerId: ID!
    containerNumber: String!
    freeDays: Int!
    chargeableDays: Int!
    totalDemurrage: Float!
    currency: String!
    slabBreakdown: JSON!
  }

  type BillingStats {
    totalCustomers: Int!
    activeCustomers: Int!
    totalInvoices: Int!
    pendingInvoices: Int!
    overdueInvoices: Int!
    totalRevenue: Float!
    totalOutstanding: Float!
    collectionRate: Float!
  }

  input RegisterCustomerInput {
    code: String!
    name: String!
    legalName: String!
    type: String!
    iecCode: String
    address: JSON!
    email: String
    phone: String
    creditLimit: Float = 0
    paymentTerms: Int = 30
  }

  input CreateTariffInput {
    tariffCode: String!
    name: String!
    description: String
    effectiveFrom: DateTime!
    effectiveTo: DateTime
    charges: JSON!
  }

  input CreateInvoiceInput {
    customerId: ID!
    invoiceType: String = "standard"
    lineItems: JSON!
    notes: String
    isInterState: Boolean = false
  }

  input RecordPaymentInput {
    invoiceId: ID!
    amount: Float!
    paymentMethod: String!
    reference: String
    paymentDate: DateTime
  }

  # ===========================================================================
  # CUSTOMS & ICEGATE
  # ===========================================================================

  type BillOfEntry {
    id: ID!
    boeNumber: String
    beType: String!
    status: String!
    importerIEC: String!
    importerName: String!
    blNumber: String!
    blDate: DateTime!
    vesselName: String
    voyageNumber: String
    totalContainers: Int!
    assessableValue: Float!
    totalDuty: Float!
    examinationOrdered: Boolean!
    submittedAt: DateTime
    outOfChargeAt: DateTime
    createdAt: DateTime!
  }

  type ShippingBill {
    id: ID!
    sbNumber: String
    sbType: String!
    status: String!
    exporterIEC: String!
    exporterName: String!
    invoiceNumber: String!
    fobValue: Float!
    totalContainers: Int!
    letExportDate: DateTime
    createdAt: DateTime!
  }

  type CustomsExamination {
    id: ID!
    examinationType: String!
    result: String
    documentType: String!
    documentNumber: String!
    containerNumber: String!
    orderedAt: DateTime!
    completedAt: DateTime
    findings: String
    discrepancies: JSON!
  }

  type CustomsStats {
    totalBOE: Int!
    pendingBOE: Int!
    clearedBOE: Int!
    totalSB: Int!
    pendingSB: Int!
    letExportSB: Int!
    pendingExaminations: Int!
    completedExaminations: Int!
    totalDutyCollected: Float!
  }

  input CreateBOEInput {
    beType: String!
    importerIEC: String!
    importerName: String!
    importerGstin: String
    importerAddress: JSON!
    countryOfOrigin: String!
    countryOfConsignment: String!
    portOfLoading: String!
    portOfDischarge: String!
    portOfRegistration: String!
    transportMode: String!
    blNumber: String!
    blDate: DateTime!
    blType: String = "direct"
    arrivalDate: DateTime!
    containers: JSON!
    lineItems: JSON!
    invoiceValue: Float!
    invoiceCurrency: String!
    exchangeRate: Float!
  }

  input CreateSBInput {
    sbType: String!
    exporterIEC: String!
    exporterName: String!
    exporterGstin: String
    exporterAddress: JSON!
    buyerName: String!
    buyerAddress: JSON!
    buyerCountry: String!
    portOfLoading: String!
    portOfDischarge: String!
    finalDestination: String!
    countryOfDestination: String!
    invoiceNumber: String!
    invoiceDate: DateTime!
    invoiceValue: Float!
    invoiceCurrency: String!
    exchangeRate: Float!
    transportMode: String!
    containers: JSON!
    lineItems: JSON!
  }

  # ===========================================================================
  # ANALYTICS
  # ===========================================================================

  type TerminalKPIs {
    facilityId: ID!
    timestamp: DateTime!
    totalContainers: Int!
    totalTEU: Int!
    yardUtilization: Float!
    gateTransactionsToday: Int!
    averageGateTurnaround: Float!
    activeRakes: Int!
    activeVessels: Int!
    equipmentUtilization: Float!
    revenueToday: Float!
    pendingCustomsClearance: Int!
  }

  type DwellTimeAnalytics {
    facilityId: ID!
    totalContainers: Int!
    averageDwellDays: Float!
    medianDwellDays: Float!
    maxDwellDays: Float!
    distribution: JSON!
  }

  type OperationsDashboard {
    facilityId: ID!
    timestamp: DateTime!
    containers: ContainerStats!
    rail: RailTerminalStats!
    road: RoadTransportStats!
    waterfront: WaterfrontStats!
    equipment: EquipmentFleetStats!
    billing: BillingStats!
    customs: CustomsStats!
  }

  type PerformanceScorecard {
    facilityId: ID!
    period: String!
    overallGrade: String!
    overallScore: Float!
    categories: JSON!
  }

  # ===========================================================================
  # OPERATIONS (Stuffing / Destuffing / LCL / FCL / Cross-dock / Inspection)
  # ===========================================================================

  type StuffingOperation {
    id: ID!
    operationNumber: String!
    facilityId: ID!
    containerId: ID!
    containerNumber: String!
    containerSize: String!
    stuffingType: String!
    status: String!
    cargoItems: JSON!
    totalPackages: Int!
    totalGrossWeight: Float!
    totalVolume: Float
    volumeUtilization: Float
    weightUtilization: Float
    warehouseId: ID
    dockDoor: String
    bookingRef: String
    blNumber: String
    supervisorName: String
    plannedStartTime: DateTime
    actualStartTime: DateTime
    actualEndTime: DateTime
    sealNumber: String
    createdAt: DateTime!
  }

  type DestuffingOperation {
    id: ID!
    operationNumber: String!
    facilityId: ID!
    containerId: ID!
    containerNumber: String!
    containerSize: String!
    destuffingType: String!
    status: String!
    cargoItems: JSON!
    totalPackagesExpected: Int!
    totalPackagesReceived: Int!
    totalGrossWeightExpected: Float!
    totalGrossWeightReceived: Float!
    hasDiscrepancy: Boolean!
    shortages: JSON!
    damages: JSON!
    sealIntact: Boolean
    originalSealNumber: String
    tallyClerkName: String
    actualStartTime: DateTime
    actualEndTime: DateTime
    createdAt: DateTime!
  }

  type LCLConsolidation {
    id: ID!
    consolidationNumber: String!
    facilityId: ID!
    status: String!
    containerNumber: String
    containerSize: String!
    totalConsignments: Int!
    totalPackages: Int!
    totalWeight: Float!
    totalVolume: Float!
    weightUtilization: Float!
    volumeUtilization: Float!
    portOfLoading: String!
    portOfDischarge: String!
    masterBlNumber: String
    cutoffDate: DateTime
    stuffingDate: DateTime
    consignments: JSON!
    createdAt: DateTime!
  }

  type FCLOperation {
    id: ID!
    operationNumber: String!
    facilityId: ID!
    operationType: String!
    status: String!
    containerId: ID!
    containerNumber: String!
    fromLocation: String!
    toLocation: String!
    transportMode: String!
    blNumber: String
    plannedDate: DateTime
    completedDate: DateTime
    createdAt: DateTime!
  }

  type CrossDockOperation {
    id: ID!
    operationNumber: String!
    facilityId: ID!
    status: String!
    inboundContainerNumber: String
    inboundTransportMode: String!
    outboundContainerNumber: String
    outboundTransportMode: String!
    totalPackages: Int!
    totalWeight: Float!
    stagingArea: String
    dwellTimeMinutes: Int
    receivedAt: DateTime
    dispatchedAt: DateTime
    createdAt: DateTime!
  }

  type CargoInspection {
    id: ID!
    inspectionNumber: String!
    facilityId: ID!
    inspectionType: String!
    status: String!
    result: String!
    containerId: ID
    containerNumber: String
    inspectorName: String!
    findings: String!
    totalItems: Int!
    passedItems: Int!
    failedItems: Int!
    declaredWeight: Float
    actualWeight: Float
    weightVariance: Float
    scheduledDate: DateTime
    completedAt: DateTime
    createdAt: DateTime!
  }

  type OperationsStats {
    date: DateTime!
    stuffing: JSON!
    destuffing: JSON!
    lcl: JSON!
    fcl: JSON!
    crossDock: JSON!
    inspections: JSON!
  }

  # ===========================================================================
  # DOCUMENTATION (B/L, D/O, EDI, Manifest)
  # ===========================================================================

  type BillOfLading {
    id: ID!
    blNumber: String!
    blType: String!
    status: String!
    facilityId: ID!
    shipperName: String!
    consigneeName: String!
    vesselName: String!
    voyageNumber: String!
    portOfLoading: String!
    portOfDischarge: String!
    containers: JSON!
    totalPackages: Int!
    totalGrossWeight: Float!
    cargoDescription: String!
    freightTerms: String!
    freightAmount: Float
    bookingNumber: String
    issuedDate: DateTime
    onBoardDate: DateTime
    createdAt: DateTime!
  }

  type DeliveryOrder {
    id: ID!
    doNumber: String!
    doType: String!
    status: String!
    facilityId: ID!
    blNumber: String!
    containerNumber: String!
    issuedTo: String!
    packages: Int!
    grossWeight: Float!
    cargoDescription: String!
    validFrom: DateTime!
    validUntil: DateTime!
    chargesCleared: Boolean!
    customsCleared: Boolean!
    verified: Boolean!
    pinCode: String
    deliveryDate: DateTime
    createdAt: DateTime!
  }

  type EDIMessage {
    id: ID!
    messageId: String!
    facilityId: ID!
    messageType: String!
    direction: String!
    status: String!
    senderId: String!
    receiverId: String!
    vesselName: String
    voyageNumber: String
    containerNumber: String
    sentAt: DateTime
    acknowledgedAt: DateTime
    rejectedAt: DateTime
    rejectionReason: String
    createdAt: DateTime!
  }

  type DocManifest {
    id: ID!
    manifestNumber: String!
    manifestType: String!
    status: String!
    facilityId: ID!
    vesselName: String!
    voyageNumber: String!
    portOfLoading: String!
    portOfDischarge: String!
    totalItems: Int!
    totalPackages: Int!
    totalWeight: Float!
    totalContainers: Int!
    filedDate: DateTime
    filingReference: String
    items: JSON!
    createdAt: DateTime!
  }

  type DocumentationStats {
    date: DateTime!
    billsOfLading: JSON!
    deliveryOrders: JSON!
    ediMessages: JSON!
    manifests: JSON!
  }

  # ===========================================================================
  # HARDWARE (RFID, OCR, Weighbridge, Scanners, Printers)
  # ===========================================================================

  type HardwareDevice {
    id: ID!
    deviceCode: String!
    deviceType: String!
    name: String!
    status: String!
    facilityId: ID!
    locationDescription: String
    gateId: ID
    laneId: ID
    ipAddress: String
    manufacturer: String
    model: String
    lastHeartbeat: DateTime
    lastReadTime: DateTime
    totalReads: Int!
    errorCount: Int!
    createdAt: DateTime!
  }

  type RFIDRead {
    id: ID!
    deviceId: ID!
    tagId: String!
    tagType: String!
    rssi: Int
    readTime: DateTime!
    entityNumber: String
    direction: String
  }

  type OCRRead {
    id: ID!
    deviceId: ID!
    captureType: String!
    capturedText: String!
    confidence: Float!
    readTime: DateTime!
    imageUrl: String
    validated: Boolean!
    validatedText: String
  }

  type WeighbridgeRead {
    id: ID!
    deviceId: ID!
    readType: String!
    weight: Float!
    unit: String!
    stable: Boolean!
    readTime: DateTime!
    vehicleNumber: String
    containerNumber: String
    overweight: Boolean!
    overweightAmount: Float
  }

  type HardwareStats {
    date: DateTime!
    totalDevices: Int!
    online: Int!
    offline: Int!
    error: Int!
    rfid: JSON!
    ocr: JSON!
    weighbridge: JSON!
    printers: JSON!
  }

  # ===========================================================================
  # IOT (Sensors, Reefer, GPS, Environmental)
  # ===========================================================================

  type IoTSensor {
    id: ID!
    sensorCode: String!
    sensorType: String!
    name: String!
    status: String!
    facilityId: ID!
    attachedTo: String
    attachedToType: String
    readingInterval: Int!
    alertThresholdMin: Float
    alertThresholdMax: Float
    unit: String
    batteryLevel: Int
    lastReadingTime: DateTime
    createdAt: DateTime!
  }

  type SensorReading {
    id: ID!
    sensorId: ID!
    sensorType: String!
    value: Float!
    unit: String!
    timestamp: DateTime!
    isAlert: Boolean!
    alertType: String
    alertMessage: String
    latitude: Float
    longitude: Float
  }

  type ReeferProfile {
    id: ID!
    containerId: ID!
    containerNumber: String!
    setTemperature: Float!
    minTemperature: Float!
    maxTemperature: Float!
    currentTemperature: Float
    currentHumidity: Float
    powerStatus: String!
    compressorRunning: Boolean!
    doorStatus: String!
    activeAlarmCount: Int!
    excursionCount: Int!
    temperatureHistory: JSON!
    createdAt: DateTime!
  }

  type GPSTrack {
    id: ID!
    entityType: String!
    entityId: ID!
    entityNumber: String!
    currentPosition: JSON!
    lastUpdated: DateTime!
    insideGeofence: Boolean!
    totalDistance: Float!
    idleTime: Float!
    movingTime: Float!
  }

  type IoTStats {
    date: DateTime!
    sensors: JSON!
    readings: JSON!
    reefer: JSON!
    gps: JSON!
    environmental: JSON!
  }

  # ===========================================================================
  # INPUT TYPES - OPERATIONS
  # ===========================================================================

  input CreateStuffingInput {
    containerId: ID!
    containerNumber: String!
    containerSize: String!
    containerType: String!
    isoType: String!
    stuffingType: String
    cargoItems: JSON
    bookingRef: String
    blNumber: String
    customerId: ID
    warehouseId: ID
    dockDoor: String
    plannedStartTime: DateTime
    supervisorName: String
  }

  input CreateDestuffingInput {
    containerId: ID!
    containerNumber: String!
    containerSize: String!
    destuffingType: String
    totalPackagesExpected: Int!
    totalGrossWeightExpected: Float!
    blNumber: String
    billOfEntryId: ID
    customerId: ID
    warehouseId: ID
    dockDoor: String
    plannedStartTime: DateTime
    supervisorName: String
    originalSealNumber: String
  }

  input CreateConsolidationInput {
    containerSize: String!
    containerType: String
    portOfLoading: String!
    portOfDischarge: String!
    finalDestination: String
    cutoffDate: DateTime
    maxWeight: Float
    maxVolume: Float
  }

  input AddConsignmentInput {
    consolidationId: ID!
    consignmentNumber: String!
    shipperId: ID!
    shipperName: String!
    consigneeName: String!
    cargoItems: JSON!
    packages: Int!
    grossWeight: Float!
    volume: Float!
    houseBlNumber: String
    shippingBillNumber: String
  }

  input CreateFCLOperationInput {
    containerId: ID!
    containerNumber: String!
    containerSize: String!
    operationType: String!
    fromLocation: String!
    toLocation: String!
    transportMode: String!
    blNumber: String
    deliveryOrderId: String
    bookingRef: String
    customerId: ID
    plannedDate: DateTime
  }

  input CreateCrossDockInput {
    inboundContainerNumber: String
    inboundTransportMode: String!
    inboundRef: String
    outboundTransportMode: String!
    outboundRef: String
    cargoItems: JSON
    totalPackages: Int
    totalWeight: Float
    stagingArea: String
    plannedReceiveTime: DateTime
    plannedDispatchTime: DateTime
  }

  input CreateInspectionInput {
    inspectionType: String!
    containerId: ID
    containerNumber: String
    operationId: ID
    operationType: String
    inspectorId: String!
    inspectorName: String!
    inspectorOrganization: String
    scheduledDate: DateTime
    sealNumber: String
    declaredWeight: Float
  }

  # ===========================================================================
  # INPUT TYPES - DOCUMENTATION
  # ===========================================================================

  input CreateBLInput {
    blType: String!
    shipperId: ID!
    shipperName: String!
    shipperAddress: String!
    consigneeName: String!
    consigneeAddress: String!
    consigneeId: ID
    notifyPartyName: String
    notifyPartyAddress: String
    vesselName: String!
    voyageNumber: String!
    portOfLoading: String!
    portOfDischarge: String!
    placeOfReceipt: String
    placeOfDelivery: String
    containers: JSON!
    cargoDescription: String!
    marksAndNumbers: String
    hsCode: String
    freightTerms: String!
    freightAmount: Float
    freightCurrency: String
    bookingNumber: String
    masterBlNumber: String
    numberOfOriginals: Int
  }

  input CreateDOInput {
    doType: String!
    blNumber: String!
    containerNumber: String!
    containerSize: String!
    containerType: String!
    issuedTo: String!
    issuedToId: ID
    packages: Int!
    grossWeight: Float!
    cargoDescription: String!
    validFrom: DateTime
    validUntil: DateTime!
    billOfEntryNumber: String
    iGMNumber: String
    iGMItemNumber: String
    shippingLineAgent: String
    chaName: String
    chaLicenseNumber: String
    sealNumber: String
  }

  input SendEDIInput {
    messageType: String!
    senderId: String!
    senderName: String
    receiverId: String!
    receiverName: String
    rawContent: String!
    parsedData: JSON
    vesselName: String
    voyageNumber: String
    containerNumber: String
    blNumber: String
    bookingNumber: String
  }

  input CreateManifestInput {
    manifestType: String!
    vesselName: String!
    voyageNumber: String!
    imoNumber: String
    vesselFlag: String
    portOfLoading: String!
    portOfDischarge: String!
    lastPort: String
    nextPort: String
    eta: DateTime
    etd: DateTime
  }

  input AddManifestItemInput {
    manifestId: ID!
    blNumber: String!
    blType: String
    shipperName: String!
    consigneeName: String!
    notifyParty: String
    cargoDescription: String!
    packages: Int!
    packageType: String
    grossWeight: Float!
    netWeight: Float
    volume: Float
    marksAndNumbers: String
    hsCode: String
    containerNumbers: [String!]!
    origin: String
    destination: String
  }

  # ===========================================================================
  # INPUT TYPES - HARDWARE
  # ===========================================================================

  input RegisterHardwareDeviceInput {
    deviceType: String!
    deviceCode: String!
    name: String!
    locationId: String
    locationDescription: String
    gateId: ID
    laneId: ID
    ipAddress: String
    port: Int
    protocol: String
    serialPort: String
    manufacturer: String
    model: String
    serialNumber: String
  }

  input RecordRFIDInput {
    deviceId: ID!
    tagId: String!
    tagType: String!
    rssi: Int
    antennaPort: Int
    gateId: ID
    laneId: ID
    direction: String
  }

  input RecordOCRInput {
    deviceId: ID!
    captureType: String!
    capturedText: String!
    confidence: Float!
    imageUrl: String
    gateId: ID
    laneId: ID
    transactionId: ID
  }

  input RecordWeighInput {
    deviceId: ID!
    readType: String!
    weight: Float!
    unit: String
    vehicleNumber: String
    containerNumber: String
    transactionId: ID
    gateId: ID
    maxAllowed: Float
  }

  # ===========================================================================
  # INPUT TYPES - IOT
  # ===========================================================================

  input RegisterSensorInput {
    sensorCode: String!
    sensorType: String!
    name: String!
    attachedTo: String
    attachedToType: String
    attachedToId: ID
    readingInterval: Int
    alertThresholdMin: Float
    alertThresholdMax: Float
    unit: String
    connectionType: String
    deviceEUI: String
  }

  input RecordReadingInput {
    sensorId: ID!
    value: Float!
    unit: String
    quality: String
    latitude: Float
    longitude: Float
    altitude: Float
    speed: Float
    heading: Float
  }

  input CreateReeferProfileInput {
    containerId: ID!
    containerNumber: String!
    setTemperature: Float!
    temperatureUnit: String
    minTemperature: Float!
    maxTemperature: Float!
    setHumidity: Float
    ventSetting: Float
    monitoringInterval: Int
  }

  input UpdateGPSInput {
    entityType: String!
    entityId: ID!
    entityNumber: String!
    facilityId: ID!
    latitude: Float!
    longitude: Float!
    altitude: Float
    speed: Float
    heading: Float
  }

  # ===========================================================================
  # SYSTEM
  # ===========================================================================

  type SystemInfo {
    version: String!
    packageName: String!
    totalEventTypes: Int!
    totalFeatureFlags: Int!
    presets: [String!]!
  }

  type HealthStatus {
    status: String!
    version: String!
    timestamp: DateTime!
    engines: JSON!
  }

  # ===========================================================================
  # ROOT QUERY
  # ===========================================================================

  type Query {
    # System
    systemInfo: SystemInfo!
    healthStatus: HealthStatus!

    # Facility
    facility(id: ID!): Facility
    facilities(tenantId: String!): [Facility!]!

    # Container
    container(id: ID!): Container
    containerByNumber(containerNumber: String!): Container
    containers(facilityId: ID!, status: String, page: PaginationInput): ContainerPage!
    containerStats(facilityId: ID!): ContainerStats!

    # Gate
    gate(id: ID!): Gate
    gates(facilityId: ID!): [Gate!]!
    gateTransaction(id: ID!): GateTransaction
    gateTransactions(facilityId: ID!, status: String, page: PaginationInput): GateTransactionPage!

    # Rail
    railTracks(facilityId: ID!): [RailTrack!]!
    rake(id: ID!): Rake
    rakes(facilityId: ID!, status: String): [Rake!]!
    railTerminalStats(facilityId: ID!): RailTerminalStats!

    # Road
    transporters(facilityId: ID!, status: String): [Transporter!]!
    truckAppointments(facilityId: ID!, date: DateTime, status: String): [TruckAppointment!]!
    eWayBills(facilityId: ID!, status: String): [EWayBill!]!
    roadTransportStats(facilityId: ID!): RoadTransportStats!

    # Waterfront
    berths(facilityId: ID!): [Berth!]!
    vesselVisit(id: ID!): VesselVisit
    vesselVisits(facilityId: ID!, status: String): [VesselVisit!]!
    quayCranes(facilityId: ID!): [QuayCrane!]!
    waterfrontStats(facilityId: ID!): WaterfrontStats!

    # Equipment
    equipment(facilityId: ID!, type: String, status: String): [Equipment!]!
    equipmentById(id: ID!): Equipment
    equipmentFleetStats(facilityId: ID!): EquipmentFleetStats!

    # Billing
    customer(id: ID!): Customer
    customers(facilityId: ID!, type: String, status: String): [Customer!]!
    tariffs(facilityId: ID!, active: Boolean): [Tariff!]!
    invoice(id: ID!): Invoice
    invoices(facilityId: ID!, customerId: ID, status: String): [Invoice!]!
    calculateDemurrage(facilityId: ID!, containerId: ID!): DemurrageResult
    billingStats(facilityId: ID!): BillingStats!

    # Customs
    billOfEntry(id: ID!): BillOfEntry
    billsOfEntry(facilityId: ID!, status: String): [BillOfEntry!]!
    shippingBill(id: ID!): ShippingBill
    shippingBills(facilityId: ID!, status: String): [ShippingBill!]!
    examination(id: ID!): CustomsExamination
    customsStats(facilityId: ID!): CustomsStats!

    # Analytics
    terminalKPIs(facilityId: ID!): TerminalKPIs!
    dwellTimeAnalytics(facilityId: ID!): DwellTimeAnalytics!
    operationsDashboard(facilityId: ID!): OperationsDashboard!
    performanceScorecard(facilityId: ID!, period: String): PerformanceScorecard!

    # Operations
    stuffingOperation(id: ID!): StuffingOperation
    stuffingOperations(facilityId: ID!, status: String): [StuffingOperation!]!
    destuffingOperation(id: ID!): DestuffingOperation
    destuffingOperations(facilityId: ID!, status: String): [DestuffingOperation!]!
    lclConsolidation(id: ID!): LCLConsolidation
    lclConsolidations(facilityId: ID!, status: String): [LCLConsolidation!]!
    fclOperation(id: ID!): FCLOperation
    fclOperations(facilityId: ID!, status: String, operationType: String): [FCLOperation!]!
    crossDockOperation(id: ID!): CrossDockOperation
    crossDockOperations(facilityId: ID!, status: String): [CrossDockOperation!]!
    cargoInspection(id: ID!): CargoInspection
    cargoInspections(facilityId: ID!, status: String, inspectionType: String): [CargoInspection!]!
    operationsStats(facilityId: ID!): OperationsStats!

    # Documentation
    billOfLadingById(id: ID!): BillOfLading
    billOfLadingByNumber(blNumber: String!): BillOfLading
    billsOfLading(facilityId: ID!, status: String, blType: String): [BillOfLading!]!
    deliveryOrder(id: ID!): DeliveryOrder
    deliveryOrderByNumber(doNumber: String!): DeliveryOrder
    deliveryOrders(facilityId: ID!, status: String, blNumber: String): [DeliveryOrder!]!
    ediMessage(id: ID!): EDIMessage
    ediMessages(facilityId: ID!, messageType: String, direction: String, status: String): [EDIMessage!]!
    docManifest(id: ID!): DocManifest
    docManifests(facilityId: ID!, manifestType: String, status: String): [DocManifest!]!
    documentationStats(facilityId: ID!): DocumentationStats!

    # Hardware
    hardwareDevice(id: ID!): HardwareDevice
    hardwareDevices(facilityId: ID!, deviceType: String, status: String): [HardwareDevice!]!
    rfidReads(deviceId: ID!, limit: Int): [RFIDRead!]!
    weighbridgeReads(deviceId: ID!, limit: Int): [WeighbridgeRead!]!
    hardwareStats(facilityId: ID!): HardwareStats!

    # IoT
    iotSensor(id: ID!): IoTSensor
    iotSensors(facilityId: ID!, sensorType: String, status: String): [IoTSensor!]!
    sensorReadings(sensorId: ID!, limit: Int): [SensorReading!]!
    sensorAlerts(facilityId: ID!, limit: Int): [SensorReading!]!
    reeferProfile(containerId: ID!): ReeferProfile
    reeferProfiles(facilityId: ID!): [ReeferProfile!]!
    gpsTrack(entityType: String!, entityId: ID!): GPSTrack
    gpsTracks(facilityId: ID!): [GPSTrack!]!
    iotStats(facilityId: ID!): IoTStats!
  }

  # ===========================================================================
  # ROOT MUTATION
  # ===========================================================================

  type Mutation {
    # Facility
    createFacility(tenantId: String!, input: CreateFacilityInput!): Facility!
    createZone(tenantId: String!, input: CreateZoneInput!): FacilityZone!
    createBlock(tenantId: String!, input: CreateBlockInput!): YardBlock!

    # Container
    registerContainer(facilityId: ID!, input: RegisterContainerInput!): Container!
    gateInContainer(facilityId: ID!, input: GateInInput!): Container!
    groundContainer(facilityId: ID!, containerId: ID!, location: JSON!): Container!
    pickContainer(facilityId: ID!, containerId: ID!): Container!
    gateOutContainer(facilityId: ID!, input: GateOutInput!): Container!
    placeHold(facilityId: ID!, input: PlaceHoldInput!): Container!
    releaseHold(facilityId: ID!, containerId: ID!, holdId: ID!): Container!

    # Gate
    registerGate(facilityId: ID!, input: RegisterGateInput!): Gate!
    addLane(facilityId: ID!, input: AddLaneInput!): Gate!
    createAppointment(facilityId: ID!, input: CreateAppointmentInput!): TruckAppointment!
    startGateIn(facilityId: ID!, input: StartGateInInput!): GateTransaction!
    completeGateIn(facilityId: ID!, transactionId: ID!): GateTransaction!
    startGateOut(facilityId: ID!, input: StartGateOutInput!): GateTransaction!
    completeGateOut(facilityId: ID!, transactionId: ID!): GateTransaction!

    # Rail
    registerTrack(facilityId: ID!, input: RegisterTrackInput!): RailTrack!
    announceRake(facilityId: ID!, input: AnnounceRakeInput!): Rake!
    addWagon(facilityId: ID!, input: AddWagonInput!): Wagon!
    assignTrack(facilityId: ID!, rakeId: ID!, trackId: ID!): Rake!
    arriveRake(facilityId: ID!, rakeId: ID!): Rake!
    startUnloading(facilityId: ID!, rakeId: ID!): Rake!
    completeUnloading(facilityId: ID!, rakeId: ID!): Rake!
    startLoading(facilityId: ID!, rakeId: ID!): Rake!
    completeLoading(facilityId: ID!, rakeId: ID!): Rake!
    departRake(facilityId: ID!, rakeId: ID!): Rake!

    # Road
    registerTransporter(facilityId: ID!, input: RegisterTransporterInput!): Transporter!
    registerEWayBill(facilityId: ID!, input: RegisterEWayBillInput!): EWayBill!

    # Waterfront
    registerBerth(facilityId: ID!, input: RegisterBerthInput!): Berth!
    announceVessel(facilityId: ID!, input: AnnounceVesselInput!): VesselVisit!
    assignBerth(facilityId: ID!, vesselVisitId: ID!, berthId: ID!): VesselVisit!
    arriveVessel(facilityId: ID!, vesselVisitId: ID!): VesselVisit!
    startDischarge(facilityId: ID!, vesselVisitId: ID!): VesselVisit!
    completeDischarge(facilityId: ID!, vesselVisitId: ID!): VesselVisit!
    startVesselLoading(facilityId: ID!, vesselVisitId: ID!): VesselVisit!
    completeVesselLoading(facilityId: ID!, vesselVisitId: ID!): VesselVisit!
    departVessel(facilityId: ID!, vesselVisitId: ID!): VesselVisit!
    registerCrane(facilityId: ID!, input: RegisterCraneInput!): QuayCrane!

    # Equipment
    registerEquipment(facilityId: ID!, input: RegisterEquipmentInput!): Equipment!
    updateEquipmentStatus(facilityId: ID!, equipmentId: ID!, status: String!): Equipment!
    scheduleMaintenance(facilityId: ID!, input: ScheduleMaintenanceInput!): OperationResult!

    # Billing
    registerCustomer(facilityId: ID!, input: RegisterCustomerInput!): Customer!
    createTariff(facilityId: ID!, input: CreateTariffInput!): Tariff!
    createInvoice(facilityId: ID!, input: CreateInvoiceInput!): Invoice!
    approveInvoice(facilityId: ID!, invoiceId: ID!): Invoice!
    recordPayment(facilityId: ID!, input: RecordPaymentInput!): Payment!

    # Customs
    createBillOfEntry(facilityId: ID!, input: CreateBOEInput!): BillOfEntry!
    submitBOE(facilityId: ID!, boeId: ID!): BillOfEntry!
    assessBOE(facilityId: ID!, boeId: ID!, assessableValue: Float!, totalDuty: Float!): BillOfEntry!
    payDuty(facilityId: ID!, boeId: ID!, amount: Float!): BillOfEntry!
    outOfCharge(facilityId: ID!, boeId: ID!): BillOfEntry!
    createShippingBill(facilityId: ID!, input: CreateSBInput!): ShippingBill!
    submitSB(facilityId: ID!, sbId: ID!): ShippingBill!
    letExport(facilityId: ID!, sbId: ID!): ShippingBill!
    orderExamination(facilityId: ID!, documentType: String!, documentId: ID!, containerId: ID!, examinationType: String!): CustomsExamination!

    # Operations - Stuffing
    createStuffing(facilityId: ID!, input: CreateStuffingInput!): StuffingOperation!
    startStuffing(operationId: ID!): StuffingOperation!
    completeStuffing(operationId: ID!, sealNumber: String): StuffingOperation!
    pauseStuffing(operationId: ID!, reason: String!): StuffingOperation!
    cancelStuffing(operationId: ID!, reason: String!): StuffingOperation!

    # Operations - Destuffing
    createDestuffing(facilityId: ID!, input: CreateDestuffingInput!): DestuffingOperation!
    startDestuffing(operationId: ID!, sealIntact: Boolean): DestuffingOperation!
    completeDestuffing(operationId: ID!): DestuffingOperation!

    # Operations - LCL Consolidation
    createConsolidation(facilityId: ID!, input: CreateConsolidationInput!): LCLConsolidation!
    addConsignment(input: AddConsignmentInput!): LCLConsolidation!
    closeConsolidation(consolidationId: ID!, containerId: ID!, containerNumber: String!, masterBlNumber: String): LCLConsolidation!

    # Operations - FCL
    createFCLOperation(facilityId: ID!, input: CreateFCLOperationInput!): FCLOperation!
    startFCLOperation(operationId: ID!): FCLOperation!
    completeFCLOperation(operationId: ID!, remarks: String): FCLOperation!

    # Operations - Cross-Dock
    createCrossDock(facilityId: ID!, input: CreateCrossDockInput!): CrossDockOperation!
    receiveCrossDock(operationId: ID!): CrossDockOperation!
    sortCrossDock(operationId: ID!): CrossDockOperation!
    dispatchCrossDock(operationId: ID!, outboundContainerNumber: String): CrossDockOperation!

    # Operations - Inspection
    createInspection(facilityId: ID!, input: CreateInspectionInput!): CargoInspection!
    startInspection(inspectionId: ID!): CargoInspection!
    completeInspection(inspectionId: ID!, result: String!, findings: String!, actualWeight: Float): CargoInspection!

    # Documentation - Bill of Lading
    createBillOfLading(facilityId: ID!, input: CreateBLInput!): BillOfLading!
    issueBL(blId: ID!): BillOfLading!
    surrenderBL(blId: ID!): BillOfLading!
    accomplishBL(blId: ID!): BillOfLading!

    # Documentation - Delivery Order
    createDeliveryOrder(facilityId: ID!, input: CreateDOInput!): DeliveryOrder!
    issueDO(doId: ID!): DeliveryOrder!
    clearDOCharges(doId: ID!): DeliveryOrder!
    clearDOCustoms(doId: ID!): DeliveryOrder!
    verifyDO(doId: ID!, verifiedBy: String!, pinCode: String): DeliveryOrder!
    recordDODelivery(doId: ID!, receivedBy: String!): DeliveryOrder!

    # Documentation - EDI
    sendEDIMessage(facilityId: ID!, input: SendEDIInput!): EDIMessage!
    receiveEDIMessage(facilityId: ID!, input: SendEDIInput!): EDIMessage!
    acknowledgeEDI(messageId: ID!): EDIMessage!
    rejectEDI(messageId: ID!, reason: String!): EDIMessage!

    # Documentation - Manifest
    createDocManifest(facilityId: ID!, input: CreateManifestInput!): DocManifest!
    addManifestItem(input: AddManifestItemInput!): DocManifest!
    fileManifest(manifestId: ID!, filedBy: String!, filingReference: String): DocManifest!
    amendManifest(manifestId: ID!, reason: String!): DocManifest!
    closeDocManifest(manifestId: ID!): DocManifest!

    # Hardware
    registerHardwareDevice(facilityId: ID!, input: RegisterHardwareDeviceInput!): HardwareDevice!
    updateDeviceStatus(deviceId: ID!, status: String!): HardwareDevice!
    heartbeatDevice(deviceId: ID!): HardwareDevice!
    recordRFID(input: RecordRFIDInput!): RFIDRead!
    recordOCR(input: RecordOCRInput!): OCRRead!
    validateOCR(readId: ID!, validatedText: String!, validatedBy: String!): OCRRead!
    recordWeigh(input: RecordWeighInput!): WeighbridgeRead!

    # IoT - Sensors
    registerSensor(facilityId: ID!, input: RegisterSensorInput!): IoTSensor!
    activateSensor(sensorId: ID!): IoTSensor!
    deactivateSensor(sensorId: ID!): IoTSensor!
    recordSensorReading(input: RecordReadingInput!): SensorReading!

    # IoT - Reefer
    createReeferProfile(facilityId: ID!, input: CreateReeferProfileInput!): ReeferProfile!
    plugInReefer(containerId: ID!, powerSource: String): ReeferProfile!
    unplugReefer(containerId: ID!): ReeferProfile!
    acknowledgeReeferAlarm(containerId: ID!, alarmId: ID!, acknowledgedBy: String!): ReeferProfile!
    resolveReeferAlarm(containerId: ID!, alarmId: ID!, resolvedBy: String!): ReeferProfile!

    # IoT - GPS
    updateGPS(input: UpdateGPSInput!): GPSTrack!
  }

  # ===========================================================================
  # SUBSCRIPTIONS
  # ===========================================================================

  type Subscription {
    containerStatusChanged(facilityId: ID!): Container!
    containerMoved(facilityId: ID!): ContainerMovement!
    gateTransactionUpdated(facilityId: ID!): GateTransaction!
    rakeStatusChanged(facilityId: ID!): Rake!
    vesselStatusChanged(facilityId: ID!): VesselVisit!
    equipmentAlert(facilityId: ID!): Equipment!
    yardCapacityAlert(facilityId: ID!): JSON!
    reeferAlarm(facilityId: ID!): ReeferProfile!
    sensorAlert(facilityId: ID!): SensorReading!
    operationCompleted(facilityId: ID!): JSON!
    documentIssued(facilityId: ID!): JSON!
  }
`;
