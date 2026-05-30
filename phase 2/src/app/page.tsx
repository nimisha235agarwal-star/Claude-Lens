import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

function generateId(): string {
  // Edge-safe UUID generation
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default async function HomePage() {
  // Trigger a proper server-side redirect to a new conversation
  void (await headers()); // ensure dynamic rendering
  redirect(`/c/${generateId()}`);
}
