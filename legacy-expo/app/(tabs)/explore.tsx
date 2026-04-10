// app/(tabs)/explore.tsx
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import MapView, { Marker, Region, Circle } from 'react-native-maps';
import * as Location from 'expo-location';

import { subscribeToPosts } from '../../src/repositories/postsRepository';
import { summarizeAreaPosts } from '../../src/services/summaryService';
import type { SpotCategory, SpotPost } from '../../src/types/post';

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

type CategoryFilter = 'all' | SpotCategory;

const IMPLEMENTED_USECASES = 4;
const TOTAL_USECASES = 20;

export default function ExploreMap() {
  const [posts, setPosts] = useState<SpotPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region>({
    latitude: 25.2854,
    longitude: 51.531,
    latitudeDelta: 0.3,
    longitudeDelta: 0.3,
  });

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  // Center map near user's location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setRegion((prev) => ({
          ...prev,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }));
      }
    })();
  }, []);

  // Subscribe to Firestore posts
  useEffect(() => {
    const unsubscribe = subscribeToPosts(
      (nextPosts) => {
        setPosts(nextPosts);
        setLoading(false);
      },
      (error) => {
        console.log('Posts subscription error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const filteredPosts = posts.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : (p.category || '').toLowerCase() === selectedCategory;

    const matchesSearch = searchQuery.trim()
      ? p.text.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true;

    return matchesCategory && matchesSearch;
  });

  const handleSummarize = async () => {
    if (filteredPosts.length === 0) {
      setSummary('No posts in this view to summarize.');
      return;
    }

    setSummaryLoading(true);
    try {
      const nextSummary = await summarizeAreaPosts({
        posts: filteredPosts.map((post) => ({
          text: post.text,
          category: post.category,
        })),
      });
      setSummary(nextSummary);
    } catch (err: any) {
      console.log('Summarize error:', err);
      setSummary(`Failed to generate summary: ${String(err?.message || err)}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 8, color: COLORS.textMuted }}>
          Loading spots...
        </Text>
      </View>
    );
  }

  const hasNoResults = filteredPosts.length === 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {filteredPosts.map((post) => (
            <Marker
              key={post.id}
              coordinate={{ latitude: post.lat, longitude: post.lng }}
              title={post.category || 'Spot'}
              description={post.text}
            />
          ))}

          {filteredPosts.map((post) => (
            <Circle
              key={`circle-${post.id}`}
              center={{ latitude: post.lat, longitude: post.lng }}
              radius={300}
              strokeWidth={0}
              fillColor="rgba(239,68,68,0.18)"
            />
          ))}
        </MapView>

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayHeaderRow}>
            <View>
              <Text style={styles.overlayTitle}>Explore Spots</Text>
              <Text style={styles.overlaySubtitle}>
                UC5 · UC18 · UC4 (AI summarization)
              </Text>
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countText}>
                {filteredPosts.length}/{posts.length}
              </Text>
            </View>
          </View>

          <Text style={styles.featureCounter}>
            {IMPLEMENTED_USECASES}/{TOTAL_USECASES} use cases implemented in SDP I
            PoC
          </Text>

          {posts.length === 0 && (
            <View style={styles.demoGuide}>
              <Text style={styles.demoGuideTitle}>Demo instructions</Text>
              <Text style={styles.demoGuideText}>
                1. Go to the Post tab{'\n'}
                2. Seed demo data using &quot;🚀 Seed Demo Data&quot;{'\n'}
                3. Return here to view the map, heatmap, filters, and AI
                summary
              </Text>
            </View>
          )}

          <TextInput
            placeholder="Search spots by text..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setSummary(null);
            }}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />

          <View style={styles.filterRow}>
            <FilterChip
              label="All"
              active={selectedCategory === 'all'}
              onPress={() => {
                setSelectedCategory('all');
                setSummary(null);
              }}
            />
            <FilterChip
              label="Fishing"
              active={selectedCategory === 'fishing'}
              onPress={() => {
                setSelectedCategory('fishing');
                setSummary(null);
              }}
            />
            <FilterChip
              label="Event"
              active={selectedCategory === 'event'}
              onPress={() => {
                setSelectedCategory('event');
                setSummary(null);
              }}
            />
          </View>

          <View style={styles.filterRow2}>
            <FilterChip
              label="Sighting"
              active={selectedCategory === 'sighting'}
              onPress={() => {
                setSelectedCategory('sighting');
                setSummary(null);
              }}
            />
            <FilterChip
              label="Weather"
              active={selectedCategory === 'weather'}
              onPress={() => {
                setSelectedCategory('weather');
                setSummary(null);
              }}
            />
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.aiTitle}>🤖 AI-Powered Insights</Text>
            <Text style={styles.aiSubtitle}>
              UC4 · Smart area analysis based on recent posts in this view.
            </Text>

            <TouchableOpacity
              style={[
                styles.summaryButton,
                summaryLoading && { opacity: 0.7 },
              ]}
              onPress={handleSummarize}
              disabled={summaryLoading}
            >
              {summaryLoading ? (
                <ActivityIndicator color="#022c22" />
              ) : (
                <Text style={styles.summaryButtonText}>
                  Generate Area Summary
                </Text>
              )}
            </TouchableOpacity>

            {summary && (
              <View style={styles.summaryBubble}>
                <Text style={styles.summaryLabel}>AI summary</Text>
                <Text style={styles.summaryText}>{summary}</Text>
              </View>
            )}

            {hasNoResults && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No spots found</Text>
                <Text style={styles.emptyStateText}>
                  {selectedCategory === 'all'
                    ? 'Be the first to share a spot in this area!'
                    : `No ${selectedCategory} spots in this area yet.`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    padding: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(209,213,219,0.6)',
  },
  overlayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  overlaySubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
  },
  countText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  featureCounter: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  demoGuide: {
    marginTop: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    padding: 10,
  },
  demoGuideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 2,
  },
  demoGuideText: {
    fontSize: 12,
    color: '#0369a1',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 8,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  filterRow2: {
    flexDirection: 'row',
    marginTop: 4,
    justifyContent: 'flex-start',
  },
  chip: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 3,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summarySection: {
    marginTop: 10,
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  aiSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  summaryButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  summaryButtonText: {
    color: '#012B17',
    fontWeight: '700',
    fontSize: 13,
  },
  summaryBubble: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  summaryText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
  },
  emptyState: {
    marginTop: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  emptyStateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  emptyStateText: {
    fontSize: 12,
    color: '#1E40AF',
    marginTop: 2,
  },
});
