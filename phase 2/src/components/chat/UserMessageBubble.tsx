'use client';

import styles from './UserMessageBubble.module.css';

interface UserMessageBubbleProps {
  content: string;
}

export function UserMessageBubble({ content }: UserMessageBubbleProps) {
  return (
    <div className={styles.row}>
      <div className={styles.bubble}>{content}</div>
    </div>
  );
}
