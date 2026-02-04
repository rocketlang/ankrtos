/**
 * Document Auto-Fill Service
 * Automatically fills port call documents using vessel master data, crew lists, cargo info, etc.
 *
 * Purpose: Reduce document preparation time from 4-6 hours to 15-20 minutes
 */

import { prisma } from '../schema/context.js';
import type { Vessel, Voyage, VesselDocument } from '@prisma/client';

interface AutoFillResult {
  documentData: Record<string, any>;
  fieldsFilled: string[];
  fillProgress: number;
  confidence: number;
  dataSource: string;
  fillDuration: number;
}

interface CrewMember {
  rank: string;
  fullName: string;
  nationality: string;
  passportNo: string;
  dateOfBirth: Date;
  placeOfBirth: string;
  signOnDate: Date;
}

export class DocumentAutoFillService {
  /**
   * Auto-fill a document based on template and available data
   */
  async autoFillDocument(
    templateCode: string,
    vesselId: string,
    voyageId?: string
  ): Promise<AutoFillResult> {
    const startTime = Date.now();

    // Get template structure
    const template = await prisma.documentTemplate.findUnique({
      where: { code: templateCode },
    });

    if (!template) {
      throw new Error(`Template ${templateCode} not found`);
    }

    // Get vessel data
    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        positions: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!vessel) {
      throw new Error(`Vessel ${vesselId} not found`);
    }

    // Get voyage data if provided
    let voyage = null;
    if (voyageId) {
      voyage = await prisma.voyage.findUnique({
        where: { id: voyageId },
        include: {
          departurePort: true,
          arrivalPort: true,
          vessel: true,
        },
      });
    }

    // Get crew list
    const crewList = await this.getCrewList(vesselId);

    // Build auto-fill data based on template type
    const documentData = await this.buildDocumentData(
      templateCode,
      vessel,
      voyage,
      crewList
    );

    const fieldsFilled = this.getFieldsFilled(documentData);
    const fillProgress = this.calculateFillProgress(
      template.templateJson as any,
      documentData
    );

    const fillDuration = Date.now() - startTime;

