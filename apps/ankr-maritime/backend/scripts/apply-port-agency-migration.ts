import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function applyMigration() {
  const sqlPath = path.join(__dirname, '../prisma/migrations/add_port_agency_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // Split SQL by semicolons and filter out empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

  console.log(`Applying ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement) {
      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 80)}...`);
        await prisma.$executeRawUnsafe(statement);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists')) {
          console.log(`  ⚠️  Table already exists, skipping`);
        } else {
          console.error(`  ❌ Error:`, error.message);
          throw error;
        }
      }
    }
  }

  console.log('✅ Migration applied successfully!');
}

applyMigration()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
