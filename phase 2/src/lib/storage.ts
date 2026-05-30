import type { Conversation, ConversationSummary } from '@/types/conversation.types';

const INDEX_KEY = 'claude-lens:conversations';
const CONVO_PREFIX = 'claude-lens:conversation:';
const PREFS_KEY = 'claude-lens:prefs';

export interface UserPrefs {
  highStakesDefault?: boolean;
}

export function conversationKey(id: string): string {
  return `${CONVO_PREFIX}${id}`;
}

export function loadIndex(): ConversationSummary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as ConversationSummary[]) : [];
  } catch {
    return [];
  }
}

export function saveIndex(index: ConversationSummary[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function loadConversation(id: string): Conversation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(conversationKey(id));
    return raw ? (JSON.parse(raw) as Conversation) : null;
  } catch {
    return null;
  }
}

export function saveConversation(conversation: Conversation): void {
  localStorage.setItem(conversationKey(conversation.id), JSON.stringify(conversation));
  const index = loadIndex().filter((c) => c.id !== conversation.id);
  index.unshift({
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt,
  });
  saveIndex(index);
}

export function createEmptyConversation(id: string): Conversation {
  const now = new Date().toISOString();
  return {
    id,
    title: 'New conversation',
    tags: [],
    highStakesMode: false,
    hsBannerDismissed: false,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function loadPrefs(): UserPrefs {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as UserPrefs) : {};
  } catch {
    return {};
  }
}

export function savePrefs(prefs: UserPrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function truncateTitle(text: string, max = 40): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
