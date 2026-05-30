'use client';

import { HS_BANNER } from '@/constants/highStakesKeywords';
import styles from './AutoSuggestBanner.module.css';

interface AutoSuggestBannerProps {
  onEnable: () => void;
  onDismiss: () => void;
}

export function AutoSuggestBanner({ onEnable, onDismiss }: AutoSuggestBannerProps) {
  return (
    <div className={styles.banner} role="status">
      <ShieldIcon />
      <div className={styles.text}>
        <p className={styles.line1}>{HS_BANNER.line1}</p>
        <p className={styles.line2}>{HS_BANNER.line2}</p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.enable} onClick={onEnable}>
          Enable
        </button>
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg className={styles.icon} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
