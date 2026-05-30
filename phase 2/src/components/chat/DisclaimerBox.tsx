'use client';

import styles from './DisclaimerBox.module.css';

interface DisclaimerBoxProps {
  text: string;
}

export function DisclaimerBox({ text }: DisclaimerBoxProps) {
  return (
    <div className={styles.box} role="note">
      <ShieldIcon />
      <p className={styles.text}>{text}</p>
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
