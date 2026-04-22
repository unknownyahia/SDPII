import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppHeader } from '../../components/ui/AppHeader';
import { Card } from '../../components/ui/Card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { TextField } from '../../components/ui/TextField';
import { useLocalization } from '../../context/LocalizationContext';
import {
  AuthValidationError,
  getAuthErrorFeedback,
  loginUser,
} from '../../services/authService';
import { colors, spacing, typography } from '../../theme/designSystem';
import { showAlert } from '../../utils/showAlert';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { getTextAlign, isRTL, t } = useLocalization();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginUser({ email, password });
      setEmail('');
      setPassword('');
    } catch (error: any) {
      if (error instanceof AuthValidationError) {
        showAlert(t('auth.missingData'), error.message);
      } else {
        const feedback = getAuthErrorFeedback(error, 'login');
        showAlert(feedback.title, feedback.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer keyboardAvoiding>
      <View style={styles.content}>
        <AppHeader
          eyebrow={t('auth.login.eyebrow')}
          title={t('auth.login.title')}
          subtitle={t('auth.login.subtitle')}
        />

        <Card style={styles.card}>
          <Text
            style={[
              styles.cardTitle,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {t('auth.login.cardTitle')}
          </Text>
          <Text
            style={[
              styles.cardSubtitle,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {t('auth.login.cardSubtitle')}
          </Text>

          <View style={styles.form}>
            <TextField
              label={t('auth.login.emailLabel')}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder={t('auth.login.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
            />

            <TextField
              label={t('auth.login.passwordLabel')}
              autoCapitalize="none"
              autoComplete="current-password"
              placeholder={t('auth.login.passwordPlaceholder')}
              secureTextEntry
              returnKeyType="done"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
            />
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label={t('auth.login.submit')}
              loading={loading}
              onPress={handleLogin}
            />
            <SecondaryButton
              label={t('auth.login.secondary')}
              disabled={loading}
              onPress={() => navigation.navigate('Register')}
            />
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  card: {
    gap: spacing.xl,
  },
  cardTitle: {
    ...typography.title,
  },
  cardSubtitle: {
    ...typography.bodyMuted,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  support: {
    ...typography.caption,
    color: colors.textSubtle,
  },
});
