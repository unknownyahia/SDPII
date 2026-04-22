import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, shadows, spacing, typography } from '../../theme/designSystem';
import {
  WEB_ALERT_EVENT,
  type WebAlertPayload,
} from '../../utils/webAlertBus';

const TOAST_LIFETIME_MS = 4200;
const MAX_TOASTS = 3;

type ToastItem = WebAlertPayload;

export function WebToastViewport() {
  const insets = useSafeAreaInsets();
  const { getTextAlign, isRTL } = useLocalization();
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const timers = new Map<string, ReturnType<typeof window.setTimeout>>();

    const dismissToast = (id: string) => {
      const timer = timers.get(id);
      if (timer) {
        window.clearTimeout(timer);
        timers.delete(id);
      }

      setToasts(current => current.filter(toast => toast.id !== id));
    };

    const handleAlert = (event: Event) => {
      const detail = (event as CustomEvent<WebAlertPayload>).detail;
      if (!detail?.id || !detail.title) {
        return;
      }

      setToasts(current => [detail, ...current].slice(0, MAX_TOASTS));
      timers.set(
        detail.id,
        window.setTimeout(() => {
          dismissToast(detail.id);
        }, TOAST_LIFETIME_MS)
      );
    };

    window.addEventListener(WEB_ALERT_EVENT, handleAlert);

    return () => {
      window.removeEventListener(WEB_ALERT_EVENT, handleAlert);
      timers.forEach(timer => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  if (Platform.OS !== 'web' || toasts.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.viewport,
        isRTL
          ? { top: Math.max(insets.top, spacing.lg), left: spacing.lg }
          : { top: Math.max(insets.top, spacing.lg), right: spacing.lg },
      ]}
    >
      {toasts.map(toast => (
        <View key={toast.id} style={styles.toast}>
          <View style={styles.toastCopy}>
            <Text
              style={[
                styles.toastTitle,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {toast.title}
            </Text>
            {toast.message ? (
              <Text
                style={[
                  styles.toastBody,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {toast.message}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              setToasts(current => current.filter(item => item.id !== toast.id))
            }
            style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}
          >
            <Text style={styles.dismissLabel}>Dismiss</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    zIndex: 1000,
    gap: spacing.sm,
    width: 360,
  },
  toast: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  toastCopy: {
    gap: spacing.xs,
  },
  toastTitle: {
    ...typography.button,
    color: colors.text,
  },
  toastBody: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
  dismissButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dismissButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  dismissLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
});
