/**
 * Neon PostgreSQL server-side connection.
 * Database credentials must never be exposed to clients.
 * All database access goes through this server-side module.
 */

import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export type Sql = typeof sql;
