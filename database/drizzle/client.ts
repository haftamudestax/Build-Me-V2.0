import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — check your .env file.');
}

const queryClient = postgres(process.env.DATABASE_URL, {
  prepare: process.env.DATABASE_URL.includes(':6543') ? false : true,
});

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;
