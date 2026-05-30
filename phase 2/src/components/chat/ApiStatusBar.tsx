'use client';

import { useEffect, useState } from 'react';
import { checkHealth, getApiBase } from '@/lib/api';
import styles from './ApiStatusBar.module.css';

export function ApiStatusBar() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    checkHealth()
      .then((h) => {
        setStatus('ok');
        setDemo(!!h.demo_mode);
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'checking') return null;

  return (
    <div className={`${styles.bar} ${status === 'error' ? styles.error : styles.ok}`}>
      {status === 'ok' ? (
        <>
          API connected · {getApiBase()}
          {demo ? ' · demo mode' : ' · live Groq'}
        </>
      ) : (
        <>Cannot reach API at {getApiBase()} — start Phase 4 backend</>
      )}
    </div>
  );
}
