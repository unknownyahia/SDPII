import type { SpotCategory } from '../types/post';

export type ExploreCategoryId =
  | 'all'
  | 'food'
  | 'coffee'
  | 'study'
  | 'outdoors'
  | 'fishing'
  | 'camping'
  | 'events'
  | 'family'
  | 'sights';

export type DisplayCategoryId = Exclude<ExploreCategoryId, 'all'>;

export type CategoryOption = {
  id: ExploreCategoryId;
  labelEn: string;
  labelAr: string;
  translationKey: `category.${ExploreCategoryId}`;
  icon: string;
  glyph: string;
  backendCategory: SpotCategory;
  storedCategories: readonly SpotCategory[];
  keywords: readonly string[];
};

export const INTERNAL_SPOT_CATEGORIES: readonly SpotCategory[] = [
  'fishing',
  'event',
  'sighting',
  'weather',
];

export const EXPLORE_CATEGORY_OPTIONS: readonly CategoryOption[] = [
  {
    id: 'all',
    labelEn: 'All',
    labelAr: 'الكل',
    translationKey: 'category.all',
    icon: 'ellipse-outline',
    glyph: '',
    backendCategory: 'sighting',
    storedCategories: INTERNAL_SPOT_CATEGORIES,
    keywords: [],
  },
  {
    id: 'food',
    labelEn: 'Food & Drinks',
    labelAr: 'مأكولات ومشروبات',
    translationKey: 'category.food',
    icon: 'restaurant-outline',
    glyph: '⌂',
    backendCategory: 'sighting',
    storedCategories: [],
    keywords: [
      'food',
      'drink',
      'restaurant',
      'bites',
      'lunch',
      'dinner',
      'cafe',
      'dessert',
      'طعام',
      'مطعم',
      'مأكولات',
      'مشروبات',
    ],
  },
  {
    id: 'coffee',
    labelEn: 'Coffee',
    labelAr: 'قهوة',
    translationKey: 'category.coffee',
    icon: 'cafe-outline',
    glyph: '◌',
    backendCategory: 'sighting',
    storedCategories: [],
    keywords: ['coffee', 'espresso', 'cafe', 'café', 'latte', 'roast', 'قهوة', 'مقهى', 'كافيه'],
  },
  {
    id: 'study',
    labelEn: 'Study & Work',
    labelAr: 'دراسة وعمل',
    translationKey: 'category.study',
    icon: 'book-outline',
    glyph: '▣',
    backendCategory: 'sighting',
    storedCategories: [],
    keywords: ['study', 'desk', 'work', 'quiet', 'library', 'wifi', 'lounge', 'دراسة', 'عمل', 'مكتبة', 'هادئ'],
  },
  {
    id: 'outdoors',
    labelEn: 'Outdoors',
    labelAr: 'خارجي',
    translationKey: 'category.outdoors',
    icon: 'leaf-outline',
    glyph: '△',
    backendCategory: 'weather',
    storedCategories: ['weather'],
    keywords: [
      'outdoor',
      'outdoors',
      'walk',
      'park',
      'lawn',
      'waterfront',
      'promenade',
      'beach',
      'corniche',
      'خارجي',
      'ممشى',
      'حديقة',
      'شاطئ',
    ],
  },
  {
    id: 'fishing',
    labelEn: 'Fishing',
    labelAr: 'الصيد',
    translationKey: 'category.fishing',
    icon: 'fish-outline',
    glyph: '≈',
    backendCategory: 'fishing',
    storedCategories: ['fishing'],
    keywords: ['fishing', 'fish', 'sea', 'coast', 'pier', 'marina', 'صيد', 'سمك', 'بحر', 'ساحل'],
  },
  {
    id: 'camping',
    labelEn: 'Camping',
    labelAr: 'التخييم',
    translationKey: 'category.camping',
    icon: 'bonfire-outline',
    glyph: '△',
    backendCategory: 'weather',
    storedCategories: [],
    keywords: ['camping', 'camp', 'desert', 'tent', 'overnight', 'outdoor', 'تخييم', 'مخيم', 'خيمة', 'بر', 'صحراء'],
  },
  {
    id: 'events',
    labelEn: 'Events',
    labelAr: 'فعاليات',
    translationKey: 'category.events',
    icon: 'calendar-outline',
    glyph: '✦',
    backendCategory: 'event',
    storedCategories: ['event'],
    keywords: ['event', 'events', 'activity', 'live', 'festival', 'فعالية', 'فعاليات', 'مباشر', 'مهرجان'],
  },
  {
    id: 'family',
    labelEn: 'Family',
    labelAr: 'عائلة',
    translationKey: 'category.family',
    icon: 'people-outline',
    glyph: '◇',
    backendCategory: 'sighting',
    storedCategories: [],
    keywords: [
      'family',
      'family-friendly',
      'family friendly',
      'kids',
      'children',
      'playground',
      'stroller',
      'parents',
      'family picnic',
      'picnic with family',
      'عائلة',
      'عائلي',
      'عائلات',
      'أطفال',
      'ملعب أطفال',
      'مناسب للعائلة',
    ],
  },
  {
    id: 'sights',
    labelEn: 'Sights',
    labelAr: 'معالم',
    translationKey: 'category.sights',
    icon: 'camera-outline',
    glyph: '◎',
    backendCategory: 'sighting',
    storedCategories: ['sighting'],
    keywords: [
      'sight',
      'sights',
      'sighting',
      'spot',
      'place',
      'landmark',
      'museum',
      'gallery',
      'culture',
      'souq',
      'market',
      'معالم',
      'مشاهدة',
      'مكان',
      'متحف',
      'سوق',
      'ثقافة',
    ],
  },
];

