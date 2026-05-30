import { FocusChatLayout } from '@/components/chat/FocusChatLayout';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params;
  return <FocusChatLayout conversationId={id} />;
}
