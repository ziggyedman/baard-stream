import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message)
})

/**
 * Run schema.sql once on startup.
 * Uses IF NOT EXISTS throughout so it's idempotent.
 */
export async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  const client = await pool.connect()
  try {
    await client.query(sql)
    console.log('✓ DB schema up to date')
  } catch (err) {
    console.error('Migration error:', err.message)
    throw err
  } finally {
    client.release()
  }
}

/** Convenience: run a parameterised query */
export const query = (text, params) => pool.query(text, params)

/** Convenience: run multiple queries in a transaction */
export async function transaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export default pool
