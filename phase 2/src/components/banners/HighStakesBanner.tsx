'use client';

import styles from './HighStakesBanner.module.css';

const COPY =
  'High-Stakes Mode is active. Uncertainty indicators are enhanced. Verify key claims independently before making any decisions.';

interface HighStakesBannerProps {
  onDismiss?: () => void;
}

export function HighStakesBanner({ onDismiss }: HighStakesBannerProps) {
  return (
    <div className={styles.banner} role="status">
      <span className={styles.dot} aria-hidden />
      <p className={styles.text}>{COPY}</p>
      {onDismiss && (
        <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss banner">
          ×
        </button>
      )}
    </div>
  );
}
