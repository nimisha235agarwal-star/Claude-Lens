'use client';

import type { ClaimAnnotation } from '@/types/conversation.types';
import { ConfidenceChip } from '@/components/trust/ConfidenceChip';
import styles from './AnnotatedText.module.css';

interface AnnotatedTextProps {
  content: string;
  claims?: ClaimAnnotation[];
  highStakesMode: boolean;
  onSentenceClick: (sentence: string) => void;
  isStreaming?: boolean;
}

export function AnnotatedText({
  content,
  claims,
  highStakesMode,
  onSentenceClick,
  isStreaming,
}: AnnotatedTextProps) {
  // If claims are not yet loaded (e.g. still streaming or classifying), render standard plain text
  if (!claims || claims.length === 0) {
    return (
      <p className={styles.prose}>
        {content}
        {isStreaming && <span className={styles.cursor} aria-hidden />}
      </p>
    );
  }

  return (
    <div className={styles.prose}>
      {claims.map((c) => {
        const label = c.label.toLowerCase();
        
        // Define if this claim represents "weak evidence" (requires ⚠️ warning badge in HS mode)
        const isWeakEvidence =
          label === 'speculative' ||
          label === 'limited_evidence' ||
          label === 'requires_human_judgment' ||
          label === 'missing_context';

        // Define if this claim is an "assumption" (requires yellow underline in HS mode)
        const isAssumption =
          label === 'inferred' ||
          label === 'requires_human_judgment' ||
          label === 'speculative';

        // Styling classes
        let claimTextClass = styles.claimText;
        if (highStakesMode && isAssumption) {
          claimTextClass += ` ${styles.hsAssumption}`;
        }

        // Adjust chip explanation if High-Stakes Mode is active
        let adjustedExpl = c.explanation;
        if (highStakesMode) {
          if (label === 'speculative') {
            adjustedExpl = (adjustedExpl ? `${adjustedExpl} ` : '') + 'Speculative — do not act without verification.';
          } else if (label === 'inferred') {
            adjustedExpl = (adjustedExpl ? `${adjustedExpl} ` : '') + 'Inferred — based on assumptions, not confirmed data.';
          }
        }

        return (
          <span key={c.index} className={styles.claimSpan}>
            {highStakesMode && isWeakEvidence && (
              <span className={styles.warningBadge} title="Weak evidence flag">
                ⚠️
              </span>
            )}
            <span
              className={claimTextClass}
              onClick={() => onSentenceClick(c.sentence)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSentenceClick(c.sentence);
                }
              }}
              title="Click to view details in Insight panel"
            >
              {c.sentence}
            </span>
            <ConfidenceChip label={c.label} explanation={adjustedExpl} />
            {' '}
          </span>
        );
      })}
      {isStreaming && <span className={styles.cursor} aria-hidden />}
    </div>
  );
}
