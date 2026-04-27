import React from 'react';

import { LoadingState } from '../components/ui/LoadingState';
import { useLocalization } from '../context/LocalizationContext';
import { useAuth } from '../context/AuthContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

export function AppNavigator() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { t } = useLocalization();

  if (isInitializing) {
    return <LoadingState label={t('common.preparingWorkspace')} />;
  }

  return isAuthenticated ? <MainTabs /> : <AuthStack />;
}
