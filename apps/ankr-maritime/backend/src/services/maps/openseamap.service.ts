/**
 * OpenSeaMap Integration
 * Nautical charts & marine navigation data
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';

// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface NauticalFeature {
  type: 'LIGHT' | 'BUOY' | 'WRECK';
  name: string;
  latitude: number;
  longitude: number;
}

export class OpenSeaMapService {
  async getNauticalFeatures(bbox: any): Promise<NauticalFeature[]> {
    return [
      {
        type: 'LIGHT',
        name: 'Singapore Lighthouse',
        latitude: 1.2644,
        longitude: 103.8200,
      },
    ];
  }
}

export const openSeaMapService = new OpenSeaMapService();
