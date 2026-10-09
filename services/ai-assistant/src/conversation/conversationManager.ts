export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  startedAt: string;
  status: 'active' | 'closed';
  messages: Message[];
}

export class ConversationManager {
  private conversations = new Map<string, Conversation>();

  getOrCreate(userId: string, conversationId?: string): Conversation {
    if (conversationId && this.conversations.has(conversationId)) {
      return this.conversations.get(conversationId)!;
    }
    const conversation: Conversation = {
      id: conversationId ?? crypto.randomUUID(),
      userId,
      startedAt: new Date().toISOString(),
      status: 'active',
      messages: [],
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  appendMessage(conversationId: string, message: Omit<Message, 'id' | 'conversationId' | 'createdAt'>): Message {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    const fullMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      createdAt: new Date().toISOString(),
      ...message,
    };
    conversation.messages.push(fullMessage);
    return fullMessage;
  }
}
