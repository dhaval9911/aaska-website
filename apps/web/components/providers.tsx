'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';

import { CategoryDrawerProvider } from './context/CategoryDrawerContext';
import { MobileProvider } from './mobile-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <MobileProvider>
          <CategoryDrawerProvider>{children}</CategoryDrawerProvider>
        </MobileProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
