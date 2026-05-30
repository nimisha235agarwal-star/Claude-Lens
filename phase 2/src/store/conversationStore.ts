'use client';

import { create } from 'zustand';
import { DEFAULT_TITLE, MBA_AUTO_TAGS, normalizeTag } from '@/constants/highStakesKeywords';
import { createMessageId } from '@/lib/ids';
import { streamChat, classifyMessage } from '@/lib/api';
import {
  createEmptyConversation,
  loadConversation,
  loadPrefs,
  saveConversation,
  savePrefs,
  truncateTitle,
} from '@/lib/storage';
import type { Conversation, Message } from '@/types/conversation.types';

const DEFAULT_DISCLAIMER =
  'This recommendation depends heavily on assumptions and should be independently verified. High-stakes mode is on for career-related decisions. Uncertainty is surfaced more visibly, and verification steps are suggested below.';

interface ConversationState {
  conversation: Conversation | null;
  draft: string;
  hydrated: boolean;
  isLoading: boolean;
  apiError: string | null;
  load: (id: string) => void;
  setDraft: (draft: string) => void;
  setTitle: (title: string) => void;
  toggleHighStakes: (on?: boolean) => void;
  enableHighStakesFromBanner: () => void;
  dismissHsBanner: () => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  sendMessageWithReply: (content: string) => Promise<void>;
  clearApiError: () => void;
  resetForNewId: (id: string) => void;
  persist: () => void;
}

function mergeTags(existing: string[], add: string[]): string[] {
  const set = new Set(existing);
  add.forEach((t) => set.add(t));
  return Array.from(set);
}

function historyBefore(messages: Message[], excludeId: string) {
  return messages
    .filter((m) => m.id !== excludeId && m.content && !m.isStreaming)
    .map((m) => ({ role: m.role, content: m.content }));
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversation: null,
  draft: '',
  hydrated: false,
  isLoading: false,
  apiError: null,

  load: (id: string) => {
    const prefs = loadPrefs();
    const existing = loadConversation(id);
    const conversation =
      existing ??
      (() => {
        const c = createEmptyConversation(id);
        if (prefs.highStakesDefault) c.highStakesMode = true;
        return c;
      })();
    set({ conversation, draft: '', hydrated: true, apiError: null });
  },

  setDraft: (draft) => set({ draft }),

  clearApiError: () => set({ apiError: null }),

  setTitle: (title) => {
    const c = get().conversation;
    if (!c) return;
    set({
      conversation: {
        ...c,
        title: truncateTitle(title) || DEFAULT_TITLE,
        updatedAt: new Date().toISOString(),
      },
    });
    get().persist();
  },

  toggleHighStakes: (on) => {
    const c = get().conversation;
    if (!c) return;
    const highStakesMode = on ?? !c.highStakesMode;
    const tags = highStakesMode ? mergeTags(c.tags, [...MBA_AUTO_TAGS]) : c.tags;
    set({
      conversation: {
        ...c,
        highStakesMode,
        tags,
        updatedAt: new Date().toISOString(),
      },
    });
    savePrefs({ highStakesDefault: highStakesMode });
    get().persist();
  },

  enableHighStakesFromBanner: () => {
    const c = get().conversation;
    if (!c) return;
    set({
      conversation: {
        ...c,
        highStakesMode: true,
        hsBannerDismissed: false,
        tags: mergeTags(c.tags, [...MBA_AUTO_TAGS]),
        updatedAt: new Date().toISOString(),
      },
    });
    savePrefs({ highStakesDefault: true });
    get().persist();
  },

  dismissHsBanner: () => {
    const c = get().conversation;
    if (!c) return;
    set({
      conversation: {
        ...c,
        hsBannerDismissed: true,
        updatedAt: new Date().toISOString(),
      },
    });
    get().persist();
  },

  addTag: (raw) => {
    const slug = normalizeTag(raw);
    if (!slug) return;
    const c = get().conversation;
    if (!c || c.tags.includes(slug)) return;
    set({
      conversation: {
        ...c,
        tags: [...c.tags, slug],
        updatedAt: new Date().toISOString(),
      },
    });
    get().persist();
  },

  removeTag: (tag) => {
    const c = get().conversation;
    if (!c) return;
    set({
      conversation: {
        ...c,
        tags: c.tags.filter((t) => t !== tag),
        updatedAt: new Date().toISOString(),
      },
    });
    get().persist();
  },

  sendMessageWithReply: async (content) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const c = get().conversation;
    if (!c || get().isLoading) return;

    const userMsg: Message = {
      id: createMessageId(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const assistantId = createMessageId();
    const assistantPlaceholder: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      createdAt: new Date().toISOString(),
    };

    const isFirst = c.messages.length === 0;
    const title = isFirst ? truncateTitle(trimmed) : c.title;

    let working: Conversation = {
      ...c,
      title,
      messages: [...c.messages, userMsg, assistantPlaceholder],
      updatedAt: new Date().toISOString(),
      sessionDisclaimer: c.highStakesMode
        ? c.sessionDisclaimer || DEFAULT_DISCLAIMER
        : c.sessionDisclaimer,
    };

    set({ conversation: working, draft: '', isLoading: true, apiError: null });
    get().persist();

    const updateAssistant = (patch: Partial<Message>) => {
      working = {
        ...working,
        messages: working.messages.map((m) =>
          m.id === assistantId ? { ...m, ...patch } : m,
        ),
      };
      set({ conversation: { ...working } });
    };

    try {
      await streamChat(
        {
          message: trimmed,
          history: historyBefore(working.messages, assistantId),
          high_stakes_mode: working.highStakesMode,
          tags: working.tags,
          conversation_id: working.id,
        },
        {
          onMeta: (meta) => {
            if (meta.disclaimer || working.highStakesMode) {
              working = {
                ...working,
                sessionDisclaimer: meta.disclaimer || DEFAULT_DISCLAIMER,
              };
              set({ conversation: { ...working } });
            }
          },
          onToken: (text) => {
            const current = working.messages.find((m) => m.id === assistantId);
            updateAssistant({ content: (current?.content ?? '') + text });
          },
          onError: (detail) => {
            set({ apiError: detail });
          },
        },
      );

      const final = working.messages.find((m) => m.id === assistantId);
      const fullText = final?.content?.trim() ?? '';

      updateAssistant({ isStreaming: true });

      let claims: Message['claims'] = [];
      if (fullText) {
        try {
          claims = await classifyMessage(fullText, trimmed, working.highStakesMode);
        } catch {
          claims = [];
        }
      }

      updateAssistant({
        content: fullText || '(No response)',
        isStreaming: false,
        claims,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to reach Claude Lens API';
      set({ apiError: msg });
      working = {
        ...working,
        messages: working.messages.filter((m) => m.id !== assistantId),
      };
      set({ conversation: working });
    } finally {
      set({ isLoading: false });
      get().persist();
    }
  },

  resetForNewId: (id: string) => {
    const prefs = loadPrefs();
    const conversation = createEmptyConversation(id);
    if (prefs.highStakesDefault) {
      conversation.highStakesMode = true;
      conversation.tags = [...MBA_AUTO_TAGS];
    }
    set({ conversation, draft: '', hydrated: true, isLoading: false, apiError: null });
    saveConversation(conversation);
  },

  persist: () => {
    const c = get().conversation;
    if (c) saveConversation(c);
  },
}));
