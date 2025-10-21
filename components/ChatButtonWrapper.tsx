'use client';

import { useUser } from '@clerk/nextjs';
import FloatingChatButton from './FloatingChatButton';

export default function ChatButtonWrapper() {
  const { isSignedIn } = useUser();

  // Only show chat button when user is signed in
  if (!isSignedIn) return null;

  return <FloatingChatButton />;
}
