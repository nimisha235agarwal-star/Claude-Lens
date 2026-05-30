export function createConversationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createMessageId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
