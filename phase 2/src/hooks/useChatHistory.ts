'use client';

import { useCallback } from 'react';
import type { Conversation } from '@/types/conversation.types';
import { loadIndex, saveConversation, saveIndex } from '@/lib/storage';

export function useChatHistory() {
  const upsert = useCallback((conversation: Conversation) => {
    saveConversation(conversation);
  }, []);

  const remove = useCallback((id: string) => {
    const index = loadIndex().filter((c) => c.id !== id);
    saveIndex(index);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`claude-lens:conversation:${id}`);
    }
  }, []);

  return { upsert, remove, loadIndex };
}
