'use client';

import { useState } from 'react';
import { getReasoning, type ReasoningResponse } from '@/lib/api';
import styles from './ReasoningAccordion.module.css';

interface ReasoningAccordionProps {
  originalContent: string;
}

type AccordionSection =
  | 'quick_answer'
  | 'key_assumptions'
  | 'reasoning_summary'
  | 'source_grounding'
  | 'alternative_interpretations';

export function ReasoningAccordion({ originalContent }: ReasoningAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ReasoningResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState<Record<AccordionSection, boolean>>({
    quick_answer: true, // Quick Answer open by default as per PRD
    key_assumptions: false,
    reasoning_summary: false,
    source_grounding: false,
    alternative_interpretations: false,
  });

  const handleToggleAccordion = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState && !data && !loading) {
      try {
        setLoading(true);
        setError(null);
        const res = await getReasoning(originalContent);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to retrieve reasoning logs');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleSection = (section: AccordionSection) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.triggerBtn}
        onClick={handleToggleAccordion}
        aria-expanded={isOpen}
      >
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>▼</span>
        <span>View full reasoning</span>
      </button>

      {isOpen && (
        <div className={styles.container}>
          {loading && (
            <div className={styles.loading}>
              <span className={styles.spinner} />
              Reconstructing logic model…
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          {!loading && !error && data && (
            <div className={styles.accordionList}>
              {/* Section 1: Quick Answer */}
              <div className={styles.section}>
                <button
                  type="button"
                  className={styles.sectionHeader}
                  onClick={() => toggleSection('quick_answer')}
                  aria-expanded={expandedSections.quick_answer}
                >
                  <span
                    className={`${styles.subChevron} ${
                      expandedSections.quick_answer ? styles.subChevronOpen : ''
                    }`}
                  >
                    ▶
                  </span>
                  <span className={styles.sectionTitle}>Quick Answer</span>
                </button>
                {expandedSections.quick_answer && (
                  <div className={styles.sectionContent}>
                    <p className={styles.quickAnswerText}>{data.quick_answer}</p>
                  </div>
                )}
              </div>

              {/* Section 2: Key Assumptions */}
              <div className={styles.section}>
                <button
                  type="button"
                  className={styles.sectionHeader}
                  onClick={() => toggleSection('key_assumptions')}
                  aria-expanded={expandedSections.key_assumptions}
                >
                  <span
                    className={`${styles.subChevron} ${
                      expandedSections.key_assumptions ? styles.subChevronOpen : ''
                    }`}
                  >
                    ▶
                  </span>
                  <span className={styles.sectionTitle}>Key Assumptions</span>
                </button>
                {expandedSections.key_assumptions && (
                  <div className={styles.sectionContent}>
                    <ul className={styles.bulletsList}>
                      {data.key_assumptions.map((item, idx) => (
                        <li key={idx} className={styles.bulletItem}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 3: Reasoning Summary */}
              <div className={styles.section}>
                <button
                  type="button"
                  className={styles.sectionHeader}
                  onClick={() => toggleSection('reasoning_summary')}
                  aria-expanded={expandedSections.reasoning_summary}
                >
                  <span
                    className={`${styles.subChevron} ${
                      expandedSections.reasoning_summary ? styles.subChevronOpen : ''
                    }`}
                  >
                    ▶
                  </span>
                  <span className={styles.sectionTitle}>Reasoning Summary</span>
                </button>
                {expandedSections.reasoning_summary && (
                  <div className={styles.sectionContent}>
                    <p className={styles.summaryText}>{data.reasoning_summary}</p>
                  </div>
                )}
              </div>

              {/* Section 4: Source Grounding */}
              <div className={styles.section}>
                <button
                  type="button"
                  className={styles.sectionHeader}
                  onClick={() => toggleSection('source_grounding')}
                  aria-expanded={expandedSections.source_grounding}
                >
                  <span
                    className={`${styles.subChevron} ${
                      expandedSections.source_grounding ? styles.subChevronOpen : ''
                    }`}
                  >
                    ▶
                  </span>
                  <span className={styles.sectionTitle}>Source Grounding</span>
                </button>
                {expandedSections.source_grounding && (
                  <div className={styles.sectionContent}>
                    <div className={styles.sourcesGrid}>
                      {data.source_grounding.map((src, idx) => {
                        const hasUrl = src.url && src.url.trim().length > 0;
                        return (
                          <div key={idx} className={styles.sourceGridRow}>
                            <div className={styles.sourceCellTitle}>
                              {hasUrl ? (
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.gridLink}
                                >
                                  {src.title}
                                  <span className={styles.extIcon}>↗</span>
                                </a>
                              ) : (
                                <span className={styles.gridTextOnly}>{src.title}</span>
                              )}
                            </div>
                            <div className={styles.sourceCellConf}>
                              <span
                                className={`${styles.confBadge} ${
                                  styles[src.confidence?.toLowerCase() ?? 'moderate']
                                }`}
                              >
                                {src.confidence ?? 'Moderate'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Alternative Interpretations */}
              <div className={styles.section}>
                <button
                  type="button"
                  className={styles.sectionHeader}
                  onClick={() => toggleSection('alternative_interpretations')}
                  aria-expanded={expandedSections.alternative_interpretations}
                >
                  <span
                    className={`${styles.subChevron} ${
                      expandedSections.alternative_interpretations ? styles.subChevronOpen : ''
                    }`}
                  >
                    ▶
                  </span>
                  <span className={styles.sectionTitle}>Alternative Interpretations</span>
                </button>
                {expandedSections.alternative_interpretations && (
                  <div className={styles.sectionContent}>
                    <ul className={styles.bulletsList}>
                      {data.alternative_interpretations.map((item, idx) => (
                        <li key={idx} className={styles.bulletItem}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
