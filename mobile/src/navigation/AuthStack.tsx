import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useLocalization } from '../context/LocalizationContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { authColors } from '../theme/authTheme';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  const { isRTL } = useLocalization();

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: authColors.background,
          direction: isRTL ? 'rtl' : 'ltr',
        },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
