import type { Region } from 'react-native-maps';

import {
  getExploreCategoryOption,
  getStoredCategorySearchAliases,
  isDisplayCategoryId,
  matchesExploreCategory,
  type DisplayCategoryId,
  type ExploreCategoryId,
} from '../constants/categories';
import type { PromotedEvent } from '../types/event';
import type { SpotPost } from '../types/post';

export type CategoryFilter = ExploreCategoryId;

export const DEFAULT_EXPLORE_REGION: Region = {
  latitude: 25.3548,
  longitude: 51.1839,
  latitudeDelta: 1.15,
  longitudeDelta: 1.15,
};

function normalizeSearchValue(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function getSearchAliases(query: string) {
  switch (query) {
    case 'قهوة':
    case 'كافيه':
    case 'مقهى':
      return ['coffee', 'cafe', 'espresso'];
    case 'عائلة':
    case 'أطفال':
      return [
        'family',
        'family-friendly',
        'kids',
        'children',
        'playground',
        'stroller',
        'parents',
      ];
    case 'دراسة':
    case 'عمل':
      return ['study', 'work', 'quiet', 'library', 'wifi'];
    case 'مطعم':
    case 'مأكولات':
    case 'طعام':
      return ['food', 'restaurant', 'dinner', 'lunch', 'cafe'];
    case 'الصيد':
    case 'صيد':
    case 'سمك':
      return ['fishing', 'fish', 'sea', 'coast', 'pier'];
    case 'التخييم':
    case 'تخييم':
    case 'مخيم':
      return ['camping', 'camp', 'desert', 'tent', 'outdoor'];
    case 'خارجي':
    case 'ممشى':
      return ['outdoor', 'walk', 'park', 'waterfront', 'promenade'];
    case 'فعاليات':
    case 'فعالية':
      return ['event', 'events', 'activity', 'live'];
    case 'معالم':
    case 'مكان':
      return ['sights', 'sight', 'landmark', 'museum', 'gallery', 'souq', 'market'];
    default:
      return [];
  }
}

function getDisplayCategorySearchAliases(category?: DisplayCategoryId | null) {
  if (!isDisplayCategoryId(category)) {
    return '';
  }

  const option = getExploreCategoryOption(category);
  return [
    option.id,
    option.labelEn,
    option.labelAr,
    ...option.keywords,
  ].join(' ');
}

function matchesSearchQuery(searchQuery: string, fields: Array<string | null | undefined>) {
  const normalizedQuery = normalizeSearchValue(searchQuery);

  if (!normalizedQuery) {
    return true;
  }

  const queries = [normalizedQuery, ...getSearchAliases(normalizedQuery)];

  return fields.some(field => {
    const normalizedField = normalizeSearchValue(field);
    return queries.some(query => normalizedField.includes(query));
  });
}

export function filterExplorePosts(
  posts: SpotPost[],
  selectedCategory: CategoryFilter,
  searchQuery: string
) {
  return posts.filter((post) => {
    const matchesCategory = matchesExploreCategory(
      post.category,
      selectedCategory,
      [post.text, post.locationName],
      post.displayCategory
    );

    const matchesSearch = matchesSearchQuery(searchQuery, [
      post.text,
      post.locationName,
      post.displayCategory,
      getDisplayCategorySearchAliases(post.displayCategory),
      post.category,
      getStoredCategorySearchAliases(post.category),
    ]);

    return matchesCategory && matchesSearch;
  });
}

export function filterExploreEvents(
  events: PromotedEvent[],
  selectedCategory: CategoryFilter,
  searchQuery: string
) {
  return events.filter((event) => {
    const matchesCategory = matchesExploreCategory(event.category, selectedCategory, [
      event.title,
      event.description,
      event.locationName,
      event.venueName,
      event.organizerName,
    ]);

    const matchesSearch = matchesSearchQuery(searchQuery, [
      event.title,
      event.description,
      event.locationName,
      event.venueName,
      event.organizerName,
      event.category,
      getStoredCategorySearchAliases(event.category),
    ]);

    return matchesCategory && matchesSearch;
  });
}
