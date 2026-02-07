/**
 * Maritime Statistics GraphQL Schema
 *
 * Efficient stats queries for landing page counters
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';

const MaritimeStatsType = builder.objectRef<{
  totalPorts: number;
  totalCountries: number;
  totalTariffs: number;
  portsCovered: number;
  portsWithOpenSeaMap: number;
  openSeaMapCoverage: number;
  lastUpdated: Date;
}>('MaritimeStats');

MaritimeStatsType.implement({
  fields: (t) => ({
    totalPorts: t.exposeInt('totalPorts'),
    totalCountries: t.exposeInt('totalCountries'),
    totalTariffs: t.exposeInt('totalTariffs'),
    portsCovered: t.exposeInt('portsCovered'),
    portsWithOpenSeaMap: t.exposeInt('portsWithOpenSeaMap'),
    openSeaMapCoverage: t.exposeFloat('openSeaMapCoverage'),
    lastUpdated: t.expose('lastUpdated', { type: 'DateTime' }),
  }),
});

async function getMaritimeStats() {
  // Get port statistics
  const [portStats] = await prisma.$queryRaw<Array<{
    total_ports: bigint;
    total_countries: bigint;
    ports_with_osm: bigint;
    ports_checked: bigint;
  }>>`
    SELECT
      COUNT(*) as total_ports,
      COUNT(DISTINCT country) as total_countries,
      COUNT(CASE WHEN "hasOpenSeaMap" = true THEN 1 END) as ports_with_osm,
      COUNT(CASE WHEN "openSeaMapCheckedAt" IS NOT NULL THEN 1 END) as ports_checked
    FROM ports
  `;

  // Get tariff statistics
  const [tariffStats] = await prisma.$queryRaw<Array<{
    total_tariffs: bigint;
    ports_covered: bigint;
  }>>`
    SELECT
      COUNT(*) as total_tariffs,
      COUNT(DISTINCT "portId") as ports_covered
    FROM port_tariffs
  `;

  const totalPorts = Number(portStats.total_ports);
  const portsWithOSM = Number(portStats.ports_with_osm);
  const portsChecked = Number(portStats.ports_checked);

  // Calculate coverage as percentage of CHECKED ports, not all ports
  // This gives a more accurate representation of OpenSeaMap data availability
  const coveragePercent = portsChecked > 0 ? (portsWithOSM / portsChecked) * 100 : 0;

  return {
    totalPorts,
    totalCountries: Number(portStats.total_countries),
    totalTariffs: Number(tariffStats.total_tariffs),
    portsCovered: Number(tariffStats.ports_covered),
    portsWithOpenSeaMap: portsWithOSM,
    openSeaMapCoverage: Math.round(coveragePercent * 10) / 10, // Round to 1 decimal
    lastUpdated: new Date(),
  };
}

builder.queryField('maritimeStats', (t) =>
  t.field({
    type: MaritimeStatsType,
    description: 'Maritime statistics for landing page counters',
    resolve: async () => {
      return await getMaritimeStats();
    },
  }),
);
