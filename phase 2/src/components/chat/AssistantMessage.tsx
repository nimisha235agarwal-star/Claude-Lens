'use client';

import type { Message } from '@/types/conversation.types';
import { AnnotatedText } from '@/components/chat/AnnotatedText';
import { ReasoningAccordion } from '@/components/trust/ReasoningAccordion';
import styles from './AssistantMessage.module.css';

interface AssistantMessageProps {
  message: Message;
  highStakesMode: boolean;
  onSentenceClick: (sentence: string) => void;
  onChallengeClick: (messageId: string, content: string) => void;
}

const MBA_VERIFICATION_STEPS = [
  'Speak directly with a fee-only financial advisor who can model your personal debt and repayment scenario.',
  'Connect with at least five recent graduates from your target programs who work in your intended post-MBA role.',
  'Request the official employment report from each school you are considering — do not rely on rankings alone.',
  'Model your own ROI using the FT MBA calculator at ft.com/mba-ranking.',
  'If you are considering debt financing, check current graduate loan rates at studentaid.gov and calculate your monthly repayment obligation before committing.'
];

export function AssistantMessage({
  message,
  highStakesMode,
  onSentenceClick,
  onChallengeClick,
}: AssistantMessageProps) {
  const { id, content, claims, isStreaming } = message;

  return (
    <div className={styles.row}>
      <div className={styles.body}>
        {/* Render text either as annotated claims or raw streaming block */}
        <AnnotatedText
          content={content}
          claims={claims}
          highStakesMode={highStakesMode}
          onSentenceClick={onSentenceClick}
          isStreaming={isStreaming}
        />

        {/* Verification steps shown at the bottom of the response in High-Stakes Mode */}
        {highStakesMode && !isStreaming && (
          <div className={styles.verificationBox}>
            <h4 className={styles.verificationTitle}>Before acting on this:</h4>
            <ul className={styles.verificationList}>
              {MBA_VERIFICATION_STEPS.map((step, idx) => (
                <li key={idx} className={styles.verificationItem}>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bottom meta & actions panel */}
        {!isStreaming && (
          <div className={styles.footerPanel}>
            <div className={styles.metaRow}>
              <span className={styles.modelLabel}>Claude Sonnet · Just now</span>
            </div>
            
            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => onChallengeClick(id, content)}
              >
                <span className={styles.btnIcon}>⚖️</span>
                Challenge this answer
              </button>
              
              <ReasoningAccordion originalContent={content} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
