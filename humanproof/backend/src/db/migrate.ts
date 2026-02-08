import { initializeDatabase } from './database';

console.log('🔄 Running database migrations...');
initializeDatabase();
console.log('✅ Migration complete!');
process.exit(0);
