import { db } from '../drizzle/client';
import { users } from '../schema/users';
import { usersSeedData } from './data/users';

/**
 * Seeds the users table. Safe to re-run: existing rows (matched by id)
 * are left untouched rather than causing a duplicate-key error.
 */
export async function seedUsers(): Promise<void> {
  console.log(`Seeding ${usersSeedData.length} users...`);

  await db.insert(users).values(usersSeedData).onConflictDoNothing({ target: users.id });

  console.log('Users seeded.');
}

// Allow running this file directly: `tsx seeds/seed-users.ts`
if (require.main === module) {
  seedUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to seed users:', err);
      process.exit(1);
    });
}
