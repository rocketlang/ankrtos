// Rail Terminal Engine for ankrICD
// Comprehensive rail operations management - Rake handling, Wagon management, Track allocation

import { v4 as uuidv4 } from 'uuid';
import type {
  UUID,
  OperationResult,
  PaginatedResult,
} from '../types/common';
import type {
  RailTrack,
  RailTrackType,
  RailTrackStatus,
  Rake,
  RakeStatus,
  Wagon,
  IndianWagonType,
  WagonContainer,
  RailManifest,
  RailManifestContainer,
} from '../types/transport';
import type { Container } from '../types/container';
import { emit } from '../core';
import { getContainerEngine } from '../containers';
import { getYardEngine } from '../yard';

// ============================================================================
// RAIL ENGINE
// ============================================================================

export class RailEngine {
  private static instance: RailEngine | null = null;

  // In-memory stores (would be database in production)
  private tracks: Map<UUID, RailTrack> = new Map();
  private rakes: Map<UUID, Rake> = new Map();
  private wagons: Map<UUID, Wagon> = new Map();
  private manifests: Map<UUID, RailManifest> = new Map();

  private constructor() {}

  static getInstance(): RailEngine {
    if (!RailEngine.instance) {
      RailEngine.instance = new RailEngine();
    }
    return RailEngine.instance;
  }

  // Reset for testing
  static resetInstance(): void {
    RailEngine.instance = null;
  }

  // ============================================================================
  // TRACK MANAGEMENT
  // ============================================================================

  /**
   * Register a new rail track
   */
  registerTrack(input: RegisterTrackInput): OperationResult<RailTrack> {
    // Validate track number uniqueness
    const existingTrack = Array.from(this.tracks.values()).find(
      t => t.trackNumber === input.trackNumber && t.tenantId === input.tenantId
    );

    if (existingTrack) {
      return {
        success: false,
        error: `Track ${input.trackNumber} already exists`,
        errorCode: 'DUPLICATE_TRACK',
      };
    }

    const track: RailTrack = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      trackNumber: input.trackNumber,
      name: input.name,
      trackType: input.trackType,
      status: 'available',
      length: input.length,
      wagonCapacity: input.wagonCapacity,
      electrified: input.electrified ?? false,
      gaugeType: input.gaugeType ?? 'broad',
      coordinates: input.coordinates,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tracks.set(track.id, track);

    emit('rail.track_registered', {
      trackId: track.id,
      trackNumber: track.trackNumber,
      trackType: track.trackType,
      wagonCapacity: track.wagonCapacity,
    }, { tenantId: track.tenantId });

    return { success: true, data: track };
  }

  /**
   * Get track by ID
   */
  getTrack(trackId: UUID): RailTrack | undefined {
    return this.tracks.get(trackId);
  }

  /**
   * Get track by number
   */
  getTrackByNumber(trackNumber: string, tenantId: string): RailTrack | undefined {
    return Array.from(this.tracks.values()).find(
      t => t.trackNumber === trackNumber && t.tenantId === tenantId
    );
  }

