const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

export function getApiBase(): string {
  return API_BASE;
}

export interface StreamMeta {
  demo_mode?: boolean;
  disclaimer?: string;
}

export interface ClaimFromApi {
  index: number;
  sentence: string;
  label: string;
  explanation: string;
}

export async function checkHealth(): Promise<{ status: string; demo_mode?: boolean }> {
  const r = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`API health failed: ${r.status}`);
  return r.json();
}

export async function streamChat(
  body: {
    message: string;
    history: { role: 'user' | 'assistant'; content: string }[];
    high_stakes_mode: boolean;
    tags: string[];
    conversation_id?: string;
  },
  handlers: {
    onMeta?: (meta: StreamMeta) => void;
    onToken: (text: string) => void;
    onError?: (detail: string) => void;
    onDone?: () => void;
  },
): Promise<void> {
  const r = await fetch(`${API_BASE}/api/v1/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({
      conversation_id: body.conversation_id ?? '',
      message: body.message,
      history: body.history,
      high_stakes_mode: body.high_stakes_mode,
      tags: body.tags,
    }),
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : `Stream failed (${r.status})`);
  }

  const reader = r.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const block of parts) {
      const lines = block.split('\n');
      let event = 'message';
      let data = '';
      for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data && event !== 'done') continue;

      if (event === 'meta') {
        try {
          handlers.onMeta?.(JSON.parse(data) as StreamMeta);
        } catch {
          /* ignore */
        }
      } else if (event === 'token') {
        try {
          const parsed = JSON.parse(data) as { text?: string };
          if (parsed.text) handlers.onToken(parsed.text);
        } catch {
          handlers.onToken(data);
        }
      } else if (event === 'error') {
        try {
          const parsed = JSON.parse(data) as { detail?: string };
          handlers.onError?.(parsed.detail ?? data);
        } catch {
          handlers.onError?.(data);
        }
      } else if (event === 'done') {
        handlers.onDone?.();
      }
    }
  }
  handlers.onDone?.();
}

export async function classifyMessage(
  text: string,
  userMessage: string,
  highStakesMode: boolean,
): Promise<ClaimFromApi[]> {
  const r = await fetch(`${API_BASE}/api/v1/chat/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      user_message: userMessage,
      high_stakes_mode: highStakesMode,
    }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail ?? `Classify failed (${r.status})`);
  }
  const data = await r.json();
  return data.claims ?? [];
}

export interface ChallengeResponse {
  counterarguments: string[];
  weak_assumptions: string[];
  alternative_viewpoints: string[];
  where_it_may_fail: string[];
}

export interface SourceItem {
  title: string;
  url: string;
  confidence?: string;
}

export interface ReasoningResponse {
  quick_answer: string;
  key_assumptions: string[];
  reasoning_summary: string;
  source_grounding: SourceItem[];
  alternative_interpretations: string[];
}

export interface InsightResponse {
  evidence_strength: string;
  assumptions: string[];
  reasoning: string;
  sources: SourceItem[];
}

export async function getChallenge(originalContent: string): Promise<ChallengeResponse> {
  const r = await fetch(`${API_BASE}/api/v1/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ original_content: originalContent }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail ?? `Challenge failed (${r.status})`);
  }
  return r.json();
}

export async function getReasoning(originalContent: string): Promise<ReasoningResponse> {
  const r = await fetch(`${API_BASE}/api/v1/reasoning`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ original_content: originalContent }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail ?? `Reasoning failed (${r.status})`);
  }
  return r.json();
}

export async function getInsight(sentence: string, conversationContext = ''): Promise<InsightResponse> {
  const r = await fetch(`${API_BASE}/api/v1/insight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence, conversation_context: conversationContext }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail ?? `Insight failed (${r.status})`);
  }
  return r.json();
}

