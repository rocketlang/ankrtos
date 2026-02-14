#!/usr/bin/env node

/**
 * Pratham CRM Lead Importer
 * Imports lead data from CSV into Telehub PostgreSQL database
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const pg = require('pg');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ankr_eon',
  user: 'ankr',
  password: 'indrA@0612'
};

// CSV file path
const csvFilePath = process.argv[2] || '/root/pratham-leads.csv';

// Status mapping from CRM to Telehub
const statusMapping = {
  'new': 'new',
  'contacted': 'contacted',
  'interested': 'interested',
  'qualified': 'interested',
  'negotiation': 'interested',
  'converted': 'converted',
  'won': 'converted',
  'lost': 'lost',
  'not_interested': 'lost',
  'callback': 'contacted'
};

/**
 * Calculate lead score based on multiple factors
 */
function calculateLeadScore(lead) {
  let score = 50; // Base score

  // Status bonus
  const statusScores = {
    'interested': 20,
    'contacted': 10,
    'new': 5,
    'converted': -50, // Already converted
    'lost': -50 // Lost lead
  };
  score += statusScores[lead.status] || 0;

  // Recency bonus (if last_contact exists)
  if (lead.last_contact) {
    const daysSinceContact = Math.floor((Date.now() - new Date(lead.last_contact)) / (1000 * 60 * 60 * 24));
    if (daysSinceContact < 7) score += 15;
    else if (daysSinceContact < 30) score += 5;
    else if (daysSinceContact > 90) score -= 10;
  }

  // Email bonus
  if (lead.email) score += 5;

  // Company/organization bonus
  if (lead.organization || lead.company) score += 10;

  // Keep score in range 1-100
  return Math.max(1, Math.min(100, score));
}

/**
 * Parse phone number to standard format
 */
function parsePhone(phone) {
  if (!phone) return null;

  // Remove all non-digit characters
  let cleaned = phone.toString().replace(/\D/g, '');

  // Add +91 if it's a 10-digit Indian number
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  // Remove leading + if present
  cleaned = cleaned.replace(/^\+/, '');

  return '+' + cleaned;
}

/**
 * Import leads from CSV
 */
