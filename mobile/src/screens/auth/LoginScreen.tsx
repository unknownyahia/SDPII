import React from 'react';
import {
  Alert,
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
import { AuthValidationError, loginUser } from '../../services/authService';
import { colors, spacing, typography } from '../../theme/designSystem';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
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
        Alert.alert('Missing data', error.message);
      } else {
        Alert.alert('Login error', error?.message ?? 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer keyboardAvoiding>
      <View style={styles.content}>
        <AppHeader
          eyebrow="Spots"
          title="A calmer view of what's happening nearby."
          subtitle="Sign in to share live updates, explore map activity, and manage your profile."
        />

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>
            Enter your email and password to continue.
          </Text>

          <View style={styles.form}>
            <TextField
              label="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
            />

            <TextField
              label="Password"
              autoCapitalize="none"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label="Sign In"
              loading={loading}
              onPress={handleLogin}
            />
            <SecondaryButton
              label="Create New Account"
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
