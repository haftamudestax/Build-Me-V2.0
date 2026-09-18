import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { contactMessages } from "../drizzle/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  await db.insert(contactMessages).values({
    name: "Test User",
    email: "test@example.com",
    message: "Seed data example",
  });
  console.log("Seeded.");
  await pool.end();
  process.exit(0);
}

seed();