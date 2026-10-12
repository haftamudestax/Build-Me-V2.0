import type { NewUser } from '../../schema/users';

/**
 * Sample users for local/dev seeding.
 *
 * IMPORTANT: users.id must match a real row in Supabase's auth.users table
 * (see database/schema/users.ts). For LOCAL development against a plain
 * Postgres instance (no real Supabase auth), the hardcoded UUIDs below are
 * fine as-is. If you're seeding against an actual Supabase project, create
 * these users via the Supabase Auth Admin API first and use their real
 * generated UUIDs here instead — otherwise the foreign key relationships
 * from profiles/projects/leads will be seeding against users that don't
 * really exist in auth.users.
 */
export const usersSeedData: NewUser[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@example.com',
    role: 'admin',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'alice@example.com',
    role: 'user',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'bob@example.com',
    role: 'user',
  },
];
