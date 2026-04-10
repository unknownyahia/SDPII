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
import { AuthValidationError, registerUser } from '../../services/authService';
import { spacing, typography } from '../../theme/designSystem';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
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
        Alert.alert('Missing data', error.message);
      } else {
        Alert.alert('Register error', error?.message ?? 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer keyboardAvoiding>
      <View style={styles.content}>
        <AppHeader
          eyebrow="New account"
          title="Create your Spots identity."
          subtitle="Set up a simple account to post updates, save favorites, and manage your settings."
        />

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Create account</Text>
          <Text style={styles.cardSubtitle}>
            Your profile and default subscription will be created automatically.
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
              placeholder="Create a password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label="Create Account"
              loading={loading}
              onPress={handleRegister}
            />
            <SecondaryButton
              label="Back To Login"
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
