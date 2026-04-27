import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { loadLeaderboard } from '../../services/leaderboardService';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import { getErrorMessage } from '../../utils/dataAccessError';
import { showAlert } from '../../utils/showAlert';
import type { LeaderboardEntry } from '../../types/leaderboard';

export function LeaderboardPanel() {
  const { getRowDirection, getTextAlign, isRTL, language } = useLocalization();
  const [entries, setEntries] = React.useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const textAlign = getTextAlign();

  const refreshLeaderboard = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const nextEntries = await loadLeaderboard(10);
      setEntries(nextEntries);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to load leaderboard right now.');
      setErrorMessage(message);
      showAlert(language === 'ar' ? 'تعذر تحميل المتصدرين' : 'Could not load leaderboard', message);
    } finally {
      setLoading(false);
    }
  }, [language]);

  React.useEffect(() => {
    void refreshLeaderboard();
  }, [refreshLeaderboard]);

  return (
    <View style={styles.card}>
      <View style={[styles.headerRow, { flexDirection: getRowDirection() }]}>
        <View style={styles.headerCopy}>
          <Text
            style={[
              styles.title,
              { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {language === 'ar' ? 'النقاط والمتصدرون' : 'Points Leaderboard'}
          </Text>
          <Text
            style={[
              styles.subtitle,
              { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {language === 'ar'
              ? 'ترتيب حقيقي حسب نقاط XP من المنشورات والتفاعلات.'
              : 'Real XP ranking from posts and interactions.'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={() => void refreshLeaderboard()}
          style={[styles.refreshButton, loading && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.refreshText}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Text>
          )}
        </Pressable>
      </View>

      {errorMessage ? (
        <Text
          style={[
            styles.emptyText,
            styles.errorText,
            { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {errorMessage}
        </Text>
      ) : entries.length === 0 && !loading ? (
        <Text style={[styles.emptyText, { textAlign }]}>
          {language === 'ar'
            ? 'لا توجد نقاط كافية للعرض بعد.'
            : 'No leaderboard entries yet.'}
        </Text>
      ) : (
        <View style={styles.entries}>
          {entries.slice(0, 5).map(entry => (
            <View
              key={entry.userId}
              style={[
                styles.entry,
                entry.isCurrentUser && styles.entryCurrent,
                { flexDirection: getRowDirection() },
              ]}
            >
              <Text style={styles.rank}>#{entry.rank}</Text>
              <View style={styles.entryCopy}>
                <Text
                  style={[
                    styles.entryName,
                    { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                  numberOfLines={1}
                >
                  {entry.displayName}
                </Text>
                <Text
                  style={[
                    styles.entryMeta,
                    { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {entry.role} · {entry.badgeCount}{' '}
                  {language === 'ar' ? 'شارات' : 'badges'}
                </Text>
              </View>
              <Text style={styles.xp}>{entry.xp} XP</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
  refreshButton: {
    minHeight: 38,
    minWidth: 82,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  refreshText: {
    ...typography.button,
    color: colors.primaryPressed,
  },
  disabled: {
    opacity: 0.72,
  },
  emptyText: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
  errorText: {
    color: colors.danger,
  },
  entries: {
    gap: spacing.sm,
  },
  entry: {
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.md,
  },
  entryCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  rank: {
    ...typography.button,
    width: 42,
    color: colors.primaryPressed,
  },
  entryCopy: {
    flex: 1,
    minWidth: 0,
  },
  entryName: {
    ...typography.button,
    color: colors.text,
  },
  entryMeta: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  xp: {
    ...typography.button,
    color: colors.text,
  },
});
