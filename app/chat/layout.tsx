import type React from 'react';

// Set page metadata for the /chat route
export const metadata = {
  title: 'Soita AI',
  description: 'Soita AI - Mental health assistant',
};

// This layout will wrap your chat page
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}