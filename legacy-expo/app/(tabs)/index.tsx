// app/(tabs)/index.tsx
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import {
  AuthValidationError,
  loginUser,
  logoutUser,
  observeAuthState,
  registerUser,
} from '../../src/services/authService';

const COLORS = {
  primary: '#0A84FF',
  primarySoft: '#D0E7FF',
  accent: '#FF9F0A',
  success: '#34C759',
  bg: '#F2F2F7',
  card: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#FF3B30',
};

export default function HomeTab() {
  const router = useRouter();

  const [firebaseReady, setFirebaseReady] = useState(false);
  const [userInfo, setUserInfo] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = observeAuthState((user) => {
      if (user) {
        setUserInfo(user.displayInfo);
        // Auto-redirect logged-in users to Post tab (UC3)
        router.replace('/(tabs)/post');
      } else {
        setUserInfo(null);
      }
      setFirebaseReady(true);
    });

    return unsubscribe;
  }, [router]);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await registerUser({ email, password });
      setEmail('');
      setPassword('');

      router.replace('/(tabs)/post');
    } catch (err: any) {
      if (err instanceof AuthValidationError) {
        Alert.alert('Missing data', err.message);
        return;
      }

      console.log('Register error:', err);
      Alert.alert('Register error', err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginUser({ email, password });
      setEmail('');
      setPassword('');

      router.replace('/(tabs)/post');
    } catch (err: any) {
      if (err instanceof AuthValidationError) {
        Alert.alert('Missing data', err.message);
        return;
      }

      console.log('Login error:', err);
      Alert.alert('Login error', err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } catch (err: any) {
      console.log('Logout error:', err);
      Alert.alert('Logout error', err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={styles.appName}>Spots</Text>
          <Text style={styles.appSubtitle}>
            Sign in to share and explore outdoor updates around you.
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            {firebaseReady ? 'Firebase connected ✅' : 'Connecting to Firebase…'}
          </Text>
          <Text style={styles.statusText}>
            {userInfo ? `Signed in as ${userInfo}` : 'Guest'}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>
              Use your email and password to sign in. After login, you&apos;ll be
              redirected to the Post tab (UC3) to share your spot.
            </Text>

            <TextInput
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.passwordRow}>
              <TextInput
                placeholder="Password"
                secureTextEntry={!showPassword}
                style={[styles.input, { flex: 1, marginTop: 0 }]}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.showButton}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Text style={styles.showButtonText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonColumn}>
              <TouchableOpacity
                style={[
                  styles.buttonPrimary,
                  loading && { opacity: 0.7 },
                ]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.buttonSecondary]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={[styles.buttonText, { color: COLORS.primary }]}>
                  Create New Account
                </Text>
              </TouchableOpacity>
            </View>

            {userInfo && (
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            )}

            {/* Stub for future social logins (SDP II) */}
            <View style={styles.futureRow}>
              <Text style={styles.futureLabel}>
                Social login (Google / Apple) planned for SDP II.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  appSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FCFCFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    fontSize: 15,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  showButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.bg,
  },
  showButtonText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  buttonColumn: {
    marginTop: 18,
    gap: 10,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonSecondary: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 11,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  logoutButton: {
    marginTop: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingVertical: 9,
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 13,
  },
  futureRow: {
    marginTop: 16,
  },
  futureLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
