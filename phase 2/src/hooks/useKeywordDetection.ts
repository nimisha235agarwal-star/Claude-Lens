'use client';

import { useEffect, useState } from 'react';
import { detectHighStakesKeyword } from '@/constants/highStakesKeywords';

const DEBOUNCE_MS = 800;

export function useKeywordDetection(
  draft: string,
  options: { enabled: boolean; highStakesMode: boolean; bannerDismissed: boolean },
) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!options.enabled || options.highStakesMode || options.bannerDismissed) {
      setShowBanner(false);
      return;
    }
    if (!draft.trim()) {
      setShowBanner(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowBanner(detectHighStakesKeyword(draft));
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [draft, options.enabled, options.highStakesMode, options.bannerDismissed]);

  return { showBanner, dismiss: () => setShowBanner(false) };
}
