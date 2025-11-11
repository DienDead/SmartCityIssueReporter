import { Pool } from "pg"
import { config } from "./config.mjs"

export const pool = new Pool({
  connectionString: config.db.url,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
})

export async function query(sql, params = []) {
  const client = await pool.connect()
  try {
    const res = await client.query(sql, params)
    return res
  } finally {
    client.release()
  }
}
