import type { Conversation } from './conversationManager';

export interface OwnershipContext {
  userId: string;
  recordSummary: string; // TODO: replace with real structured ownership data
}

export function buildContext(conversation: Conversation, ownership: OwnershipContext): string {
  const history = conversation.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  return [
    `Ownership context for user ${ownership.userId}:`,
    ownership.recordSummary,
    '',
    'Conversation so far:',
    history,
  ].join('\n');
}
