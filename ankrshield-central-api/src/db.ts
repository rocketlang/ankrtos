import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  user: 'ankrshield_central',
  password: 'ankrshield_central_2026',
  host: 'localhost',
  port: 5432,
  database: 'ankrshield_central',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// Helper to get single row
export async function queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
}

// Helper to get multiple rows
export async function queryMany<T>(sql: string, params: any[] = []): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows;
}

// Helper for insert/update/delete
export async function execute(sql: string, params: any[] = []): Promise<number> {
  const result = await pool.query(sql, params);
  return result.rowCount || 0;
}
