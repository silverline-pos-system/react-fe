import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppProviders from '@/app/providers/AppProviders';
import AppRoutes from '@/app/routing/AppRoutes';
import GlobalToastNotification from '@/shared/components/GlobalToastNotification';
import ErrorBoundary from '@/shared/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <AppRoutes />
          <GlobalToastNotification />
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  );
}