    return {
      documentData,
      fieldsFilled,
      fillProgress,
      confidence: fillProgress,
      dataSource: this.determineDataSource(templateCode),
      fillDuration,
    };
  }

  /**
   * Build document data based on template type
   */
  private async buildDocumentData(
    templateCode: string,
    vessel: any,
    voyage: any,
    crewList: CrewMember[]
  ): Promise<Record<string, any>> {
    const builders: Record<string, () => Promise<Record<string, any>>> = {
      FAL1: () => this.buildFAL1(vessel, voyage, crewList),
      FAL2: () => this.buildFAL2(vessel, voyage),
      FAL3: () => this.buildFAL3(vessel, crewList),
      FAL4: () => this.buildFAL4(vessel, crewList),
      FAL5: () => this.buildFAL5(vessel, voyage, crewList),
      FAL6: () => this.buildFAL6(vessel, voyage),
      FAL7: () => this.buildFAL7(vessel, voyage),
      ISPS_ARRIVAL: () => this.buildISPSArrival(vessel, voyage),
      PORT_HEALTH: () => this.buildPortHealth(vessel, crewList),
      CUSTOMS_ENTRY: () => this.buildCustomsEntry(vessel, voyage),
    };

    const builder = builders[templateCode];
    if (builder) {
      return await builder();
    }

    // Generic fallback
    return await this.buildGenericDocument(vessel, voyage, crewList);
  }

  /**
   * FAL 1 - General Declaration
   */
  private async buildFAL1(
    vessel: any,
    voyage: any,
    crewList: CrewMember[]
  ): Promise<Record<string, any>> {
    const master = crewList.find((c) => c.rank === 'Master');

    return {
      // 1. Particulars of Ship
      vesselName: vessel.name,
      imoNumber: vessel.imo,
      callSign: vessel.callSign || '',
      flag: vessel.flag,
      registryPort: vessel.registryPort || '',

      // 2. Vessel particulars
      grt: vessel.grt,
      nrt: vessel.nrt,
      vesselType: vessel.type,

      // 3. Master details
      masterName: master?.fullName || '',
      masterNationality: master?.nationality || '',

      // 4. Voyage details
      lastPort: voyage?.departurePort?.name || '',
      lastPortCountry: voyage?.departurePort?.country || '',
      arrivalPort: voyage?.arrivalPort?.name || '',
      arrivalPortCountry: voyage?.arrivalPort?.country || '',
      nextPort: '', // Will need to get from voyage route

      // 5. Dates
      dateOfArrival: voyage?.eta || new Date(),
      dateOfDeparture: voyage?.etd,
      voyageNumber: voyage?.voyageNumber || '',

      // 6. Crew and passengers
      numberOfCrew: crewList.length,
      numberOfPassengers: 0,

      // 7. Brief description of cargo
      cargoDescription: voyage?.cargoDescription || 'General Cargo',
      cargoQuantity: voyage?.cargoQuantity || 0,

      // 8. Declaration
      declarationPlace: voyage?.arrivalPort?.name || '',
      declarationDate: new Date(),
      masterSignature: master?.fullName || '',

      // Auto-fill metadata
      _autoFilled: true,
      _fillTimestamp: new Date(),
      _dataSource: 'vessel_master_voyage_crew',
    };
  }

  /**
   * FAL 2 - Cargo Declaration
   */
  private async buildFAL2(vessel: any, voyage: any): Promise<Record<string, any>> {
    return {
      vesselName: vessel.name,
      imoNumber: vessel.imo,
      flag: vessel.flag,
      voyageNumber: voyage?.voyageNumber || '',
      portOfLoading: voyage?.departurePort?.name || '',
      portOfDischarge: voyage?.arrivalPort?.name || '',

      // Cargo details (would come from cargo/BL data)
      cargoItems: [
        {
          marksAndNumbers: '',
          numberOfPackages: 0,
          kindOfPackages: 'Containers',
          description: voyage?.cargoDescription || '',
          grossWeight: voyage?.cargoQuantity || 0,
          measurement: 0,
        },
      ],

      declarationDate: new Date(),
      _autoFilled: true,
      _dataSource: 'vessel_voyage_cargo',
    };
  }

  /**
   * FAL 3 - Ship's Stores Declaration
   */
  private async buildFAL3(vessel: any, crewList: CrewMember[]): Promise<Record<string, any>> {
    return {
      vesselName: vessel.name,
      imoNumber: vessel.imo,
      flag: vessel.flag,
      arrivalFrom: '',
      arrivalDate: new Date(),

      // Stores categories
      stores: {
        provisions: { itemCount: 0, details: [] },
        bonded: { itemCount: 0, details: [] },
        cigarettes: { quantity: 0, details: [] },
        alcohol: { quantity: 0, details: [] },
      },

      crewCount: crewList.length,
      declarationDate: new Date(),
      _autoFilled: true,
      _dataSource: 'vessel_crew',
    };
  }

  /**
   * FAL 4 - Crew Effects Declaration
   */
  private async buildFAL4(vessel: any, crewList: CrewMember[]): Promise<Record<string, any>> {
    return {
      vesselName: vessel.name,
      imoNumber: vessel.imo,
      flag: vessel.flag,

      crewEffects: crewList.map((crew) => ({
        crewName: crew.fullName,
        rank: crew.rank,
        nationality: crew.nationality,
        effectsDescription: 'Personal effects',
        dutiableGoods: false,
      })),

      declarationDate: new Date(),
      _autoFilled: true,
      _dataSource: 'crew_list',
    };
  }

  /**
   * FAL 5 - Crew List
   */
  private async buildFAL5(
    vessel: any,
    voyage: any,
    crewList: CrewMember[]
  ): Promise<Record<string, any>> {
    return {
      vesselName: vessel.name,
      imoNumber: vessel.imo,
      flag: vessel.flag,
      voyageNumber: voyage?.voyageNumber || '',
      portOfArrival: voyage?.arrivalPort?.name || '',
      dateOfArrival: voyage?.eta || new Date(),

      crewMembers: crewList.map((crew, index) => ({
        serialNo: index + 1,
        rank: crew.rank,
        surname: crew.fullName.split(' ').slice(-1)[0],
        givenNames: crew.fullName.split(' ').slice(0, -1).join(' '),
        nationality: crew.nationality,
        dateOfBirth: crew.dateOfBirth,
        placeOfBirth: crew.placeOfBirth,
        passportNo: crew.passportNo,
        signOnDate: crew.signOnDate,
        signOnPort: '',
      })),

      totalCrew: crewList.length,
      declarationDate: new Date(),
      _autoFilled: true,
      _dataSource: 'crew_management_system',
    };
  }

  /**
   * FAL 6 - Passenger List
   */
  private async buildFAL6(vessel: any, voyage: any): Promise<Record<string, any>> {
    return {
      vesselName: vessel.name,
      imoNumber: vessel.imo,
      flag: vessel.flag,
      voyageNumber: voyage?.voyageNumber || '',
      portOfEmbarkation: voyage?.departurePort?.name || '',
      portOfDisembarkation: voyage?.arrivalPort?.name || '',

      passengers: [], // No passengers on cargo vessels
      totalPassengers: 0,

      declarationDate: new Date(),
      _autoFilled: true,
      _dataSource: 'passenger_manifest',
    };
  }

  /**
   * FAL 7 - Dangerous Goods Manifest
   */
  private async buildFAL7(vessel: any, voyage: any): Promise<Record<string, any>> {
    return {
      vesselName: vessel.name,
      imoNumber: vessel.imo,
      flag: vessel.flag,
      voyageNumber: voyage?.voyageNumber || '',

      dangerousGoods: [], // Would come from cargo data
      totalDangerousGoods: 0,

      declarationDate: new Date(),
      _autoFilled: true,
      _dataSource: 'cargo_manifest',
    };
  }

  /**
   * ISPS Pre-Arrival Security Declaration
   */
  private async buildISPSArrival(vessel: any, voyage: any): Promise<Record<string, any>> {
    return {
      vesselName: vessel.name,
      imoNumber: vessel.imo,
      flag: vessel.flag,
      securityLevel: 1, // Default to level 1
      lastTenPorts: [], // Would need port history
      portFacilityVisits: [],

      securityOfficer: '',
      companySecurityOfficer: '',

      declarationDate: new Date(),
      _autoFilled: true,
      _dataSource: 'vessel_security_system',
    };
  }

  /**
   * Port Health Declaration (Maritime Declaration of Health)
   */
  private async buildPortHealth(vessel: any, crewList: CrewMember[]): Promise<Record<string, any>> {
    return {
      vesselName: vessel.name,
      imoNumber: vessel.imo,
      flag: vessel.flag,

      healthQuestions: {
        diseaseOnBoard: false,
        diseaseMoreThanNormal: false,
        illPersonsDisembarked: false,
        illnessAmongCrew: false,
        medicalPractitionerConsulted: false,
        sanitaryMeasuresApplied: false,
        stowaways: false,
        sickAnimals: false,
      },

      crewCount: crewList.length,
      doctorOnBoard: false,

      declarationDate: new Date(),
      _autoFilled: true,
      _dataSource: 'crew_health_records',
    };
  }

  /**
   * Customs Entry Declaration
   */
  private async buildCustomsEntry(vessel: any, voyage: any): Promise<Record<string, any>> {
    return {
      vesselName: vessel.name,
      imoNumber: vessel.imo,
      flag: vessel.flag,
      voyageNumber: voyage?.voyageNumber || '',

      cargoDetails: {
        description: voyage?.cargoDescription || '',
        quantity: voyage?.cargoQuantity || 0,
        value: 0,
        hsCode: '',
      },

      declarationDate: new Date(),
      _autoFilled: true,
      _dataSource: 'cargo_customs_data',
    };
  }

  /**
   * Generic document builder (fallback)
   */
  private async buildGenericDocument(
    vessel: any,
    voyage: any,
    crewList: CrewMember[]
  ): Promise<Record<string, any>> {
    return {
      vessel: {
        name: vessel.name,
        imo: vessel.imo,
        flag: vessel.flag,
        grt: vessel.grt,
        nrt: vessel.nrt,
        dwt: vessel.dwt,
      },
      voyage: voyage
        ? {
            number: voyage.voyageNumber,
            from: voyage.departurePort?.name,
            to: voyage.arrivalPort?.name,
            eta: voyage.eta,
            etd: voyage.etd,
          }
        : null,
      crew: {
        count: crewList.length,
        master: crewList.find((c) => c.rank === 'Master')?.fullName,
      },
      _autoFilled: true,
      _dataSource: 'generic',
    };
  }

  /**
   * Get crew list for a vessel
   */
  private async getCrewList(vesselId: string): Promise<CrewMember[]> {
    // In production, this would query the crew management system
    // For now, return mock data
    return [
      {
        rank: 'Master',
        fullName: 'Captain John Smith',
        nationality: 'United Kingdom',
        passportNo: 'UK1234567',
        dateOfBirth: new Date('1975-05-15'),
        placeOfBirth: 'London, UK',
        signOnDate: new Date('2025-01-01'),
      },
      {
        rank: 'Chief Officer',
        fullName: 'Rajesh Kumar',
        nationality: 'India',
        passportNo: 'IN9876543',
        dateOfBirth: new Date('1980-08-20'),
        placeOfBirth: 'Mumbai, India',
        signOnDate: new Date('2025-01-01'),
      },
      // ... would include full crew complement
    ];
  }

  /**
   * Get list of fields that were auto-filled
   */
  private getFieldsFilled(documentData: Record<string, any>): string[] {
    const fields: string[] = [];

    const traverse = (obj: any, prefix = '') => {
      for (const key in obj) {
        if (key.startsWith('_')) continue; // Skip metadata fields

        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !(obj[key] instanceof Date)) {
          traverse(obj[key], path);
        } else {
          fields.push(path);
        }
      }
    };

    traverse(documentData);
    return fields;
  }

  /**
   * Calculate fill progress (0.0 to 1.0)
   */
  private calculateFillProgress(
    template: Record<string, any>,
    documentData: Record<string, any>
  ): number {
    // Simple calculation: count non-empty fields vs total fields
    const totalFields = this.countFields(template);
    const filledFields = this.countFilledFields(documentData);

    return totalFields > 0 ? Math.min(filledFields / totalFields, 1.0) : 0;
  }

  /**
   * Count total fields in template
   */
  private countFields(obj: any): number {
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        count += this.countFields(obj[key]);
      } else {
        count++;
      }
    }
    return count;
  }

  /**
   * Count filled fields in document data
   */
  private countFilledFields(obj: any): number {
    let count = 0;
    for (const key in obj) {
      if (key.startsWith('_')) continue;

      const value = obj[key];
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          count += this.countFilledFields(value);
        } else {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Determine primary data source for template
   */
  private determineDataSource(templateCode: string): string {
    const sources: Record<string, string> = {
      FAL1: 'vessel_voyage_crew',
      FAL2: 'voyage_cargo',
      FAL3: 'vessel_stores',
      FAL4: 'crew_effects',
      FAL5: 'crew_management',
      FAL6: 'passenger_manifest',
      FAL7: 'cargo_dangerous_goods',
      ISPS_ARRIVAL: 'security_system',
      PORT_HEALTH: 'crew_health',
      CUSTOMS_ENTRY: 'customs_cargo',
    };

    return sources[templateCode] || 'mixed_sources';
  }

  /**
   * Create auto-fill log entry
   */
  async logAutoFill(documentId: string, result: AutoFillResult): Promise<void> {
    // Would create AutoFillLog entry
    // For now, just log to console
    console.log(`Auto-filled document ${documentId}:`, {
      fields: result.fieldsFilled.length,
      progress: `${(result.fillProgress * 100).toFixed(1)}%`,
      duration: `${result.fillDuration}ms`,
      source: result.dataSource,
    });
  }
}

export const documentAutoFillService = new DocumentAutoFillService();
