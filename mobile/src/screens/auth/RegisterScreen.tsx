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
  registerUser,
} from '../../services/authService';
import { authSharedStyles } from '../../theme/authTheme';
import { showAlert } from '../../utils/showAlert';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { getRowDirection, getTextAlign, isRTL, language, t } = useLocalization();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [securePassword, setSecurePassword] = React.useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = React.useState(true);
  const [agreed, setAgreed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const textAlign = getTextAlign();
  const writingDirection = isRTL ? 'rtl' : 'ltr';
  const title = language === 'ar' ? 'إنشاء حساب' : 'Create your account';
  const subtitle =
    language === 'ar'
      ? 'انضم إلى سبوتس لاكتشاف أفضل الأماكن والفعاليات المحلية في قطر.'
      : 'Join Spots to discover the best local places and events in Qatar.';

  const handleRegister = async () => {
    if (loading) {
      return;
    }

    setError('');

    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(
        language === 'ar'
          ? 'يرجى إكمال جميع الحقول المطلوبة.'
          : 'Please complete all required fields.'
      );
      return;
    }

    if (confirmPassword !== password) {
      setError(
        language === 'ar'
          ? 'كلمتا المرور غير متطابقتين.'
          : 'Passwords do not match.'
      );
      return;
    }

    if (!agreed) {
      setError(
        language === 'ar'
          ? 'يرجى الموافقة على الشروط وسياسة الخصوصية.'
          : 'Please agree to the Terms and Privacy Policy.'
      );
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        email: email.trim(),
        password,
        username: fullName.trim(),
      });
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAgreed(false);
    } catch (caughtError) {
      if (caughtError instanceof AuthValidationError) {
        setError(caughtError.message);
        showAlert(t('auth.missingData'), caughtError.message);
      } else {
        const feedback = getAuthErrorFeedback(caughtError, 'register');
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

          <AuthHeaderCollage mode="register" />

          <View style={authSharedStyles.formCard}>
            <View style={[authSharedStyles.fieldWrap, { flexDirection: getRowDirection() }]}>
              <AuthIcon
                name="person"
                size={22}
                color="#9A9088"
                style={styles.fieldIcon}
              />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full name'}
                placeholderTextColor="#A09992"
                editable={!loading}
                autoComplete="name"
                style={[
                  authSharedStyles.input,
                  { textAlign, writingDirection },
                ]}
              />
            </View>

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
                secureTextEntry={securePassword}
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!loading}
                style={[
                  authSharedStyles.input,
                  { textAlign, writingDirection },
                ]}
              />
              <Pressable
                accessibilityLabel={securePassword ? 'Show password' : 'Hide password'}
                accessibilityRole="button"
                disabled={loading}
                onPress={() => setSecurePassword(value => !value)}
                style={styles.eyeButton}
              >
                <AuthIcon
                  name={securePassword ? 'eye' : 'eye-off'}
                  size={22}
                  color="#9A9088"
                />
              </Pressable>
            </View>

            <View style={[authSharedStyles.fieldWrap, { flexDirection: getRowDirection() }]}>
              <AuthIcon
                name="lock"
                size={22}
                color="#9A9088"
                style={styles.fieldIcon}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={
                  language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm password'
                }
                placeholderTextColor="#A09992"
                secureTextEntry={secureConfirmPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                style={[
                  authSharedStyles.input,
                  { textAlign, writingDirection },
                ]}
              />
              <Pressable
                accessibilityLabel={secureConfirmPassword ? 'Show password' : 'Hide password'}
                accessibilityRole="button"
                disabled={loading}
                onPress={() => setSecureConfirmPassword(value => !value)}
                style={styles.eyeButton}
              >
                <AuthIcon
                  name={secureConfirmPassword ? 'eye' : 'eye-off'}
                  size={22}
                  color="#9A9088"
                />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              disabled={loading}
              onPress={() => setAgreed(value => !value)}
              style={[authSharedStyles.checkboxRow, { flexDirection: getRowDirection() }]}
            >
              <View
                style={[
                  authSharedStyles.checkbox,
                  agreed && authSharedStyles.checkboxChecked,
                ]}
              >
                {agreed ? (
                  <AuthIcon name="check" size={17} color="#F55445" />
                ) : null}
              </View>

              <Text
                style={[
                  authSharedStyles.checkboxText,
                  { textAlign, writingDirection },
                ]}
              >
                {language === 'ar' ? 'أوافق على ' : 'I agree to the '}
                <Text style={authSharedStyles.linkText}>
                  {language === 'ar'
                    ? 'الشروط وسياسة الخصوصية'
                    : 'Terms and Privacy Policy'}
                </Text>
              </Text>
            </Pressable>

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
              onPress={handleRegister}
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
                  {language === 'ar' ? 'إنشاء الحساب' : 'Create Account ->'}
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
              {language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={authSharedStyles.bottomLinkAction}>
                {language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
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
