/** Shared conversation types (Phase 1) — mirror training JSON + UI state */

export type ConfidenceLabel =
  | 'well_supported'
  | 'inferred'
  | 'speculative'
  | 'missing_context'
  | 'strongly_supported'
  | 'multiple_interpretations'
  | 'limited_evidence'
  | 'requires_human_judgment'
  | 'weak_evidence'
  | 'assumption';

export interface ClaimAnnotation {
  id?: string;
  sentence: string;
  label: ConfidenceLabel | string;
  explanation: string;
  startOffset?: number;
  endOffset?: number;
}

export interface AssistantPayload {
  content: string;
  claims: ClaimAnnotation[];
  flags?: string[];
  verificationSteps?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  claims?: ClaimAnnotation[];
  flags?: string[];
  verificationSteps?: string[];
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  tags: string[];
  highStakesMode: boolean;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface MbaJourney {
  version: string;
  domain: string;
  reference_query: string;
  tags: string[];
  turns: Array<{ user: string; assistant: AssistantPayload }>;
  follow_ups: string[];
  challenge: Record<string, string[]>;
  reasoning: Record<string, unknown>;
  high_stakes: Record<string, unknown>;
}
