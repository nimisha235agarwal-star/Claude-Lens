'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ConversationHeader } from '@/components/header/ConversationHeader';
import { AutoSuggestBanner } from '@/components/banners/AutoSuggestBanner';
import { HighStakesBanner } from '@/components/banners/HighStakesBanner';
import { ChatScrollRegion } from '@/components/chat/ChatScrollRegion';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatFooter } from '@/components/chat/ChatFooter';
import { ApiStatusBar } from '@/components/chat/ApiStatusBar';
import { Sidebar } from '@/components/chat/Sidebar';
import { InsightPanel } from '@/components/panels/InsightPanel';
import { ChallengePanel } from '@/components/panels/ChallengePanel';
import { useKeywordDetection } from '@/hooks/useKeywordDetection';
import { createConversationId } from '@/lib/ids';
import { useConversationStore } from '@/store/conversationStore';
import styles from './FocusChatLayout.module.css';

interface FocusChatLayoutProps {
  conversationId: string;
}

export function FocusChatLayout({ conversationId }: FocusChatLayoutProps) {
  const router = useRouter();
  const [hsTopDismissed, setHsTopDismissed] = useState(false);

  // Split Panel view states
  const [activePanel, setActivePanel] = useState<'insight' | 'challenge' | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<string>('');
  const [challengedContent, setChallengedContent] = useState<string>('');

  const {
    conversation,
    draft,
    hydrated,
    isLoading,
    apiError,
    load,
    setDraft,
    setTitle,
    toggleHighStakes,
    enableHighStakesFromBanner,
    dismissHsBanner,
    addTag,
    removeTag,
    sendMessageWithReply,
    clearApiError,
    resetForNewId,
  } = useConversationStore();

  useEffect(() => {
    load(conversationId);
    // Reset side panels when changing conversations
    setActivePanel(null);
    setSelectedSentence('');
    setChallengedContent('');
  }, [conversationId, load]);

  const { showBanner } = useKeywordDetection(draft, {
    enabled: hydrated && !isLoading,
    highStakesMode: conversation?.highStakesMode ?? false,
    bannerDismissed: conversation?.hsBannerDismissed ?? false,
  });

  const handleNewChat = () => {
    const id = createConversationId();
    resetForNewId(id);
    router.push(`/c/${id}`);
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/c/${id}`);
  };

  const handleSend = () => {
    clearApiError();
    void sendMessageWithReply(draft);
  };

  const handleStarter = (text: string) => {
    clearApiError();
    void sendMessageWithReply(text);
  };

  // Click claim -> open Insight Panel
  const handleSentenceClick = (sentence: string) => {
    setSelectedSentence(sentence);
    setActivePanel('insight');
  };

  // Click challenge -> open Challenge Panel
  const handleChallengeClick = (messageId: string, content: string) => {
    setChallengedContent(content);
    setActivePanel('challenge');
  };

  const handleClosePanel = () => {
    setActivePanel(null);
  };

  if (!hydrated || !conversation) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading…</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Sidebar for Mode B */}
      <Sidebar
        currentId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
      />

      {/* Main Chat Column */}
      <div className={styles.mainCol}>
        <div className={styles.shell}>
          <ApiStatusBar />
          <ConversationHeader
            title={conversation.title}
            tags={conversation.tags}
            highStakesMode={conversation.highStakesMode}
            onNewChat={handleNewChat}
            onTitleChange={setTitle}
            onToggleHighStakes={() => toggleHighStakes()}
            onAddTag={addTag}
            onRemoveTag={removeTag}
          />

          {conversation.highStakesMode && !hsTopDismissed && (
            <HighStakesBanner onDismiss={() => setHsTopDismissed(true)} />
          )}

          {showBanner && !conversation.highStakesMode && (
            <AutoSuggestBanner
              onEnable={enableHighStakesFromBanner}
              onDismiss={dismissHsBanner}
            />
          )}

          {apiError && (
            <div className={styles.apiError} role="alert">
              {apiError}
              <button type="button" className={styles.dismissErr} onClick={clearApiError}>
                ×
              </button>
            </div>
          )}

          <ChatScrollRegion
            messages={conversation.messages}
            highStakesMode={conversation.highStakesMode}
            sessionDisclaimer={conversation.sessionDisclaimer}
            emptyHint="Ask anything. Inspect the reasoning before you act."
            onStarterSelect={handleStarter}
            onSentenceClick={handleSentenceClick}
            onChallengeClick={handleChallengeClick}
          />

          <div className={styles.inputArea}>
            <ChatInput
              value={draft}
              onChange={setDraft}
              onSend={handleSend}
              disabled={isLoading}
            />
            <ChatFooter />
          </div>
        </div>
      </div>

      {/* Slide-out Side Panel Column (Insight or Challenge) */}
      {activePanel && (
        <div className={styles.sidePanelCol}>
          {activePanel === 'insight' && (
            <InsightPanel
              sentence={selectedSentence}
              conversationContext={conversation.messages
                .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                .join('\n')}
              onClose={handleClosePanel}
            />
          )}
          {activePanel === 'challenge' && (
            <ChallengePanel
              originalContent={challengedContent}
              onClose={handleClosePanel}
            />
          )}
        </div>
      )}
    </div>
  );
}
