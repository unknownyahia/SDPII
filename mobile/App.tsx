import 'react-native-gesture-handler';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import {
  LocalizationProvider,
  useLocalization,
} from './src/context/LocalizationContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { WebToastViewport } from './src/components/ui/WebToastViewport';
import { appNavigationTheme } from './src/theme/navigationTheme';

LogBox.ignoreLogs([
  'The app is running using the Legacy Architecture. The Legacy Architecture is deprecated',
]);

function AppNavigationShell() {
  const { isRTL } = useLocalization();

  return (
    <NavigationContainer
      theme={appNavigationTheme}
      direction={isRTL ? 'rtl' : 'ltr'}
    >
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LocalizationProvider>
            <>
              <AppNavigationShell />
              <WebToastViewport />
            </>
          </LocalizationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