async function importLeads() {
  console.log('🚀 Pratham CRM Lead Importer\n');

  // Check if file exists
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: CSV file not found at ${csvFilePath}`);
    console.log('\nUsage: node import-leads.js [path-to-csv]');
    console.log('Example: node import-leads.js /root/pratham-leads.csv\n');
    process.exit(1);
  }

  console.log(`📄 Reading CSV file: ${csvFilePath}`);

  // Read and parse CSV
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  let records;

  try {
    records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });
  } catch (error) {
    console.error('❌ Error parsing CSV:', error.message);
    process.exit(1);
  }

  console.log(`✅ Found ${records.length} leads in CSV\n`);

  // Connect to database
  const client = new pg.Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Get random telecaller for assignment
    const telecallerResult = await client.query(
      "SELECT id FROM telehub.users WHERE role = 'telecaller' ORDER BY RANDOM() LIMIT 1"
    );
    const defaultTelecallerId = telecallerResult.rows[0]?.id;

    console.log('📊 Processing leads...\n');

    for (const [index, record] of records.entries()) {
      try {
        // Map CSV columns (flexible column name matching)
        const lead = {
          name: record.name || record.Name || record.contact_name || record['Contact Name'] || null,
          phone: parsePhone(record.phone || record.Phone || record.mobile || record.Mobile || record.contact_number),
          email: record.email || record.Email || record['Email Address'] || null,
          organization: record.organization || record.Organization || record.company || record.Company || record.school || record.School || null,
          designation: record.designation || record.Designation || record.title || record.Title || null,
          city: record.city || record.City || record.location || record.Location || null,
          state: record.state || record.State || null,
          status: record.status || record.Status || 'new',
          source: record.source || record.Source || 'crm_import',
          notes: record.notes || record.Notes || record.remarks || record.Remarks || null,
          last_contact: record.last_contact || record['Last Contact'] || null,
          created_at: record.created_at || record['Created Date'] || null
        };

        // Validate required fields
        if (!lead.name || !lead.phone) {
          console.log(`⚠️  Row ${index + 1}: Skipped - Missing name or phone`);
          skipped++;
          continue;
        }

        // Map status
        lead.status = statusMapping[lead.status.toLowerCase()] || 'new';

        // Calculate lead score
        const leadScore = calculateLeadScore(lead);

        // Build metadata JSON
        const metadata = {
          source: 'crm_import',
          imported_at: new Date().toISOString(),
          original_status: record.status || record.Status,
          csv_row: index + 1
        };

        // Add optional fields to metadata
        if (lead.organization) metadata.organization = lead.organization;
        if (lead.designation) metadata.designation = lead.designation;
        if (lead.city) metadata.city = lead.city;
        if (lead.state) metadata.state = lead.state;
        if (lead.source) metadata.original_source = lead.source;
        if (lead.notes) metadata.notes = lead.notes;

        // Check if lead already exists (by phone)
        const existingLead = await client.query(
          'SELECT id FROM telehub.leads WHERE phone = $1',
          [lead.phone]
        );

        if (existingLead.rows.length > 0) {
          // Update existing lead
          await client.query(`
            UPDATE telehub.leads
            SET
              name = $1,
              email = COALESCE($2, email),
              status = $3,
              lead_score = $4,
              metadata = metadata || $5::jsonb,
              updated_at = NOW()
            WHERE phone = $6
          `, [lead.name, lead.email, lead.status, leadScore, JSON.stringify(metadata), lead.phone]);

          updated++;
          console.log(`🔄 Row ${index + 1}: Updated - ${lead.name} (${lead.phone})`);
        } else {
          // Insert new lead
          await client.query(`
            INSERT INTO telehub.leads (
              name, phone, email, status, lead_score,
              assigned_to, metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::timestamptz, NOW()), NOW())
          `, [
            lead.name,
            lead.phone,
            lead.email,
            lead.status,
            leadScore,
            defaultTelecallerId,
            JSON.stringify(metadata),
            lead.created_at
          ]);

          imported++;
          console.log(`✅ Row ${index + 1}: Imported - ${lead.name} (${lead.phone}) - Score: ${leadScore}`);
        }

      } catch (error) {
        errors++;
        console.error(`❌ Row ${index + 1}: Error - ${error.message}`);
      }

      // Progress indicator every 10 leads
      if ((index + 1) % 10 === 0) {
        console.log(`\n--- Progress: ${index + 1}/${records.length} leads processed ---\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Import Summary');
    console.log('='.repeat(60));
    console.log(`✅ Imported:  ${imported} new leads`);
    console.log(`🔄 Updated:   ${updated} existing leads`);
    console.log(`⚠️  Skipped:   ${skipped} invalid records`);
    console.log(`❌ Errors:    ${errors} failed imports`);
    console.log(`📈 Total:     ${records.length} records processed`);
    console.log('='.repeat(60) + '\n');

    // Show sample of imported leads
    const sampleLeads = await client.query(`
      SELECT name, phone, status, lead_score, created_at
      FROM telehub.leads
      WHERE metadata->>'source' = 'crm_import'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (sampleLeads.rows.length > 0) {
      console.log('📋 Sample of Imported Leads:');
      console.log('-'.repeat(60));
      sampleLeads.rows.forEach((lead, i) => {
        console.log(`${i + 1}. ${lead.name} | ${lead.phone} | ${lead.status} | Score: ${lead.lead_score}`);
      });
      console.log('-'.repeat(60) + '\n');
    }

    console.log('✅ Import completed successfully!\n');
    console.log('🚀 Next steps:');
    console.log('   1. Restart Telehub: cd /root/pratham-telehub-poc && ./start.sh');
    console.log('   2. Open dashboard: http://localhost:3101');
    console.log('   3. View imported leads in telecaller dashboard\n');

  } catch (error) {
    console.error('\n❌ Database error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run importer
importLeads().catch(console.error);
