export const HIGH_STAKES_KEYWORDS = [
  'mba',
  'investment',
  'diagnosis',
  'cancer',
  'finance',
  'salary',
  'surgery',
  'phd',
  'legal',
  'lawsuit',
  'mortgage',
  'crypto',
] as const;

export const HS_BANNER = {
  line1: 'This looks like a high-stakes career and financial decision.',
  line2: 'Enable High-Stakes Mode for added scrutiny and verification guidance.',
} as const;

export const MBA_AUTO_TAGS = ['career', 'decision', 'high-stakes'] as const;

export const DEFAULT_TITLE = 'New conversation';

export function detectHighStakesKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return HIGH_STAKES_KEYWORDS.some((kw) => lower.includes(kw));
}

export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
