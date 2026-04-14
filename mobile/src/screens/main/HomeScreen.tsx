import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/ui/AppHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Section } from '../../components/ui/Section';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme/designSystem';

export function HomeScreen() {
  const { isInitializing, user } = useAuth();

  return (
    <ScreenContainer>
      <AppHeader
        eyebrow="Home"
        title="Your account is ready."
        subtitle="This is the calm landing view for the current app shell. The richer feed and utility screens stay in the other tabs."
      />

      <View style={styles.stack}>
        <Card>
          <Section
            title="Session"
            subtitle="Current authentication and account context."
          >
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={styles.metaValue}>
                {isInitializing ? 'Checking session' : 'Signed in'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Identity</Text>
              <Text style={styles.metaValue}>
                {user?.displayInfo ?? 'Unknown user'}
              </Text>
            </View>
          </Section>
        </Card>

        <EmptyState
          title="Main actions live in the other tabs"
          subtitle="Use Explore for live map activity, Post for creating updates and events, and Profile for settings, notifications, moderation, and analytics."
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metaLabel: {
    ...typography.label,
    color: colors.textSubtle,
    minWidth: 120,
  },
  metaValue: {
    ...typography.body,
    flexGrow: 1,
    flexShrink: 1,
    textAlign: 'right',
  },
});
