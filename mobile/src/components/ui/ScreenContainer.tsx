import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme/designSystem';

const MOBILE_BOTTOM_TAB_CONTENT_OFFSET = 88;

type ScreenContainerProps = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
};

export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const isNative = Platform.OS !== 'web';
  const safeAreaStyle = {
    paddingTop: insets.top + 4,
    paddingBottom: isNative
      ? insets.bottom + MOBILE_BOTTOM_TAB_CONTENT_OFFSET
      : insets.bottom,
  };

  if (scroll) {
    return (
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={false}
        style={[styles.base, style]}
        contentContainerStyle={[
          styles.scrollContent,
          padded && styles.paddedContent,
          !isNative && safeAreaStyle,
          contentContainerStyle,
          isNative && safeAreaStyle,
        ]}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        styles.base,
        padded && styles.paddedContent,
        !isNative && safeAreaStyle,
        style,
        contentContainerStyle,
        isNative && safeAreaStyle,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: colors.canvas,
  },

  scrollContent: {
    flexGrow: 1,
  },

  paddedContent: {
    paddingHorizontal: spacing.lg,
  },
});
