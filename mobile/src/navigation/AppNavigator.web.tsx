import React from 'react';
import type { NavigatorScreenParams } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { LoadingState } from '../components/ui/LoadingState';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { SpotsLandingPage } from '../screens/marketing/SpotsLandingPage.web';
import { authColors } from '../theme/authTheme';
import { MainTabs } from './MainTabs';
import type {
  AuthStackParamList,
  ExploreRouteParams,
  MainTabParamList,
} from './types';

type WebRootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
};

const Stack = createNativeStackNavigator<WebRootStackParamList>();

type LandingProps = NativeStackScreenProps<WebRootStackParamList, 'Landing'>;
type LoginProps = NativeStackScreenProps<WebRootStackParamList, 'Login'>;
type RegisterProps = NativeStackScreenProps<WebRootStackParamList, 'Register'>;

function LandingRoute({ navigation }: LandingProps) {
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Main');
    }
  }, [isAuthenticated, navigation]);

  const openExplore = React.useCallback(
    (params?: ExploreRouteParams) => {
      navigation.navigate('Main', {
        screen: 'Explore',
        params,
      });
    },
    [navigation]
  );

  const openPost = React.useCallback(() => {
    navigation.navigate('Main', {
      screen: 'Post',
    });
  }, [navigation]);

  const openProfile = React.useCallback(() => {
    if (isAuthenticated) {
      navigation.navigate('Main', {
        screen: 'Profile',
      });
      return;
    }

    navigation.navigate('Login');
  }, [isAuthenticated, navigation]);

  const openSignIn = React.useCallback(() => {
    if (isAuthenticated) {
      navigation.navigate('Main', {
        screen: 'Profile',
      });
      return;
    }

    navigation.navigate('Login');
  }, [isAuthenticated, navigation]);

  const openRegister = React.useCallback(() => {
    if (isAuthenticated) {
      navigation.navigate('Main', {
        screen: 'Profile',
      });
      return;
    }

    navigation.navigate('Register');
  }, [isAuthenticated, navigation]);

  return (
    <SpotsLandingPage
      isAuthenticated={isAuthenticated}
      onCreatePost={openPost}
      onExplore={openExplore}
      onProfile={openProfile}
      onRegister={openRegister}
      onSignIn={openSignIn}
    />
  );
}

function LoginRoute(props: LoginProps) {
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      props.navigation.replace('Main');
    }
  }, [isAuthenticated, props.navigation]);

  return (
    <LoginScreen
      {...(props as unknown as NativeStackScreenProps<
        AuthStackParamList,
        'Login'
      >)}
    />
  );
}

function RegisterRoute(props: RegisterProps) {
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      props.navigation.replace('Main');
    }
  }, [isAuthenticated, props.navigation]);

  return (
    <RegisterScreen
      {...(props as unknown as NativeStackScreenProps<
        AuthStackParamList,
        'Register'
      >)}
    />
  );
}

export function AppNavigator() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { isRTL, t } = useLocalization();

  if (isInitializing) {
    return <LoadingState label={t('common.preparingWorkspace')} />;
  }

  return (
    <Stack.Navigator
      key={isAuthenticated ? 'authenticated-web' : 'public-web'}
      initialRouteName={isAuthenticated ? 'Main' : 'Landing'}
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: authColors.background,
          direction: isRTL ? 'rtl' : 'ltr',
        },
      }}
    >
      <Stack.Screen name="Landing" component={LandingRoute} />
      <Stack.Screen name="Login" component={LoginRoute} />
      <Stack.Screen name="Register" component={RegisterRoute} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}
