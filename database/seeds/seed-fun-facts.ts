import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { funFacts } from "../drizzle/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const facts = [
  { icon: "🎓", text: "Full-Stack student at freeCodeCamp", position: 1 },
  { icon: "⚡", text: "Full-Stack Developer & Electrical Engineer", position: 2 },
  { icon: "🌐", text: "Member of Microverse Alumni", position: 3 },
  { icon: "🚀", text: "Taking part in Xcelsz Accelerator Program", position: 4 },
];

async function seed() {
  await db.delete(funFacts);
  await db.insert(funFacts).values(facts);
  console.log("Seeded 4 fun facts.");
  await pool.end();
  process.exit(0);
}

seed();
