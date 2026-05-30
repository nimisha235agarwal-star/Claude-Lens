'use client';

import styles from './ChatFooter.module.css';

export function ChatFooter() {
  return (
    <p className={styles.footer}>
      Claude can be wrong. The point isn&apos;t to trust it — it&apos;s to think with it.
    </p>
  );
}
