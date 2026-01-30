import DataLoader from 'dataloader';
import type { PrismaClient } from '@prisma/client';

/**
 * Generic batch-by-ID loader factory (Fr8X pattern).
 * Works for any Prisma model with a string `id` primary key.
 */
function createBatchById<T extends { id: string }>(
  findMany: (args: { where: { id: { in: string[] } } }) => Promise<T[]>,
) {
  return new DataLoader<string, T | null>(async (ids) => {
    const items = await findMany({ where: { id: { in: ids as string[] } } });
    const map = new Map(items.map((item) => [item.id, item]));
    return ids.map((id) => map.get(id) ?? null);
  });
}

/**
 * Generic batch-by-foreign-key loader factory.
 * Returns arrays of items grouped by the FK value.
 */
function createBatchByForeignKey<T extends Record<string, unknown>>(
  findMany: (args: { where: Record<string, { in: string[] }> }) => Promise<T[]>,
  foreignKey: string,
) {
  return new DataLoader<string, T[]>(async (keys) => {
    const items = await findMany({
      where: { [foreignKey]: { in: keys as string[] } },
    });
    const map = new Map<string, T[]>();
    for (const item of items) {
      const key = item[foreignKey] as string;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return keys.map((key) => map.get(key) ?? []);
  });
}

export function createLoaders(prisma: PrismaClient) {
  return {
    vessel: createBatchById(prisma.vessel.findMany.bind(prisma.vessel)),
    port: createBatchById(prisma.port.findMany.bind(prisma.port)),
    company: createBatchById(prisma.company.findMany.bind(prisma.company)),
    charter: createBatchById(prisma.charter.findMany.bind(prisma.charter)),
    voyage: createBatchById(prisma.voyage.findMany.bind(prisma.voyage)),
    voyagesByVessel: createBatchByForeignKey(
      prisma.voyage.findMany.bind(prisma.voyage),
      'vesselId',
    ),
    chartersByVessel: createBatchByForeignKey(
      prisma.charter.findMany.bind(prisma.charter),
      'vesselId',
    ),
  };
}

export type DataLoaders = ReturnType<typeof createLoaders>;
