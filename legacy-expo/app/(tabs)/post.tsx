// app/(tabs)/post.tsx
import { useState } from 'react';
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

import { auth } from '../../src/firebase/firebaseConfig';
import {
  PostLocationPermissionError,
  PostValidationError,
  publishCurrentLocationPost,
  seedDemoPosts,
} from '../../src/services/postService';
import type { SpotCategory } from '../../src/types/post';

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

const CATEGORIES = [
  { id: 'fishing', label: '🎣 Fishing', color: '#0A84FF' },
  { id: 'event', label: '🎉 Event', color: '#8E8E93' },
  { id: 'sighting', label: '👀 Sighting', color: '#34C759' },
  { id: 'weather', label: '☀️ Weather', color: '#FF9F0A' },
] as const satisfies readonly {
  id: SpotCategory;
  label: string;
  color: string;
}[];

const IMPLEMENTED_USECASES = 4;
const TOTAL_USECASES = 20;

type PoCStatusProps = {
  implemented?: boolean;
  label: string;
};

function PoCStatus({ implemented = true, label }: PoCStatusProps) {
  return (
    <View style={styles.pocStatus}>
      <View
        style={[
          styles.statusDot,
          implemented ? styles.statusImplemented : styles.statusPlanned,
        ]}
      />
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

export default function PostTab() {
  const [postText, setPostText] = useState('');
  const [category, setCategory] = useState<SpotCategory>('fishing');
  const [postLoading, setPostLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [locationName, setLocationName] = useState<string>('');
  const [lastPostSuccess, setLastPostSuccess] = useState(false);

  const currentUser = auth.currentUser;

  const handleCreatePost = async () => {
    setPostLoading(true);
    setLastPostSuccess(false);
    try {
      const result = await publishCurrentLocationPost({
        userId: auth.currentUser?.uid,
        text: postText,
        category,
      });

      setLocationName(result.locationName);
      setPostText('');
      setLastPostSuccess(true);
      Alert.alert(
        'Post created',
        'Your activity update has been saved with GPS.'
      );
    } catch (err: any) {
      if (err instanceof PostValidationError) {
        const title = auth.currentUser ? 'Empty post' : 'Not logged in';
        Alert.alert(title, err.message);
        return;
      }

      if (err instanceof PostLocationPermissionError) {
        Alert.alert('Location permission denied', err.message);
        return;
      }

      console.log('Create post error:', err);
      Alert.alert('Create post error', err.message ?? 'Something went wrong');
    } finally {
      setPostLoading(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert(
          'Not logged in',
          'Login first before seeding demo data.'
        );
        return;
      }

      setSeedLoading(true);

      await seedDemoPosts();

      Alert.alert('Done', 'Sample posts have been added to Firestore.');
    } catch (err: any) {
      console.log('Seed error:', err);
      Alert.alert('Error', err.message ?? 'Failed to seed demo data');
    } finally {
      setSeedLoading(false);
    }
  };

  const remainingChars = 280 - postText.length;
  const charColor =
    remainingChars < 40
      ? COLORS.danger
      : remainingChars < 100
      ? COLORS.accent
      : COLORS.textMuted;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.title}>Create Spot</Text>
          <Text style={styles.subtitle}>
            UC3 · Share what&apos;s happening at your location in real time.
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {!currentUser && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>You&apos;re not signed in</Text>
              <Text style={styles.warningText}>
                Go to the Home tab to sign in or create an account before
                posting.
              </Text>
            </View>
          )}

          {/* Main posting card */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    style={[
                      styles.categoryChip,
                      active && {
                        backgroundColor: cat.color,
                        borderColor: cat.color,
                        shadowColor: cat.color,
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 3,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        active && { color: '#FFFFFF' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
              Post text
            </Text>
            <TextInput
              placeholder="Describe conditions, catches, crowds, weather, or events at your spot..."
              multiline
              style={[styles.input, { height: 130, textAlignVertical: 'top' }]}
              value={postText}
              onChangeText={setPostText}
              maxLength={280}
            />
            <Text style={[styles.charCount, { color: charColor }]}>
              {remainingChars} characters left
            </Text>

            {locationName ? (
              <Text style={styles.locationHint}>
                Last known location: {locationName}
              </Text>
            ) : null}

            {postLoading && (
              <ActivityIndicator style={{ marginVertical: 8 }} />
            )}

            <TouchableOpacity
              style={[
                styles.buttonPrimary,
                (!currentUser || postLoading) && { opacity: 0.7 },
              ]}
              onPress={handleCreatePost}
              disabled={postLoading || !currentUser}
            >
              <Text style={styles.buttonPrimaryText}>Post with GPS</Text>
            </TouchableOpacity>

            {lastPostSuccess && (
              <Text style={styles.successText}>
                Your last post was published successfully ✅
              </Text>
            )}
          </View>

          {/* Demo / PoC features card */}
          <View style={styles.card}>
            <View style={styles.demoHeader}>
              <Text style={styles.demoTitle}>🎯 Demo Features</Text>
              <Text style={styles.demoBadge}>SDP I PoC</Text>
            </View>

            <Text style={styles.cardHint}>
              Seed predefined posts around Doha to showcase the implemented
              use cases
            </Text>

            <View style={styles.useCasePills}>
              <Text style={styles.pill}>UC3 · Post with GPS</Text>
              <Text style={styles.pill}>UC4 · AI summary</Text>
              <Text style={styles.pill}>UC5 · Explore map</Text>
              <Text style={styles.pill}>UC18 · Real-time updates</Text>
            </View>

            <View style={styles.featureList}>
              <PoCStatus implemented label="Real-time posting with GPS (UC3)" />
              <PoCStatus
                implemented
                label="Demo seeding for map & heatmap"
              />
              <PoCStatus
                implemented
                label="AI summarization on Explore (UC4)"
              />
              <PoCStatus
                implemented={false}
                label="Social features & comments (SDP II)"
              />
              <PoCStatus
                implemented={false}
                label="Profiles, achievements, and full gamification (SDP II)"
              />
            </View>

            {seedLoading && (
              <ActivityIndicator style={{ marginVertical: 8 }} />
            )}

            <TouchableOpacity
              style={[
                styles.buttonGhost,
                (!currentUser || seedLoading) && { opacity: 0.7 },
              ]}
              onPress={handleSeedDemoData}
              disabled={seedLoading || !currentUser}
            >
              <Text style={styles.buttonGhostText}>🚀 Seed Demo Data</Text>
            </TouchableOpacity>

            {!currentUser && (
              <Text style={styles.seedNote}>
                Sign in first to link demo posts to your account context.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  warningCard: {
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  warningText: {
    marginTop: 2,
    fontSize: 12,
    color: '#991B1B',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryScroll: {
    marginTop: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FBFBFE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    fontSize: 15,
  },
  charCount: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  locationHint: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  successText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.success,
  },
  cardHint: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  buttonGhost: {
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.accent,
    marginTop: 12,
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
  },
  buttonGhostText: {
    color: '#92400E',
    fontWeight: '600',
    fontSize: 13,
  },
  seedNote: {
    marginTop: 6,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  /* Demo / PoC section styles */
  demoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369a1',
  },
  demoBadge: {
    backgroundColor: '#0ea5e9',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
  },
  featureCounter: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  useCasePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  pill: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
    marginBottom: 6,
  },
  featureList: {
    marginTop: 10,
  },
  pocStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusImplemented: {
    backgroundColor: COLORS.success,
  },
  statusPlanned: {
    backgroundColor: '#6B7280',
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
