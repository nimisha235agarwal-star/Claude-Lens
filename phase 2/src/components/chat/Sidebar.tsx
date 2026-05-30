'use client';

import { useEffect, useState } from 'react';
import { loadIndex, saveIndex } from '@/lib/storage';
import type { ConversationSummary } from '@/types/conversation.types';
import { useConversationStore } from '@/store/conversationStore';
import styles from './Sidebar.module.css';

interface SidebarProps {
  currentId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export function Sidebar({ currentId, onSelectConversation, onNewChat }: SidebarProps) {
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const { conversation, toggleHighStakes } = useConversationStore();

  const loadHistory = () => {
    setHistory(loadIndex());
  };

  // Reload history when active conversation saves or changes
  useEffect(() => {
    loadHistory();
  }, [conversation?.updatedAt, conversation?.id]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm('Are you sure you want to delete this conversation?');
    if (!confirmDelete) return;

    // Remove from index
    const nextIndex = history.filter((c) => c.id !== id);
    saveIndex(nextIndex);
    localStorage.removeItem(`claude-lens:conversation:${id}`);
    setHistory(nextIndex);

    // If we deleted current conversation, start a new one
    if (id === currentId) {
      onNewChat();
    }
  };

  const handleClearAll = () => {
    const confirmClear = window.confirm(
      'Are you sure you want to clear all conversations? This cannot be undone.'
    );
    if (!confirmClear) return;

    // Clear local storage entries
    history.forEach((c) => {
      localStorage.removeItem(`claude-lens:conversation:${c.id}`);
    });
    saveIndex([]);
    setHistory([]);
    onNewChat();
  };

  return (
    <aside className={styles.sidebar} role="navigation" aria-label="Chat History & Controls">
      {/* Brand Logo Header */}
      <div className={styles.logoArea}>
        <svg className={styles.lensIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M18 18l4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span className={styles.logoText}>Claude Lens</span>
      </div>

      {/* Primary Actions */}
      <div className={styles.actionsArea}>
        <button type="button" className={styles.newChatBtn} onClick={onNewChat}>
          + New Chat
        </button>
      </div>

      {/* Scrollable Conversation List */}
      <div className={styles.historyList}>
        <div className={styles.sectionHeader}>Conversations</div>
        {history.length === 0 ? (
          <div className={styles.emptyHistory}>No chats yet</div>
        ) : (
          <div className={styles.scrollContainer}>
            {history.map((item) => {
              const isActive = item.id === currentId;
              const date = new Date(item.updatedAt);
              const formattedDate = date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={item.id}
                  className={`${styles.historyItem} ${isActive ? styles.activeItem : ''}`}
                  onClick={() => onSelectConversation(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectConversation(item.id);
                    }
                  }}
                >
                  <div className={styles.itemTitle} title={item.title}>
                    {item.title}
                  </div>
                  <div className={styles.itemFooter}>
                    <span className={styles.itemDate}>{formattedDate}</span>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete conversation"
                      aria-label={`Delete ${item.title}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Config & Cleanup Footer */}
      <div className={styles.footer}>
        <div className={styles.hsToggleRow}>
          <div className={styles.hsLabelContainer}>
            <span className={styles.hsLabelText}>High-Stakes Mode</span>
            <span
              className={styles.infoIcon}
              title="Enable for career, financial, medical, or research decisions."
            >
              ℹ️
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={conversation?.highStakesMode ?? false}
            aria-label="Toggle High-Stakes Mode globally"
            className={`${styles.toggle} ${conversation?.highStakesMode ? styles.toggleOn : ''}`}
            onClick={() => toggleHighStakes()}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        <button type="button" className={styles.clearAllBtn} onClick={handleClearAll}>
          Clear All Chats
        </button>
      </div>
    </aside>
  );
}
