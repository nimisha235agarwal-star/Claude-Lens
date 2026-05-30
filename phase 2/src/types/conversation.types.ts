export interface ClaimAnnotation {
  index: number;
  sentence: string;
  label: string;
  explanation: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  claims?: ClaimAnnotation[];
  isStreaming?: boolean;
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
  hsBannerDismissed: boolean;
  messages: Message[];
  sessionDisclaimer?: string;
  createdAt: string;
  updatedAt: string;
}
