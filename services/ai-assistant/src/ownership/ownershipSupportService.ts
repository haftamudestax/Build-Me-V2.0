/**
 * Domain logic for ownership support: looking up ownership records,
 * answering ownership-related questions, and any business rules specific
 * to ownership (transfer status, disputes, verification, etc).
 *
 * This should call into database/schema (via the Drizzle client) rather
 * than services/api directly, to avoid a circular service dependency.
 */

import type { OwnershipContext } from '../conversation/contextBuilder';

export async function getOwnershipContext(userId: string): Promise<OwnershipContext> {
  // TODO: replace with a real query against database/schema (e.g. projects.ts,
  // or a dedicated ownership table if one doesn't exist yet).
  return {
    userId,
    recordSummary: 'No ownership records loaded yet — stub response.',
  };
}
