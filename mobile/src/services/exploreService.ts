import type { Region } from 'react-native-maps';

import type { PromotedEvent } from '../types/event';
import type { SpotCategory, SpotPost } from '../types/post';

export type CategoryFilter = 'all' | SpotCategory;

export const DEFAULT_EXPLORE_REGION: Region = {
  latitude: 25.2854,
  longitude: 51.531,
  latitudeDelta: 0.3,
  longitudeDelta: 0.3,
};

export function filterExplorePosts(
  posts: SpotPost[],
  selectedCategory: CategoryFilter,
  searchQuery: string
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return posts.filter((post) => {
    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : (post.category || '').toLowerCase() === selectedCategory;

    const matchesSearch = normalizedQuery
      ? post.text.toLowerCase().includes(normalizedQuery) ||
        (post.locationName || '').toLowerCase().includes(normalizedQuery)
      : true;

    return matchesCategory && matchesSearch;
  });
}

export function filterExploreEvents(
  events: PromotedEvent[],
  selectedCategory: CategoryFilter,
  searchQuery: string
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return events.filter((event) => {
    const matchesCategory =
      selectedCategory === 'all' ? true : event.category === selectedCategory;

    const matchesSearch = normalizedQuery
      ? event.title.toLowerCase().includes(normalizedQuery) ||
        event.description.toLowerCase().includes(normalizedQuery) ||
        (event.locationName || '').toLowerCase().includes(normalizedQuery)
      : true;

    return matchesCategory && matchesSearch;
  });
}
