#!/usr/bin/env tsx
/**
 * Generate comprehensive port tariff coverage report
 * Shows statistics on 800+ ports with tariff data
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

interface PortStats {
  portId: string;
  portName: string;
  unlocode: string;
  country: string;
  tariffCount: number;
  lastUpdated?: Date;
  categories: string[];
}

async function main() {
  console.log('='.repeat(80));
  console.log('PORT TARIFF DATABASE - COMPREHENSIVE COVERAGE REPORT');
  console.log('='.repeat(80));
  console.log(`Generated at: ${new Date().toISOString()}\n`);

  // Get all ports with tariff data
  const ports = await prisma.port.findMany({
    include: {
      tariffs: {
        select: {
          id: true,
          chargeType: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`Total Ports in Database: ${ports.length}`);

  // Separate ports with and without tariffs
  const portsWithTariffs = ports.filter(p => p.tariffs && p.tariffs.length > 0);
  const portsWithoutTariffs = ports.filter(p => !p.tariffs || p.tariffs.length === 0);

  console.log(`Ports WITH Tariff Data: ${portsWithTariffs.length}`);
  console.log(`Ports WITHOUT Tariff Data: ${portsWithoutTariffs.length}\n`);

  // Calculate detailed statistics
  const portStats: PortStats[] = portsWithTariffs.map(port => {
    const categories = [...new Set(port.tariffs.map(t => t.chargeType))];
    const lastUpdated = port.tariffs.reduce((latest, t) => {
      return !latest || t.updatedAt > latest ? t.updatedAt : latest;
    }, null as Date | null);

    return {
      portId: port.id,
      portName: port.name,
      unlocode: port.unlocode || 'N/A',
      country: port.country || 'Unknown',
      tariffCount: port.tariffs.length,
      lastUpdated: lastUpdated || undefined,
      categories,
    };
  });

  // Sort by tariff count (descending)
  portStats.sort((a, b) => b.tariffCount - a.tariffCount);

  // Calculate aggregate stats
  const totalTariffs = portStats.reduce((sum, p) => sum + p.tariffCount, 0);
  const avgTariffsPerPort = totalTariffs / portStats.length;
  const maxTariffs = portStats[0]?.tariffCount || 0;
  const minTariffs = portStats[portStats.length - 1]?.tariffCount || 0;

  // Country breakdown
  const countryBreakdown = portStats.reduce((acc, p) => {
    acc[p.country] = (acc[p.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCountries = Object.entries(countryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  // Category breakdown
  const allCategories = portStats.flatMap(p => p.categories);
  const chargeTypeBreakdown = allCategories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(chargeTypeBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  // Print summary to console
  console.log('='.repeat(80));
  console.log('SUMMARY STATISTICS');
  console.log('='.repeat(80));
  console.log(`Total Tariffs Indexed:     ${totalTariffs.toLocaleString()}`);
  console.log(`Average per Port:          ${avgTariffsPerPort.toFixed(1)}`);
  console.log(`Maximum (Single Port):     ${maxTariffs} (${portStats[0]?.portName})`);
  console.log(`Minimum (Single Port):     ${minTariffs}`);
  console.log(`Countries Covered:         ${Object.keys(countryBreakdown).length}`);
  console.log(`Tariff Categories:         ${Object.keys(chargeTypeBreakdown).length}`);

  console.log('\n' + '-'.repeat(80));
  console.log('TOP 10 PORTS BY TARIFF COUNT');
  console.log('-'.repeat(80));
  portStats.slice(0, 10).forEach((p, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. ${p.portName.padEnd(30)} ${p.tariffCount.toString().padStart(4)} tariffs`);
  });

  console.log('\n' + '-'.repeat(80));
  console.log('TOP 20 COUNTRIES BY PORT COVERAGE');
  console.log('-'.repeat(80));
  topCountries.forEach(([country, count], i) => {
    console.log(`${(i + 1).toString().padStart(2)}. ${country.padEnd(30)} ${count.toString().padStart(4)} ports`);
  });

  // Generate comprehensive markdown report
  const mdReport = `# Port Tariff Database Coverage Report

**Generated:** ${new Date().toISOString()}

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Ports in Database | ${ports.length.toLocaleString()} |
| Ports with Tariff Data | ${portsWithTariffs.length.toLocaleString()} |
| Ports without Tariff Data | ${portsWithoutTariffs.length.toLocaleString()} |
| **Coverage Rate** | **${((portsWithTariffs.length / ports.length) * 100).toFixed(1)}%** |
| Total Tariffs Indexed | ${totalTariffs.toLocaleString()} |
| Average Tariffs per Port | ${avgTariffsPerPort.toFixed(1)} |
| Countries Covered | ${Object.keys(countryBreakdown).length} |
| Tariff Categories | ${Object.keys(chargeTypeBreakdown).length} |

## Top 20 Ports by Tariff Count

| Rank | Port | UNLOCODE | Country | Tariff Count | Last Updated |
|------|------|----------|---------|--------------|--------------|
${portStats.slice(0, 20).map((p, i) => `| ${i + 1} | ${p.portName} | ${p.unlocode} | ${p.country} | ${p.tariffCount} | ${p.lastUpdated?.toISOString().split('T')[0] || 'N/A'} |`).join('\n')}

## Geographic Coverage

### Top 20 Countries by Port Count

| Rank | Country | Ports with Tariffs |
|------|---------|-------------------|
${topCountries.map(([country, count], i) => `| ${i + 1} | ${country} | ${count} |`).join('\n')}

## Tariff Categories

### Most Common Categories

| Rank | Category | Port Count |
|------|----------|------------|
${topCategories.map(([chargeType, count], i) => `| ${i + 1} | ${chargeType} | ${count} |`).join('\n')}

## Coverage Analysis

### Ports with Complete Data (10+ Tariffs)

${portStats.filter(p => p.tariffCount >= 10).length} ports have comprehensive tariff coverage (10+ tariffs)

**Percentage:** ${((portStats.filter(p => p.tariffCount >= 10).length / portStats.length) * 100).toFixed(1)}%

### Ports Needing Updates (1-9 Tariffs)

${portStats.filter(p => p.tariffCount < 10).length} ports have partial coverage

## All Ports with Tariff Data

${portStats.map((p, i) => `
### ${i + 1}. ${p.portName} (${p.unlocode})

- **Country:** ${p.country}
- **Tariff Count:** ${p.tariffCount}
- **Categories:** ${p.categories.join(', ')}
- **Last Updated:** ${p.lastUpdated?.toISOString().split('T')[0] || 'N/A'}
`).join('\n')}

## Ports WITHOUT Tariff Data (Queue for Scraping)

${portsWithoutTariffs.length > 0 ? `
Total: ${portsWithoutTariffs.length} ports

${portsWithoutTariffs.slice(0, 50).map((p, i) => `${i + 1}. ${p.name} (${p.unlocode || 'N/A'}) - ${p.country || 'Unknown'}`).join('\n')}

${portsWithoutTariffs.length > 50 ? `\n_...and ${portsWithoutTariffs.length - 50} more ports_` : ''}
` : '_All ports have tariff data!_'}

## Recommendations

1. **Priority Scraping:** Focus on ${portsWithoutTariffs.slice(0, 10).map(p => p.name).join(', ')}
2. **Update Frequency:** Quarterly updates for top 100 ports
3. **Expansion:** Target ${Object.keys(countryBreakdown).length + 20} more countries
4. **Quality:** Verify and enrich tariffs for ports with < 5 entries

## Business Impact

- **Load Matching Ready:** ${portStats.filter(p => p.tariffCount >= 5).length} ports have sufficient data for accurate voyage estimates
- **Competitive Advantage:** ${((portsWithTariffs.length / 800) * 100).toFixed(0)}% of target 800 ports achieved
- **Market Coverage:** Operating in ${Object.keys(countryBreakdown).length} countries globally

---

*Generated by Mari8X Port Tariff Analytics Engine*
*Data Source: Mari8X Production Database*
`;

  // Save reports
  const jsonPath = path.join(__dirname, '../PORT-TARIFF-COVERAGE-REPORT.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalPorts: ports.length,
      portsWithTariffs: portsWithTariffs.length,
      portsWithoutTariffs: portsWithoutTariffs.length,
      coverageRate: `${((portsWithTariffs.length / ports.length) * 100).toFixed(1)}%`,
      totalTariffs,
      avgTariffsPerPort: avgTariffsPerPort.toFixed(1),
      countriesCovered: Object.keys(countryBreakdown).length,
      categoriesAvailable: Object.keys(chargeTypeBreakdown).length,
    },
    topPorts: portStats.slice(0, 20),
    topCountries,
    topCategories,
    allPortStats: portStats,
    portsNeedingTariffs: portsWithoutTariffs.map(p => ({
      id: p.id,
      name: p.name,
      unlocode: p.unlocode,
      country: p.country,
    })),
  }, null, 2));

  const mdPath = path.join(__dirname, '../PORT-TARIFF-COVERAGE-REPORT.md');
  fs.writeFileSync(mdPath, mdReport);

  console.log(`\n✅ Reports generated successfully!`);
  console.log(`📄 JSON Report: ${jsonPath}`);
  console.log(`📄 Markdown Report: ${mdPath}`);

  await prisma.$disconnect();
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
