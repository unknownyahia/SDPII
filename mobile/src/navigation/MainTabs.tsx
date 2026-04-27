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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocalization } from '../context/LocalizationContext';
import { HomeScreen } from '../screens/main/HomeScreen';
import { ExploreScreen } from '../screens/main/ExploreScreen';
import { PostScreen } from '../screens/main/PostScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { colors, typography } from '../theme/designSystem';
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

function HomeGlyph({ active }: { active: boolean }) {
  return (
    <View style={styles.mobileIconWrap}>
      <View
        style={[
          styles.houseRoof,
          { borderBottomColor: active ? colors.primary : '#7C7A75' },
        ]}
      />
      <View
        style={[
          styles.houseBody,
          { borderColor: active ? colors.primary : '#7C7A75' },
        ]}
      />
    </View>
  );
}

function ExploreGlyph({ active }: { active: boolean }) {
  return (
    <View style={styles.mobileIconWrap}>
      <View
        style={[
          styles.exploreOuter,
          { borderColor: active ? colors.primary : '#7C7A75' },
        ]}
      >
        <View
          style={[
            styles.exploreNeedle,
            { backgroundColor: active ? colors.primary : '#7C7A75' },
          ]}
        />
      </View>
    </View>
  );
}

function ProfileGlyph({ active }: { active: boolean }) {
  return (
    <View style={styles.mobileIconWrap}>
      <View
        style={[
          styles.profileHead,
          { borderColor: active ? colors.primary : '#7C7A75' },
        ]}
      />
      <View
        style={[
          styles.profileBody,
          { borderColor: active ? colors.primary : '#7C7A75' },
        ]}
      />
    </View>
  );
}

function PostGlyph() {
  return (
    <View style={styles.postGlyph}>
      <View style={styles.postGlyphH} />
      <View style={styles.postGlyphV} />
    </View>
  );
}

function MobileBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  const { isRTL } = useLocalization();
  const bottomPadding = Math.max(bottom, 10);

  const renderStandardTab = (routeName: keyof MainTabParamList) => {
    const index = state.routes.findIndex(route => route.name === routeName);

    if (index < 0) {
      return null;
    }

    const route = state.routes[index];
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

    let icon = null;
    if (routeName === 'Home') {
      icon = <HomeGlyph active={isFocused} />;
    } else if (routeName === 'Explore') {
      icon = <ExploreGlyph active={isFocused} />;
    } else if (routeName === 'Profile') {
      icon = <ProfileGlyph active={isFocused} />;
    }

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        onPress={onPress}
        style={({ pressed }) => [
          styles.mobileTabItem,
          pressed && styles.mobileTabItemPressed,
        ]}
      >
        {icon}
        <Text
          style={[
            styles.mobileTabLabel,
            isFocused && styles.mobileTabLabelActive,
            { writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const postIndex = state.routes.findIndex(route => route.name === 'Post');
  const postRoute = state.routes[postIndex];
  if (postIndex < 0 || !postRoute) {
    return null;
  }

  const postFocused = state.index === postIndex;
  const postOptions = descriptors[postRoute.key].options;
  const postLabel = getLabel(postOptions, postRoute.name);

  const onPostPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: postRoute.key,
      canPreventDefault: true,
    });

    if (!postFocused && !event.defaultPrevented) {
      navigation.navigate('Post');
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.mobileTabBarOuter,
        {
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <View style={[styles.mobileTabBar, isRTL && styles.mobileTabBarRtl]}>
        {renderStandardTab('Home')}
        {renderStandardTab('Explore')}

        <Pressable
          accessibilityRole="button"
          accessibilityState={postFocused ? { selected: true } : {}}
          onPress={onPostPress}
          style={({ pressed }) => [
            styles.mobilePostTab,
            pressed && styles.mobileTabItemPressed,
          ]}
        >
          <View style={[styles.mobilePostButton, postFocused && styles.mobilePostButtonActive]}>
            <PostGlyph />
          </View>
          <Text
            style={[
              styles.mobileTabLabel,
              styles.mobilePostLabel,
              postFocused && styles.mobileTabLabelActive,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {postLabel}
          </Text>
        </Pressable>

        {renderStandardTab('Profile')}
      </View>
    </View>
  );
}

export function MainTabs() {
  const { t, isRTL } = useLocalization();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={props => <MobileBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.canvas,
          direction: isRTL ? 'rtl' : 'ltr',
        },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          display: 'none',
          height: 0,
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
  mobileTabBarOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  mobileTabBar: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE6DE',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    shadowColor: '#20150E',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  mobileTabBarRtl: {
    flexDirection: 'row-reverse',
  },
  mobileTabItem: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mobileTabItemPressed: {
    opacity: 0.82,
  },
  mobileTabLabel: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 14,
    color: '#7C7A75',
    fontWeight: '500',
  },
  mobilePostLabel: {
    marginTop: 2,
  },
  mobileTabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  mobileIconWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  houseRoof: {
    position: 'absolute',
    top: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  houseBody: {
    position: 'absolute',
    top: 11,
    width: 14,
    height: 10,
    borderWidth: 1.6,
    borderTopWidth: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: 'transparent',
  },

  exploreOuter: {
    width: 18,
    height: 18,
    borderWidth: 1.6,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  exploreNeedle: {
    width: 1.8,
    height: 8,
    borderRadius: 3,
  },

  profileHead: {
    position: 'absolute',
    top: 4,
    width: 9,
    height: 9,
    borderRadius: 9,
    borderWidth: 1.6,
    backgroundColor: 'transparent',
  },
  profileBody: {
    position: 'absolute',
    top: 14,
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.6,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },

  mobilePostTab: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -14,
  },
  mobilePostButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  mobilePostButtonActive: {
    transform: [{ scale: 1.02 }],
  },
  postGlyph: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postGlyphH: {
    position: 'absolute',
    width: 16,
    height: 2.4,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  postGlyphV: {
    position: 'absolute',
    width: 2.4,
    height: 16,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});
