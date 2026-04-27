import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthHeaderCollage } from '../../components/auth/AuthHeaderCollage';
import { AuthIcon } from '../../components/auth/AuthIcon';
import { useLocalization } from '../../context/LocalizationContext';
import {
  AuthValidationError,
  getAuthErrorFeedback,
  loginUser,
} from '../../services/authService';
import { authSharedStyles } from '../../theme/authTheme';
import { showAlert } from '../../utils/showAlert';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { getRowDirection, getTextAlign, isRTL, language, t } = useLocalization();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [secure, setSecure] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const textAlign = getTextAlign();
  const writingDirection = isRTL ? 'rtl' : 'ltr';
  const title = language === 'ar' ? 'مرحبًا بعودتك' : 'Welcome back';
  const subtitle =
    language === 'ar'
      ? 'سجل دخولك لاكتشاف الأماكن المحلية والفعاليات في قطر.'
      : 'Sign in to discover local spots, events, and hidden gems in Qatar.';

  const handleLogin = async () => {
    if (loading) {
      return;
    }

    setError('');

    if (!email.trim() || !password.trim()) {
      const message =
        language === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور.'
          : 'Please enter your email and password.';
      setError(message);
      return;
    }

    setLoading(true);
    try {
      await loginUser({ email: email.trim(), password });
      setEmail('');
      setPassword('');
    } catch (caughtError) {
      if (caughtError instanceof AuthValidationError) {
        setError(caughtError.message);
        showAlert(t('auth.missingData'), caughtError.message);
      } else {
        const feedback = getAuthErrorFeedback(caughtError, 'login');
        setError(feedback.message);
        showAlert(feedback.title, feedback.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={authSharedStyles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={authSharedStyles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={authSharedStyles.screen}
          contentContainerStyle={authSharedStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBarOnlyBrand}>
            <Text style={authSharedStyles.brand}>Spots</Text>
          </View>

          <Text
            style={[
              authSharedStyles.title,
              { writingDirection, textAlign: 'center' },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              authSharedStyles.subtitle,
              { writingDirection, textAlign: 'center' },
            ]}
          >
            {subtitle}
          </Text>

          <AuthHeaderCollage mode="login" />

          <View style={authSharedStyles.formCard}>
            <View style={[authSharedStyles.fieldWrap, { flexDirection: getRowDirection() }]}>
              <AuthIcon
                name="mail"
                size={22}
                color="#9A9088"
                style={styles.fieldIcon}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.login.emailLabel')}
                placeholderTextColor="#A09992"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!loading}
                style={[
                  authSharedStyles.input,
                  { textAlign, writingDirection },
                ]}
              />
            </View>

            <View style={[authSharedStyles.fieldWrap, { flexDirection: getRowDirection() }]}>
              <AuthIcon
                name="lock"
                size={22}
                color="#9A9088"
                style={styles.fieldIcon}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.login.passwordLabel')}
                placeholderTextColor="#A09992"
                secureTextEntry={secure}
                autoCapitalize="none"
                autoComplete="current-password"
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                style={[
                  authSharedStyles.input,
                  { textAlign, writingDirection },
                ]}
              />
              <Pressable
                accessibilityLabel={secure ? 'Show password' : 'Hide password'}
                accessibilityRole="button"
                disabled={loading}
                onPress={() => setSecure(value => !value)}
                style={styles.eyeButton}
              >
                <AuthIcon
                  name={secure ? 'eye' : 'eye-off'}
                  size={22}
                  color="#9A9088"
                />
              </Pressable>
            </View>

            {error ? (
              <Text
                style={[
                  authSharedStyles.errorText,
                  { textAlign, writingDirection },
                ]}
              >
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                authSharedStyles.primaryButton,
                pressed && authSharedStyles.primaryButtonPressed,
                loading && authSharedStyles.primaryButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={authSharedStyles.primaryButtonLabel}>
                  {language === 'ar' ? 'تسجيل الدخول' : 'Sign In ->'}
                </Text>
              )}
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View
            style={[
              authSharedStyles.bottomLinkRow,
              { flexDirection: getRowDirection() },
            ]}
          >
            <Text style={[authSharedStyles.bottomLinkText, { writingDirection }]}>
              {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={authSharedStyles.bottomLinkAction}>
                {language === 'ar' ? 'إنشاء حساب' : 'Sign up'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBarOnlyBrand: {
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: 4,
  },
  fieldIcon: {
    width: 26,
    textAlign: 'center',
  },
  eyeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E9E2DA',
    marginTop: 18,
  },
});
