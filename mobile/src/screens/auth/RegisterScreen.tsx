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
  registerUser,
} from '../../services/authService';
import { spacing, typography } from '../../theme/designSystem';
import { showAlert } from '../../utils/showAlert';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { getTextAlign, isRTL, t } = useLocalization();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await registerUser({ email, password });
      setEmail('');
      setPassword('');
    } catch (error: any) {
      if (error instanceof AuthValidationError) {
        showAlert(t('auth.missingData'), error.message);
      } else {
        const feedback = getAuthErrorFeedback(error, 'register');
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
          eyebrow={t('auth.register.eyebrow')}
          title={t('auth.register.title')}
          subtitle={t('auth.register.subtitle')}
        />

        <Card style={styles.card}>
          <Text
            style={[
              styles.cardTitle,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {t('auth.register.cardTitle')}
          </Text>
          <Text
            style={[
              styles.cardSubtitle,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {t('auth.register.cardSubtitle')}
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
              autoComplete="new-password"
              placeholder={t('auth.register.passwordPlaceholder')}
              secureTextEntry
              returnKeyType="done"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleRegister}
            />
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label={t('auth.register.submit')}
              loading={loading}
              onPress={handleRegister}
            />
            <SecondaryButton
              label={t('auth.register.secondary')}
              disabled={loading}
              onPress={() => navigation.goBack()}
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
});
