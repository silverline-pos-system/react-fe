import React from 'react';
import { BranchProvider } from '@/context/BranchContext';
import { FeatureProvider } from '@/context/FeatureContext';
import { GlobalNotificationProvider } from '@/context/GlobalNotificationContext';
import { SystemNameProvider } from '@/context/SystemNameContext';

export default function AppProviders({ children }) {
  return (
    <SystemNameProvider>
      <BranchProvider>
        <FeatureProvider>
          <GlobalNotificationProvider>{children}</GlobalNotificationProvider>
        </FeatureProvider>
      </BranchProvider>
    </SystemNameProvider>
  );
}
