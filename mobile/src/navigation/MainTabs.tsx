import React from 'react';
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { ExploreScreen } from '../screens/main/ExploreScreen';
import { HomeScreen } from '../screens/main/HomeScreen';
import { PostScreen } from '../screens/main/PostScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { colors, radius, spacing, typography } from '../theme/designSystem';
import { webDesktopControl, webDesktopLayout } from '../theme/webDesktopSystem';
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

function WebBellIcon() {
  return (
    <View style={styles.webBellIcon}>
      <View style={styles.webBellStem} />
      <View style={styles.webBellBody} />
      <View style={styles.webBellClapper} />
      <View style={styles.webBellBase} />
    </View>
  );
}

function WebBrandMark({ isRTL }: { isRTL: boolean }) {
  return (
    <View style={[styles.webNavBrand, isRTL && styles.webNavBrandRtl]}>
      <View style={styles.webNavBrandBadge}>
        <Text style={styles.webNavBrandLetter}>S</Text>
      </View>
      <Text style={styles.webNavBrandTitle}>Spots</Text>
    </View>
  );
}

function WebTopTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { user } = useAuth();
  const { isRTL } = useLocalization();
  const identityInitial = (user?.displayInfo || user?.email || 'Spots')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <View style={styles.webNavBar}>
      <View style={styles.webNavShell}>
        <View style={styles.webNavLeft}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Home')}
            style={({ pressed }) => [pressed && styles.webNavItemPressed]}
          >
            <WebBrandMark isRTL={isRTL} />
          </Pressable>

          <View style={styles.webNavItems}>
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
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.webNavItem,
                    isFocused && styles.webNavItemActive,
                    pressed && styles.webNavItemPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.webNavItemLabel,
                      isFocused && styles.webNavItemLabelActive,
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
            style={({ pressed }) => [styles.webNavIconButton, pressed && styles.webNavItemPressed]}
          >
            <WebBellIcon />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Explore')}
            style={({ pressed }) => [styles.webNavIconButton, pressed && styles.webNavItemPressed]}
          >
            <Text style={styles.webNavIconGlyph}>♡</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => [
              styles.webNavAvatarWrap,
              pressed && styles.webNavItemPressed,
            ]}
          >
            <View style={styles.webNavAvatar}>
              <Text style={styles.webNavAvatarText}>{identityInitial || 'S'}</Text>
            </View>
            <Text style={styles.webNavCaret}>⌄</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function MainTabs() {
  const { isRTL, t } = useLocalization();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={props => (isDesktopWeb ? <WebTopTabBar {...props} /> : undefined)}
      screenOptions={{
        tabBarPosition: isDesktopWeb ? 'top' : 'bottom',
        headerShown: Platform.OS !== 'web',
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.canvas,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
        sceneStyle: {
          backgroundColor: colors.canvas,
          direction: isRTL ? 'rtl' : 'ltr',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle:
          isDesktopWeb
            ? styles.webTopBarHost
            : {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                height: 72,
                paddingTop: 8,
                paddingBottom: 10,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
              },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
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
        options={{
          title: t('nav.explore'),
          tabBarLabel: t('nav.explore'),
        }}
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
  webTopBarHost: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
  webNavBar: {
    width: '100%',
    backgroundColor: '#FDF8F3',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
    shadowColor: '#24150F',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  webNavShell: {
    width: '100%',
    maxWidth: webDesktopLayout.maxWidth + 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    minHeight: 72,
    paddingHorizontal: spacing.xxxl + 8,
    backgroundColor: '#FDF8F3',
  },
  webNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxl,
    minWidth: 0,
    flex: 1,
  },
  webNavBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  webNavBrandRtl: {
    flexDirection: 'row-reverse',
  },
  webNavBrandBadge: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webNavBrandLetter: {
    ...typography.button,
    color: colors.surface,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  webNavBrandTitle: {
    ...typography.title,
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  webNavItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  webNavItem: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  webNavItemActive: {
    backgroundColor: colors.primarySoft,
    borderColor: '#EBCFC7',
  },
  webNavItemPressed: {
    opacity: 0.82,
  },
  webNavItemLabel: {
    ...typography.button,
    color: colors.textMuted,
    fontSize: 15,
  },
  webNavItemLabelActive: {
    color: colors.primary,
  },
  webNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    marginLeft: spacing.lg,
  },
  webNavIconButton: {
    ...webDesktopControl,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webNavIconGlyph: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 18,
  },
  webBellIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webBellStem: {
    position: 'absolute',
    top: 1,
    width: 5,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  webBellBody: {
    position: 'absolute',
    top: 3,
    width: 11,
    height: 9,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 1.35,
    borderColor: colors.textMuted,
    backgroundColor: colors.surface,
  },
  webBellClapper: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  webBellBase: {
    position: 'absolute',
    bottom: 1,
    width: 10,
    height: 1.5,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  webNavAvatar: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: '#F6EBE0',
    borderWidth: 1,
    borderColor: '#E8DDD1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webNavAvatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  webNavAvatarText: {
    ...typography.button,
    color: colors.text,
    fontSize: 14,
  },
  webNavCaret: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
  },
});
