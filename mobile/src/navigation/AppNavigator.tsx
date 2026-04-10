import React from 'react';

import { LoadingState } from '../components/ui/LoadingState';
import { useAuth } from '../context/AuthContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

export function AppNavigator() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <LoadingState label="Preparing your workspace..." />;
  }

  return isAuthenticated ? <MainTabs /> : <AuthStack />;
}
