'use client';

import type { ReactNode } from 'react';
// Optionally, add other providers here if needed (e.g., QueryClientProvider)

export function AppProviders({ children }: { children: ReactNode }) {
  // If using React Query or other context providers, wrap children here
  return <>{children}</>;
}