  /**
   * List all tracks
   */
  listTracks(options: TrackQueryOptions = {}): PaginatedResult<RailTrack> {
    let tracks = Array.from(this.tracks.values());

    if (options.tenantId) {
      tracks = tracks.filter(t => t.tenantId === options.tenantId);
    }
    if (options.status) {
      tracks = tracks.filter(t => t.status === options.status);
    }
    if (options.trackType) {
      tracks = tracks.filter(t => t.trackType === options.trackType);
    }
    if (options.availableOnly) {
      tracks = tracks.filter(t => t.status === 'available');
    }

    const total = tracks.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    tracks = tracks.slice(offset, offset + pageSize);

    return {
      data: tracks,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Update track status
   */
  updateTrackStatus(trackId: UUID, status: RailTrackStatus): OperationResult<RailTrack> {
    const track = this.tracks.get(trackId);
    if (!track) {
      return { success: false, error: 'Track not found', errorCode: 'NOT_FOUND' };
    }

    track.status = status;
    track.updatedAt = new Date();
    this.tracks.set(trackId, track);

    return { success: true, data: track };
  }

  /**
   * Find available track for a rake
   */
  findAvailableTrack(tenantId: string, wagonCount: number): RailTrack | undefined {
    return Array.from(this.tracks.values()).find(
      t => t.tenantId === tenantId &&
           t.status === 'available' &&
           t.wagonCapacity >= wagonCount &&
           (t.trackType === 'loading' || t.trackType === 'unloading' || t.trackType === 'staging')
    );
  }

  // ============================================================================
  // RAKE MANAGEMENT
  // ============================================================================

  /**
   * Announce a new rake arrival
   */
  announceRake(input: AnnounceRakeInput): OperationResult<Rake> {
    // Validate rake number uniqueness for active rakes
    const existingRake = Array.from(this.rakes.values()).find(
      r => r.rakeNumber === input.rakeNumber &&
           r.tenantId === input.tenantId &&
           !['departed', 'cancelled'].includes(r.status)
    );

    if (existingRake) {
      return {
        success: false,
        error: `Rake ${input.rakeNumber} is already active`,
        errorCode: 'DUPLICATE_RAKE',
      };
    }

    const rake: Rake = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      rakeNumber: input.rakeNumber,
      trainNumber: input.trainNumber,
      origin: input.origin,
      originName: input.originName,
      destination: input.destination,
      destinationName: input.destinationName,
      viaStations: input.viaStations,
      eta: input.eta,
      etd: input.etd,
      wagons: [],
      totalWagons: input.totalWagons,
      totalTEU: 0,
      importContainers: 0,
      exportContainers: 0,
      emptyContainers: 0,
      status: 'announced',
      railwayReceipt: input.railwayReceipt,
      indentNumber: input.indentNumber,
      manifestNumber: input.manifestNumber,
      locoNumber: input.locoNumber,
      guardName: input.guardName,
      driverName: input.driverName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rakes.set(rake.id, rake);

    emit('rail.rake_announced', {
      rakeId: rake.id,
      rakeNumber: rake.rakeNumber,
      trainNumber: rake.trainNumber,
      origin: rake.origin,
      destination: rake.destination,
      eta: rake.eta,
      totalWagons: rake.totalWagons,
    }, { tenantId: rake.tenantId });

    return { success: true, data: rake };
  }

  /**
   * Get rake by ID
   */
  getRake(rakeId: UUID): Rake | undefined {
    return this.rakes.get(rakeId);
  }

  /**
   * Get rake by number
   */
  getRakeByNumber(rakeNumber: string, tenantId: string): Rake | undefined {
    return Array.from(this.rakes.values()).find(
      r => r.rakeNumber === rakeNumber && r.tenantId === tenantId
    );
  }

  /**
   * List rakes with filtering
   */
  listRakes(options: RakeQueryOptions = {}): PaginatedResult<Rake> {
    let rakes = Array.from(this.rakes.values());

    if (options.tenantId) {
      rakes = rakes.filter(r => r.tenantId === options.tenantId);
    }
    if (options.status) {
      rakes = rakes.filter(r => r.status === options.status);
    }
    if (options.statuses) {
      rakes = rakes.filter(r => options.statuses!.includes(r.status));
    }
    if (options.origin) {
      rakes = rakes.filter(r => r.origin === options.origin);
    }
    if (options.destination) {
      rakes = rakes.filter(r => r.destination === options.destination);
    }
    if (options.trackId) {
      rakes = rakes.filter(r => r.trackId === options.trackId);
    }
    if (options.fromDate) {
      rakes = rakes.filter(r => r.eta >= options.fromDate!);
    }
    if (options.toDate) {
      rakes = rakes.filter(r => r.eta <= options.toDate!);
    }

    // Sort by ETA by default
    rakes.sort((a, b) => a.eta.getTime() - b.eta.getTime());

    const total = rakes.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    rakes = rakes.slice(offset, offset + pageSize);

    return {
      data: rakes,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Assign a track to a rake
   */
  assignTrack(rakeId: UUID, trackId: UUID): OperationResult<Rake> {
    const rake = this.rakes.get(rakeId);
    if (!rake) {
      return { success: false, error: 'Rake not found', errorCode: 'NOT_FOUND' };
    }

    const track = this.tracks.get(trackId);
    if (!track) {
      return { success: false, error: 'Track not found', errorCode: 'NOT_FOUND' };
    }

    if (track.status !== 'available') {
      return {
        success: false,
        error: `Track ${track.trackNumber} is not available (status: ${track.status})`,
        errorCode: 'TRACK_NOT_AVAILABLE',
      };
    }

    if (track.wagonCapacity < rake.totalWagons) {
      return {
        success: false,
        error: `Track ${track.trackNumber} capacity (${track.wagonCapacity} wagons) is less than rake size (${rake.totalWagons} wagons)`,
        errorCode: 'INSUFFICIENT_CAPACITY',
      };
    }

    // Assign track
    rake.trackId = trackId;
    rake.trackNumber = track.trackNumber;
    rake.updatedAt = new Date();
    this.rakes.set(rakeId, rake);

    // Update track status
    track.status = 'occupied';
    track.currentRakeId = rakeId;
    track.updatedAt = new Date();
    this.tracks.set(trackId, track);

    emit('rail.track_assigned', {
      rakeId: rake.id,
      rakeNumber: rake.rakeNumber,
      trackId: track.id,
      trackNumber: track.trackNumber,
    }, { tenantId: rake.tenantId });

    return { success: true, data: rake };
  }

  /**
   * Mark rake as arrived
   */
  recordRakeArrival(rakeId: UUID): OperationResult<Rake> {
    const rake = this.rakes.get(rakeId);
    if (!rake) {
      return { success: false, error: 'Rake not found', errorCode: 'NOT_FOUND' };
    }

    if (!rake.trackId) {
      return {
        success: false,
        error: 'Cannot record arrival - no track assigned',
        errorCode: 'NO_TRACK_ASSIGNED',
      };
    }

    rake.ata = new Date();
    rake.status = 'arrived';
    rake.updatedAt = new Date();
    this.rakes.set(rakeId, rake);

    emit('rail.rake_arrived', {
      rakeId: rake.id,
      rakeNumber: rake.rakeNumber,
      trackId: rake.trackId,
      trackNumber: rake.trackNumber,
      arrivalTime: rake.ata,
      totalWagons: rake.totalWagons,
    }, { tenantId: rake.tenantId });

    return { success: true, data: rake };
  }

  /**
   * Update rake status
   */
  updateRakeStatus(rakeId: UUID, status: RakeStatus): OperationResult<Rake> {
    const rake = this.rakes.get(rakeId);
    if (!rake) {
      return { success: false, error: 'Rake not found', errorCode: 'NOT_FOUND' };
    }

    const previousStatus = rake.status;
    rake.status = status;
    rake.updatedAt = new Date();

    // Handle status-specific updates
    if (status === 'departed') {
      rake.atd = new Date();

      // Release the track
      if (rake.trackId) {
        const track = this.tracks.get(rake.trackId);
        if (track) {
          track.status = 'available';
          track.currentRakeId = undefined;
          track.updatedAt = new Date();
          this.tracks.set(track.id, track);
        }
      }
    }

    this.rakes.set(rakeId, rake);

    emit('rail.rake_status_changed', {
      rakeId: rake.id,
      rakeNumber: rake.rakeNumber,
      previousStatus,
      newStatus: status,
    }, { tenantId: rake.tenantId });

    return { success: true, data: rake };
  }

  // ============================================================================
  // WAGON MANAGEMENT
  // ============================================================================

  /**
   * Add wagon to rake
   */
  addWagon(input: AddWagonInput): OperationResult<Wagon> {
    const rake = this.rakes.get(input.rakeId);
    if (!rake) {
      return { success: false, error: 'Rake not found', errorCode: 'NOT_FOUND' };
    }

    // Check position validity
    if (input.position < 1 || input.position > rake.totalWagons) {
      return {
        success: false,
        error: `Invalid position ${input.position}. Must be between 1 and ${rake.totalWagons}`,
        errorCode: 'INVALID_POSITION',
      };
    }

    // Check for duplicate position
    const existingAtPosition = rake.wagons.find(w => w.position === input.position);
    if (existingAtPosition) {
      return {
        success: false,
        error: `Position ${input.position} already has wagon ${existingAtPosition.wagonNumber}`,
        errorCode: 'POSITION_OCCUPIED',
      };
    }

    const wagon: Wagon = {
      id: uuidv4(),
      rakeId: input.rakeId,
      wagonNumber: input.wagonNumber,
      wagonType: input.wagonType,
      position: input.position,
      maxLoadCapacity: input.maxLoadCapacity ?? getWagonCapacity(input.wagonType),
      maxContainers: input.maxContainers ?? getWagonContainerSlots(input.wagonType),
      containers: [],
      currentLoad: 0,
      tareWeight: input.tareWeight ?? getWagonTareWeight(input.wagonType),
      condition: input.condition ?? 'fit',
    };

    this.wagons.set(wagon.id, wagon);

    // Add to rake
    rake.wagons.push(wagon);
    rake.wagons.sort((a, b) => a.position - b.position);
    rake.updatedAt = new Date();
    this.rakes.set(rake.id, rake);

    return { success: true, data: wagon };
  }

  /**
   * Get wagon by ID
   */
  getWagon(wagonId: UUID): Wagon | undefined {
    return this.wagons.get(wagonId);
  }

  /**
   * Get wagon by number within a rake
   */
  getWagonByNumber(rakeId: UUID, wagonNumber: string): Wagon | undefined {
    const rake = this.rakes.get(rakeId);
    if (!rake) return undefined;
    return rake.wagons.find(w => w.wagonNumber === wagonNumber);
  }

  /**
   * Load container onto wagon
   */
  loadContainerOnWagon(
    wagonId: UUID,
    containerId: UUID,
    slot: 'front' | 'rear' | 'single'
  ): OperationResult<Wagon> {
    const wagon = this.wagons.get(wagonId);
    if (!wagon) {
      return { success: false, error: 'Wagon not found', errorCode: 'NOT_FOUND' };
    }

    const containerEngine = getContainerEngine();
    const container = containerEngine.getContainer(containerId);
    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'CONTAINER_NOT_FOUND' };
    }

    // Check slot availability
    const existingSlot = wagon.containers.find(c => c.slot === slot);
    if (existingSlot && existingSlot.containerId) {
      return {
        success: false,
        error: `Slot ${slot} is already occupied by container ${existingSlot.containerNumber}`,
        errorCode: 'SLOT_OCCUPIED',
      };
    }

    // Check weight capacity
    const containerWeight = container.grossWeight ?? container.tareWeight ?? 0;
    if (wagon.currentLoad + containerWeight > wagon.maxLoadCapacity * 1000) { // maxLoadCapacity in tons, weight in kg
      return {
        success: false,
        error: `Loading container would exceed wagon capacity (${wagon.maxLoadCapacity}T)`,
        errorCode: 'CAPACITY_EXCEEDED',
      };
    }

    // Add container to wagon - check if empty by grossWeight being close to tareWeight
    const isEmpty = container.grossWeight !== undefined &&
                    container.tareWeight !== undefined &&
                    (container.grossWeight - container.tareWeight) < 500; // Less than 500kg cargo

    const wagonContainer: WagonContainer = {
      slot,
      containerId: container.id,
      containerNumber: container.containerNumber,
      isEmpty,
      weight: containerWeight,
    };

    // Remove existing empty slot placeholder if any
    wagon.containers = wagon.containers.filter(c => c.slot !== slot);
    wagon.containers.push(wagonContainer);
    wagon.currentLoad += containerWeight;

    this.wagons.set(wagonId, wagon);

    // Update rake TEU count
    const rake = this.rakes.get(wagon.rakeId);
    if (rake) {
      rake.totalTEU += getTEUFromContainer(container);
      if (isEmpty) {
        rake.emptyContainers++;
      } else {
        // Determine import/export based on context (simplified)
        rake.exportContainers++;
      }
      this.rakes.set(rake.id, rake);
    }

    emit('rail.container_loaded_wagon', {
      wagonId: wagon.id,
      wagonNumber: wagon.wagonNumber,
      containerId: container.id,
      containerNumber: container.containerNumber,
      slot,
      rakeId: wagon.rakeId,
    }, { tenantId: container.tenantId });

    return { success: true, data: wagon };
  }

  /**
   * Unload container from wagon
   */
  unloadContainerFromWagon(wagonId: UUID, slot: 'front' | 'rear' | 'single'): OperationResult<{ wagon: Wagon; containerId?: UUID }> {
    const wagon = this.wagons.get(wagonId);
    if (!wagon) {
      return { success: false, error: 'Wagon not found', errorCode: 'NOT_FOUND' };
    }

    const containerSlot = wagon.containers.find(c => c.slot === slot);
    if (!containerSlot || !containerSlot.containerId) {
      return {
        success: false,
        error: `No container in slot ${slot}`,
        errorCode: 'SLOT_EMPTY',
      };
    }

    const containerId = containerSlot.containerId;
    const containerWeight = containerSlot.weight ?? 0;

    // Remove from wagon
    wagon.containers = wagon.containers.filter(c => c.slot !== slot);
    wagon.currentLoad -= containerWeight;
    this.wagons.set(wagonId, wagon);

    // Update rake counts
    const rake = this.rakes.get(wagon.rakeId);
    if (rake) {
      const containerEngine = getContainerEngine();
      const container = containerEngine.getContainer(containerId);
      if (container) {
        rake.totalTEU -= getTEUFromContainer(container);
      }
      this.rakes.set(rake.id, rake);
    }

    emit('rail.container_unloaded_wagon', {
      wagonId: wagon.id,
      wagonNumber: wagon.wagonNumber,
      containerId,
      containerNumber: containerSlot.containerNumber,
      slot,
      rakeId: wagon.rakeId,
    }, { tenantId: rake?.tenantId ?? '' });

    return { success: true, data: { wagon, containerId } };
  }

  // ============================================================================
  // RAIL OPERATIONS
  // ============================================================================

  /**
   * Start unloading operation for a rake
   */
  startUnloading(rakeId: UUID): OperationResult<Rake> {
    const rake = this.rakes.get(rakeId);
    if (!rake) {
      return { success: false, error: 'Rake not found', errorCode: 'NOT_FOUND' };
    }

    if (!['arrived', 'positioning'].includes(rake.status)) {
      return {
        success: false,
        error: `Cannot start unloading from status ${rake.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    rake.status = 'unloading';
    rake.updatedAt = new Date();
    this.rakes.set(rakeId, rake);

    emit('rail.unloading_started', {
      rakeId: rake.id,
      rakeNumber: rake.rakeNumber,
      trackNumber: rake.trackNumber,
      totalContainers: rake.importContainers + rake.emptyContainers,
    }, { tenantId: rake.tenantId });

    return { success: true, data: rake };
  }

  /**
   * Complete unloading operation
   */
  completeUnloading(rakeId: UUID): OperationResult<Rake> {
    const rake = this.rakes.get(rakeId);
    if (!rake) {
      return { success: false, error: 'Rake not found', errorCode: 'NOT_FOUND' };
    }

    if (rake.status !== 'unloading') {
      return {
        success: false,
        error: `Rake is not in unloading status (current: ${rake.status})`,
        errorCode: 'INVALID_STATUS',
      };
    }

    rake.status = 'loading'; // Ready for loading
    rake.updatedAt = new Date();
    this.rakes.set(rakeId, rake);

    emit('rail.unloading_completed', {
      rakeId: rake.id,
      rakeNumber: rake.rakeNumber,
      containersUnloaded: rake.importContainers,
    }, { tenantId: rake.tenantId });

    return { success: true, data: rake };
  }

  /**
   * Start loading operation for a rake
   */
  startLoading(rakeId: UUID): OperationResult<Rake> {
    const rake = this.rakes.get(rakeId);
    if (!rake) {
      return { success: false, error: 'Rake not found', errorCode: 'NOT_FOUND' };
    }

    if (!['arrived', 'positioning', 'loading'].includes(rake.status)) {
      return {
        success: false,
        error: `Cannot start loading from status ${rake.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    rake.status = 'loading';
    rake.updatedAt = new Date();
    this.rakes.set(rakeId, rake);

    emit('rail.loading_started', {
      rakeId: rake.id,
      rakeNumber: rake.rakeNumber,
      trackNumber: rake.trackNumber,
    }, { tenantId: rake.tenantId });

    return { success: true, data: rake };
  }

  /**
   * Complete loading and prepare for departure
   */
  completeLoading(rakeId: UUID): OperationResult<Rake> {
    const rake = this.rakes.get(rakeId);
    if (!rake) {
      return { success: false, error: 'Rake not found', errorCode: 'NOT_FOUND' };
    }

    if (rake.status !== 'loading') {
      return {
        success: false,
        error: `Rake is not in loading status (current: ${rake.status})`,
        errorCode: 'INVALID_STATUS',
      };
    }

    rake.status = 'ready_for_departure';
    rake.updatedAt = new Date();
    this.rakes.set(rakeId, rake);

    emit('rail.loading_completed', {
      rakeId: rake.id,
      rakeNumber: rake.rakeNumber,
      containersLoaded: rake.exportContainers,
      totalTEU: rake.totalTEU,
    }, { tenantId: rake.tenantId });

    return { success: true, data: rake };
  }

  /**
   * Dispatch rake (departure)
   */
  dispatchRake(rakeId: UUID): OperationResult<Rake> {
    const rake = this.rakes.get(rakeId);
    if (!rake) {
      return { success: false, error: 'Rake not found', errorCode: 'NOT_FOUND' };
    }

    if (rake.status !== 'ready_for_departure') {
      return {
        success: false,
        error: `Rake is not ready for departure (current: ${rake.status})`,
        errorCode: 'INVALID_STATUS',
      };
    }

    const trackId = rake.trackId;

    rake.status = 'departed';
    rake.atd = new Date();
    rake.trackId = undefined;
    rake.trackNumber = undefined;
    rake.updatedAt = new Date();
    this.rakes.set(rakeId, rake);

    // Release track
    if (trackId) {
      const track = this.tracks.get(trackId);
      if (track) {
        track.status = 'available';
        track.currentRakeId = undefined;
        track.updatedAt = new Date();
        this.tracks.set(track.id, track);
      }
    }

    emit('rail.rake_departed', {
      rakeId: rake.id,
      rakeNumber: rake.rakeNumber,
      trainNumber: rake.trainNumber,
      destination: rake.destination,
      departureTime: rake.atd,
      totalTEU: rake.totalTEU,
      exportContainers: rake.exportContainers,
    }, { tenantId: rake.tenantId });

    return { success: true, data: rake };
  }

  // ============================================================================
  // MANIFEST MANAGEMENT
  // ============================================================================

  /**
   * Create rail manifest
   */
  createManifest(input: CreateManifestInput): OperationResult<RailManifest> {
    const rake = this.rakes.get(input.rakeId);
    if (!rake) {
      return { success: false, error: 'Rake not found', errorCode: 'NOT_FOUND' };
    }

    const manifest: RailManifest = {
      id: uuidv4(),
      tenantId: input.tenantId,
      facilityId: input.facilityId,
      rakeId: input.rakeId,
      manifestNumber: input.manifestNumber,
      manifestType: input.manifestType,
      originStation: input.originStation ?? rake.origin,
      destinationStation: input.destinationStation ?? rake.destination,
      containers: input.containers ?? [],
      totalContainers: input.containers?.length ?? 0,
      totalTEU: 0,
      totalWeight: 0,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Calculate totals
    for (const container of manifest.containers) {
      manifest.totalWeight += container.grossWeight;
      manifest.totalTEU += container.isoType.startsWith('2') ? 1 : 2;
    }

    this.manifests.set(manifest.id, manifest);

    // Link to rake
    rake.manifestNumber = manifest.manifestNumber;
    this.rakes.set(rake.id, rake);

    return { success: true, data: manifest };
  }

  /**
   * Get manifest
   */
  getManifest(manifestId: UUID): RailManifest | undefined {
    return this.manifests.get(manifestId);
  }

  /**
   * Add container to manifest
   */
  addContainerToManifest(
    manifestId: UUID,
    container: RailManifestContainer
  ): OperationResult<RailManifest> {
    const manifest = this.manifests.get(manifestId);
    if (!manifest) {
      return { success: false, error: 'Manifest not found', errorCode: 'NOT_FOUND' };
    }

    if (manifest.status !== 'draft') {
      return {
        success: false,
        error: 'Cannot modify submitted manifest',
        errorCode: 'MANIFEST_SUBMITTED',
      };
    }

    manifest.containers.push(container);
    manifest.totalContainers = manifest.containers.length;
    manifest.totalWeight += container.grossWeight;
    manifest.totalTEU += container.isoType.startsWith('2') ? 1 : 2;
    manifest.updatedAt = new Date();

    this.manifests.set(manifestId, manifest);

    return { success: true, data: manifest };
  }

  /**
   * Submit manifest
   */
  submitManifest(manifestId: UUID): OperationResult<RailManifest> {
    const manifest = this.manifests.get(manifestId);
    if (!manifest) {
      return { success: false, error: 'Manifest not found', errorCode: 'NOT_FOUND' };
    }

    if (manifest.status !== 'draft') {
      return {
        success: false,
        error: `Cannot submit manifest in status ${manifest.status}`,
        errorCode: 'INVALID_STATUS',
      };
    }

    manifest.status = 'submitted';
    manifest.submittedAt = new Date();
    manifest.updatedAt = new Date();

    this.manifests.set(manifestId, manifest);

    emit('rail.manifest_submitted', {
      manifestId: manifest.id,
      manifestNumber: manifest.manifestNumber,
      rakeId: manifest.rakeId,
      totalContainers: manifest.totalContainers,
      totalTEU: manifest.totalTEU,
    }, { tenantId: manifest.tenantId });

    return { success: true, data: manifest };
  }

  // ============================================================================
  // INTERMODAL OPERATIONS
  // ============================================================================

  /**
   * Transfer container from rail to yard
   */
  railToYard(
    rakeId: UUID,
    wagonId: UUID,
    slot: 'front' | 'rear' | 'single',
    _targetBlockId: UUID  // Reserved for future use with specific block targeting
  ): OperationResult<{ containerId: UUID; yardLocation: string }> {
    // Unload from wagon
    const unloadResult = this.unloadContainerFromWagon(wagonId, slot);
    if (!unloadResult.success || !unloadResult.data?.containerId) {
      return { success: false, error: unloadResult.error, errorCode: unloadResult.errorCode };
    }

    const containerId = unloadResult.data.containerId;
    const containerEngine = getContainerEngine();
    const container = containerEngine.getContainer(containerId);

    if (!container) {
      return { success: false, error: 'Container not found', errorCode: 'CONTAINER_NOT_FOUND' };
    }

    // Get yard slot recommendation
    const yardEngine = getYardEngine();
    const recommendations = yardEngine.recommendSlot(
      container.facilityId,
      container,
      'minimize_rehandles'
    );

    if (recommendations.length === 0) {
      return {
        success: false,
        error: 'No available yard slots found',
        errorCode: 'NO_YARD_SLOTS',
      };
    }

    const targetSlot = recommendations[0];
    if (!targetSlot?.location) {
      return {
        success: false,
        error: 'Invalid slot recommendation',
        errorCode: 'INVALID_SLOT',
      };
    }

    emit('rail.container_transferred_to_yard', {
      rakeId,
      containerId,
      containerNumber: container.containerNumber,
      fromWagonId: wagonId,
      toYardLocation: targetSlot.location,
    }, { tenantId: container.tenantId });

    return {
      success: true,
      data: {
        containerId,
        yardLocation: `${targetSlot.location.blockId}-${targetSlot.location.row}-${targetSlot.location.slot}-${targetSlot.location.tier}`,
      },
    };
  }

  /**
   * Get rail terminal statistics
   */
  getTerminalStats(tenantId: string): RailTerminalStats {
    const tracks = Array.from(this.tracks.values()).filter(t => t.tenantId === tenantId);
    const rakes = Array.from(this.rakes.values()).filter(r => r.tenantId === tenantId);

    const activeRakes = rakes.filter(r => !['departed', 'cancelled'].includes(r.status));
    const todayArrivals = rakes.filter(r => {
      const today = new Date();
      return r.eta.toDateString() === today.toDateString();
    });

    return {
      totalTracks: tracks.length,
      availableTracks: tracks.filter(t => t.status === 'available').length,
      occupiedTracks: tracks.filter(t => t.status === 'occupied').length,
      activeRakes: activeRakes.length,
      rakesUnloading: rakes.filter(r => r.status === 'unloading').length,
      rakesLoading: rakes.filter(r => r.status === 'loading').length,
      rakesReadyForDeparture: rakes.filter(r => r.status === 'ready_for_departure').length,
      todayExpectedArrivals: todayArrivals.length,
      todayDepartures: rakes.filter(r =>
        r.atd && r.atd.toDateString() === new Date().toDateString()
      ).length,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getWagonCapacity(type: IndianWagonType): number {
  const capacities: Record<IndianWagonType, number> = {
    BLC: 61,
    BLCA: 61,
    BFKN: 61,
    BFNS: 58,
    BOXNHL: 55,
    BRN: 54,
    BOST: 56,
    NMG: 58,
  };
  return capacities[type] ?? 60;
}

function getWagonContainerSlots(type: IndianWagonType): number {
  // Most BLC wagons can carry 2x20ft or 1x40ft
  return type === 'BLC' || type === 'BLCA' || type === 'BFKN' ? 2 : 1;
}

function getWagonTareWeight(type: IndianWagonType): number {
  const weights: Record<IndianWagonType, number> = {
    BLC: 23000,    // kg
    BLCA: 23500,
    BFKN: 22000,
    BFNS: 21500,
    BOXNHL: 24000,
    BRN: 22500,
    BOST: 23000,
    NMG: 22000,
  };
  return weights[type] ?? 23000;
}

function getTEUFromContainer(container: Container): number {
  const size = container.size ?? '20';
  return size === '40' || size === '45' ? 2 : 1;
}

// ============================================================================
// SINGLETON ACCESS
// ============================================================================

let railEngineInstance: RailEngine | null = null;

export function getRailEngine(): RailEngine {
  if (!railEngineInstance) {
    railEngineInstance = RailEngine.getInstance();
  }
  return railEngineInstance;
}

export function setRailEngine(engine: RailEngine): void {
  railEngineInstance = engine;
}

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterTrackInput {
  tenantId: string;
  facilityId: UUID;
  trackNumber: string;
  name?: string;
  trackType: RailTrackType;
  length: number;
  wagonCapacity: number;
  electrified?: boolean;
  gaugeType?: 'broad' | 'standard' | 'narrow';
  coordinates?: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
  };
}

export interface TrackQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: RailTrackStatus;
  trackType?: RailTrackType;
  availableOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AnnounceRakeInput {
  tenantId: string;
  facilityId: UUID;
  rakeNumber: string;
  trainNumber: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  viaStations?: string[];
  eta: Date;
  etd: Date;
  totalWagons: number;
  railwayReceipt?: string;
  indentNumber?: string;
  manifestNumber?: string;
  locoNumber?: string;
  guardName?: string;
  driverName?: string;
}

export interface RakeQueryOptions {
  tenantId?: string;
  facilityId?: UUID;
  status?: RakeStatus;
  statuses?: RakeStatus[];
  origin?: string;
  destination?: string;
  trackId?: UUID;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface AddWagonInput {
  rakeId: UUID;
  wagonNumber: string;
  wagonType: IndianWagonType;
  position: number;
  maxLoadCapacity?: number;
  maxContainers?: number;
  tareWeight?: number;
  condition?: 'fit' | 'damaged' | 'under_repair';
}

export interface CreateManifestInput {
  tenantId: string;
  facilityId: UUID;
  rakeId: UUID;
  manifestNumber: string;
  manifestType: 'import' | 'export';
  originStation?: string;
  destinationStation?: string;
  containers?: RailManifestContainer[];
}

export interface RailTerminalStats {
  totalTracks: number;
  availableTracks: number;
  occupiedTracks: number;
  activeRakes: number;
  rakesUnloading: number;
  rakesLoading: number;
  rakesReadyForDeparture: number;
  todayExpectedArrivals: number;
  todayDepartures: number;
}