export type PostCategoryOption = CategoryOption & { id: DisplayCategoryId };

function isPostCategoryOption(
  category: CategoryOption
): category is PostCategoryOption {
  return category.id !== 'all';
}

export const POST_CATEGORY_OPTIONS = EXPLORE_CATEGORY_OPTIONS.filter(
  isPostCategoryOption
);

export const HOME_CATEGORY_OPTIONS = EXPLORE_CATEGORY_OPTIONS.filter(
  isPostCategoryOption
);

export function isSpotCategory(value: unknown): value is SpotCategory {
  return (
    typeof value === 'string' &&
    INTERNAL_SPOT_CATEGORIES.includes(value as SpotCategory)
  );
}

export function isExploreCategoryId(value: unknown): value is ExploreCategoryId {
  return (
    typeof value === 'string' &&
    EXPLORE_CATEGORY_OPTIONS.some((category) => category.id === value)
  );
}

export function isDisplayCategoryId(value: unknown): value is DisplayCategoryId {
  return (
    typeof value === 'string' &&
    POST_CATEGORY_OPTIONS.some((category) => category.id === value)
  );
}

export function getExploreCategoryOption(id: ExploreCategoryId): CategoryOption {
  return (
    EXPLORE_CATEGORY_OPTIONS.find((category) => category.id === id) ??
    EXPLORE_CATEGORY_OPTIONS[0]
  );
}

export function getPostCategoryOption(id: DisplayCategoryId): PostCategoryOption {
  return (
    POST_CATEGORY_OPTIONS.find((category) => category.id === id) ??
    POST_CATEGORY_OPTIONS[0]
  );
}

export function getCategoryOptionLabel(
  category: Pick<CategoryOption, 'labelEn' | 'labelAr'>,
  language: 'en' | 'ar'
) {
  return language === 'ar' ? category.labelAr : category.labelEn;
}

export function getBackendCategoryForDisplayCategory(
  categoryId: ExploreCategoryId | DisplayCategoryId
): SpotCategory {
  return getExploreCategoryOption(categoryId).backendCategory;
}

export function getDisplayCategoryIdForStoredCategory(
  category?: SpotCategory
): DisplayCategoryId | null {
  switch (category) {
    case 'event':
      return 'events';
    case 'fishing':
      return 'fishing';
    case 'weather':
      return 'outdoors';
    case 'sighting':
      return 'sights';
    default:
      return null;
  }
}

export function getStoredCategorySearchAliases(category?: SpotCategory) {
  switch (category) {
    case 'event':
      return 'event events activity live festival فعالية فعاليات مباشر مهرجان';
    case 'fishing':
      return 'fishing fish sea coast pier marina صيد سمك بحر ساحل';
    case 'sighting':
      return 'sight sights sighting spot place landmark museum gallery culture souq market معالم مشاهدة مكان متحف سوق ثقافة';
    case 'weather':
      return 'weather conditions outdoor outdoors park waterfront promenade beach camping desert طقس أجواء خارجي ممشى شاطئ تخييم صحراء';
    default:
      return '';
  }
}

function normalizeCategoryText(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase();
}

export function matchesExploreCategory(
  storedCategory: SpotCategory | undefined,
  selectedCategory: ExploreCategoryId,
  fields: Array<string | null | undefined>,
  displayCategory?: DisplayCategoryId | null
) {
  if (selectedCategory === 'all') {
    return true;
  }

  if (isDisplayCategoryId(displayCategory)) {
    return displayCategory === selectedCategory;
  }

  const categoryOption = getExploreCategoryOption(selectedCategory);
  if (
    storedCategory &&
    categoryOption.storedCategories.includes(storedCategory)
  ) {
    return true;
  }

  if (categoryOption.keywords.length === 0) {
    return false;
  }

  const haystack = normalizeCategoryText(
    [...fields, storedCategory, getStoredCategorySearchAliases(storedCategory)]
      .filter(Boolean)
      .join(' ')
  );

  return categoryOption.keywords.some((keyword) =>
    haystack.includes(normalizeCategoryText(keyword))
  );
}
