import { builder } from '../builder';
import { getGISISService } from '../../services/gisis-owner-service';
import { prisma } from '../context.js';

// VesselOwnership type
const VesselOwnership = builder.objectType('VesselOwnership', {
  fields: (t) => ({
    name: t.string({ nullable: true }),
    imoNumber: t.string({ nullable: true }),
    callSign: t.string({ nullable: true }),
    flag: t.string({ nullable: true }),
    mmsi: t.string({ nullable: true }),
    type: t.string({ nullable: true }),
    buildDate: t.string({ nullable: true }),
    grossTonnage: t.string({ nullable: true }),
    registeredOwner: t.string({ nullable: true }),
    operator: t.string({ nullable: true }),
    technicalManager: t.string({ nullable: true }),
    docCompany: t.string({ nullable: true }),
    ismManager: t.string({ nullable: true }),
    scrapedAt: t.field({ type: 'DateTime', nullable: true }),
  }),
});

// Query: Get vessel owner by IMO number
builder.queryField('vesselOwnerByIMO', (t) =>
  t.field({
    type: VesselOwnership,
    nullable: true,
    args: {
      imoNumber: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, _ctx) => {
      try {
        const gisisService = await getGISISService();
        const ownerData = await gisisService.getVesselOwnerByIMO(args.imoNumber);

        // Optionally cache in database for future lookups
        if (ownerData && ownerData.registeredOwner) {
          // Update vessel record if it exists
          const vessel = await prisma.vessel.findFirst({
            where: { imo: args.imoNumber },
          });

          if (vessel) {
            // Store owner in metadata or create related company
            await prisma.vessel.update({
              where: { id: vessel.id },
              data: {
                // You could add ownerName field to Vessel model
                // or create a Company and link it
                updatedAt: new Date(),
              },
            });
          }
        }

        return ownerData;
      } catch (error: any) {
        console.error('Error fetching vessel owner:', error);
        throw new Error(`Failed to fetch owner: ${error.message}`);
      }
    },
  })
);

// Mutation: Fetch and cache owner for multiple vessels
builder.mutationField('fetchVesselOwners', (t) =>
  t.field({
    type: ['VesselOwnership'],
    args: {
      imoNumbers: t.arg.stringList({ required: true }),
    },
    resolve: async (_root, args, _ctx) => {
      try {
        const gisisService = await getGISISService();
        const results: any[] = [];

        for (const imoNumber of args.imoNumbers) {
          const ownerData = await gisisService.getVesselOwnerByIMO(imoNumber);
          if (ownerData) {
            results.push(ownerData);
          }
          // Rate limiting: wait 2 seconds between requests
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return results;
      } catch (error: any) {
        console.error('Error batch fetching owners:', error);
        throw new Error(`Failed to batch fetch: ${error.message}`);
      }
    },
  })
);

export { VesselOwnership };
