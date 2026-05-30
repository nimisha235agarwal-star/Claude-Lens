'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/types/conversation.types';
import { UserMessageBubble } from './UserMessageBubble';
import { AssistantMessage } from './AssistantMessage';
import { DisclaimerBox } from './DisclaimerBox';
import styles from './ChatScrollRegion.module.css';

interface ChatScrollRegionProps {
  messages: Message[];
  highStakesMode: boolean;
  sessionDisclaimer?: string;
  emptyHint?: string;
  onStarterSelect?: (text: string) => void;
  onSentenceClick: (sentence: string) => void;
  onChallengeClick: (messageId: string, content: string) => void;
}

const STARTERS = [
  'Should I pursue an MBA in 2027?',
  'Is this a good time to invest in index funds?',
  'What are the risks of a low-carb diet long-term?',
];

export function ChatScrollRegion({
  messages,
  highStakesMode,
  sessionDisclaimer,
  emptyHint,
  onStarterSelect,
  onSentenceClick,
  onChallengeClick,
}: ChatScrollRegionProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const streamKey = messages.map((m) => `${m.id}:${m.content.length}:${m.isStreaming}`).join('|');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamKey]);

  return (
    <div className={styles.region}>
      {messages.length === 0 && emptyHint && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Claude Lens</p>
          <p className={styles.emptySub}>{emptyHint}</p>
          {onStarterSelect && (
            <div className={styles.starters}>
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={styles.starter}
                  onClick={() => onStarterSelect(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {messages.map((m, i) => {
        if (m.role === 'user') {
          const next = messages[i + 1];
          const showDisclaimer =
            highStakesMode &&
            sessionDisclaimer &&
            next?.role === 'assistant';
          return (
            <div key={m.id}>
              <UserMessageBubble content={m.content} />
              {showDisclaimer && <DisclaimerBox text={sessionDisclaimer} />}
            </div>
          );
        }
        if (m.role === 'assistant') {
          return (
            <AssistantMessage
              key={m.id}
              message={m}
              highStakesMode={highStakesMode}
              onSentenceClick={onSentenceClick}
              onChallengeClick={onChallengeClick}
            />
          );
        }
        return null;
      })}

      <div ref={bottomRef} />
    </div>
  );
}
