'use client';

import { useEffect, useState } from 'react';
import { getInsight, type InsightResponse } from '@/lib/api';
import styles from './InsightPanel.module.css';

interface InsightPanelProps {
  sentence: string;
  conversationContext?: string;
  onClose: () => void;
}

export function InsightPanel({ sentence, conversationContext = '', onClose }: InsightPanelProps) {
  const [data, setData] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await getInsight(sentence, conversationContext);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load claim insight');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [sentence, conversationContext]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.panel} role="complementary" aria-label="Claim Insight">
      <div className={styles.header}>
        <h2 className={styles.title}>Claim Insight</h2>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
          ×
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.sentenceQuote}>
          <p className={styles.quoteText}>“{sentence}”</p>
        </div>

        {loading && (
          <div className={styles.loading}>
            <span className={styles.spinner} />
            Retrieving evidence grounding…
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {!loading && !error && data && (
          <div className={styles.sections}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Evidence Strength</h3>
              <p className={styles.evidenceText}>{data.evidence_strength}</p>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Assumptions Made</h3>
              {data.assumptions.length > 0 ? (
                <ul className={styles.list}>
                  {data.assumptions.map((item, idx) => (
                    <li key={idx} className={styles.listItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.empty}>No assumptions explicitly identified.</p>
              )}
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Reasoning Explanation</h3>
              <p className={styles.bodyText}>{data.reasoning}</p>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Supporting Sources</h3>
              {data.sources.length > 0 ? (
                <div className={styles.sourcesList}>
                  {data.sources.map((src, idx) => {
                    const hasUrl = src.url && src.url.trim().length > 0;
                    return (
                      <div key={idx} className={styles.sourceItem}>
                        {hasUrl ? (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.sourceLink}
                          >
                            {src.title}
                            <span className={styles.extIcon} aria-hidden>↗</span>
                          </a>
                        ) : (
                          <span className={styles.sourceTextOnly}>{src.title}</span>
                        )}
                        {src.confidence && (
                          <span className={styles.sourceConf}>
                            ({src.confidence} confidence)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.empty}>No explicitly cited sources.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
