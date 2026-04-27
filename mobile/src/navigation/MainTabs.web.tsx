import React from 'react';
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';
import { webDesktopColors, webDesktopLayout } from '../theme/webDesktopSystem';
import { useLocalization } from '../context/LocalizationContext';
import { HomeScreen } from '../screens/main/HomeScreen';
import { ExploreScreen } from '../screens/main/ExploreScreen';
import { PostScreen } from '../screens/main/PostScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function getLabel(
  options: BottomTabBarProps['descriptors'][string]['options'],
  routeName: string
) {
  const tabBarLabel = options.tabBarLabel;
  if (typeof tabBarLabel === 'string') {
    return tabBarLabel;
  }
  if (typeof options.title === 'string') {
    return options.title;
  }
  return routeName;
}

function WebTopBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { isRTL } = useLocalization();

  return (
    <View style={styles.webNavOuter}>
      <View style={styles.webNavInner}>
        <View style={styles.webNavLeft}>
          <Pressable onPress={() => navigation.navigate('Home')}>
            <Text style={styles.webBrand}>Spots</Text>
          </Pressable>

          <View style={styles.webTabs}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const label = getLabel(options, route.name);

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.webTab,
                    isFocused && styles.webTabActive,
                    pressed && styles.webPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.webTabLabel,
                      isFocused && styles.webTabLabelActive,
                      { writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.webNavRight}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => [styles.webIconButton, pressed && styles.webPressed]}
          >
            <Ionicons name="notifications-outline" size={20} color="#5F5650" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Explore')}
            style={({ pressed }) => [styles.webIconButton, pressed && styles.webPressed]}
          >
            <Ionicons name="heart-outline" size={20} color="#5F5650" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => [styles.webAvatarWrap, pressed && styles.webPressed]}
          >
            <View style={styles.webAvatar} />
            <Ionicons name="chevron-down" size={16} color="#7C726B" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function MainTabs() {
  const { t, isRTL } = useLocalization();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={props => <WebTopBar {...props} />}
      screenOptions={{
        tabBarPosition: 'top',
        headerShown: false,
        sceneStyle: {
          backgroundColor: webDesktopColors.page,
          direction: isRTL ? 'rtl' : 'ltr',
        },
        tabBarHideOnKeyboard: true,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('nav.home'), tabBarLabel: t('nav.home') }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ title: t('nav.explore'), tabBarLabel: t('nav.explore') }}
      />
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={{ title: t('nav.post'), tabBarLabel: t('nav.post') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('nav.profile'), tabBarLabel: t('nav.profile') }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  webNavOuter: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: webDesktopColors.border,
  },
  webNavInner: {
    maxWidth: webDesktopLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
    minHeight: webDesktopLayout.navHeight,
    paddingHorizontal: webDesktopLayout.pagePaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 36,
  },
  webBrand: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: webDesktopColors.primary,
  },
  webTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webTab: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  webTabActive: {
    borderBottomColor: webDesktopColors.primary,
  },
  webTabLabel: {
    fontSize: 16,
    lineHeight: 20,
    color: webDesktopColors.textMuted,
    fontWeight: '500',
  },
  webTabLabelActive: {
    color: webDesktopColors.primary,
    fontWeight: '700',
  },
  webNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  webIconButton: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webAvatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D9D1C8',
  },
  webPressed: {
    opacity: 0.82,
  },
});
