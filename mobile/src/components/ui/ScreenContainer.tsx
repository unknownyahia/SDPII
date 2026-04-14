import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme/designSystem';

type ScreenContainerProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  keyboardAvoiding?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  keyboardAvoiding = false,
  contentContainerStyle,
  style,
}: ScreenContainerProps) {
  const isWeb = Platform.OS === 'web';
  const webContentStyle = isWeb ? styles.webContent : null;
  const webPaddedStyle = isWeb && padded ? styles.webPadded : null;

  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scrollContent,
        webContentStyle,
        padded && styles.padded,
        webPaddedStyle,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        webContentStyle,
        padded && styles.padded,
        webPaddedStyle,
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={[styles.screen, style]} edges={['top', 'left', 'right']}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
  },
  webContent: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  webPadded: {
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
});
