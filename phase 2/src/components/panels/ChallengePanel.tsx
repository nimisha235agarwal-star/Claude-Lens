'use client';

import { useEffect, useState } from 'react';
import { getChallenge, type ChallengeResponse } from '@/lib/api';
import styles from './ChallengePanel.module.css';

interface ChallengePanelProps {
  originalContent: string;
  onClose: () => void;
}

export function ChallengePanel({ originalContent, onClose }: ChallengePanelProps) {
  const [data, setData] = useState<ChallengeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await getChallenge(originalContent);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load challenge analysis');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [originalContent]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.panel} role="complementary" aria-label="Challenge Analysis">
      <div className={styles.header}>
        <h2 className={styles.title}>Challenging this answer…</h2>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
          ×
        </button>
      </div>

      <div className={styles.content}>
        {loading && (
          <div className={styles.loading}>
            <span className={styles.spinner} />
            Analyzing assumptions and counterarguments…
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {!loading && !error && data && (
          <div className={styles.sections}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Counterarguments</h3>
              {data.counterarguments.length > 0 ? (
                <ul className={styles.list}>
                  {data.counterarguments.map((item, idx) => (
                    <li key={idx} className={styles.listItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.empty}>None identified.</p>
              )}
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Weak Assumptions</h3>
              {data.weak_assumptions.length > 0 ? (
                <ul className={styles.list}>
                  {data.weak_assumptions.map((item, idx) => (
                    <li key={idx} className={styles.listItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.empty}>None identified.</p>
              )}
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Alternative Viewpoints</h3>
              {data.alternative_viewpoints.length > 0 ? (
                <ul className={styles.list}>
                  {data.alternative_viewpoints.map((item, idx) => (
                    <li key={idx} className={styles.listItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.empty}>None identified.</p>
              )}
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Where It May Fail</h3>
              {data.where_it_may_fail.length > 0 ? (
                <ul className={styles.list}>
                  {data.where_it_may_fail.map((item, idx) => (
                    <li key={idx} className={styles.listItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.empty}>None identified.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
