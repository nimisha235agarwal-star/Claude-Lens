'use client';

import { useState } from 'react';
import { chipDisplayLabel, CHIP_STYLES } from '@/lib/chipLabels';
import styles from './ConfidenceChip.module.css';

interface ConfidenceChipProps {
  label: string;
  explanation?: string;
}

export function ConfidenceChip({ label, explanation }: ConfidenceChipProps) {
  const [open, setOpen] = useState(false);
  const variant = CHIP_STYLES[label] ?? 'missing';

  return (
    <span className={styles.wrap}>
      <button
        type="button"
        className={`${styles.chip} ${styles[variant]}`}
        onClick={() => explanation && setOpen(!open)}
        aria-expanded={open}
      >
        {chipDisplayLabel(label)}
      </button>
      {open && explanation && (
        <span className={styles.popover} role="tooltip">
          {explanation}
        </span>
      )}
    </span>
  );
}
