import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import AppProviders from '@/app/providers/AppProviders';
import AppRoutes from '@/app/routing/AppRoutes';
import GlobalToastNotification from '@/shared/components/GlobalToastNotification';
import ErrorBoundary from '@/shared/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProviders>
          <BrowserRouter>
            <AppRoutes />
            <GlobalToastNotification />
          </BrowserRouter>
        </AppProviders>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
