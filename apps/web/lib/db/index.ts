import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)

export const db: NeonHttpDatabase<typeof schema> = drizzle({
  client: sql,
  schema,
})

export { schema }
