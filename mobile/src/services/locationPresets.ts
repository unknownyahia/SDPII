import type { AppLanguage } from '../types/profile';

export type LocationOverride = {
  latitude: number;
  longitude: number;
  locationName: string;
};

type LocationPreset = LocationOverride & {
  labelEn: string;
  labelAr: string;
  aliases: readonly string[];
};

const QATAR_LOCATION_PRESETS: readonly LocationPreset[] = [
  {
    labelEn: 'Qatar',
    labelAr: 'قطر',
    aliases: ['qatar', 'قطر'],
    latitude: 25.2854,
    longitude: 51.531,
    locationName: 'Qatar',
  },
  {
    labelEn: 'Lusail',
    labelAr: 'لوسيل',
    aliases: ['lusail', 'لوسيل'],
    latitude: 25.4126,
    longitude: 51.513,
    locationName: 'Lusail',
  },
  {
    labelEn: 'The Pearl',
    labelAr: 'اللؤلؤة',
    aliases: ['the pearl', 'pearl', 'اللؤلؤة'],
    latitude: 25.3716,
    longitude: 51.5516,
    locationName: 'The Pearl',
  },
  {
    labelEn: 'West Bay',
    labelAr: 'ويست باي',
    aliases: ['west bay', 'ويست باي'],
    latitude: 25.3272,
    longitude: 51.5313,
    locationName: 'West Bay',
  },
  {
    labelEn: 'Msheireb',
    labelAr: 'مشيرب',
    aliases: ['msheireb', 'مشيرب'],
    latitude: 25.2867,
    longitude: 51.5321,
    locationName: 'Msheireb',
  },
  {
    labelEn: 'Education City',
    labelAr: 'المدينة التعليمية',
    aliases: ['education city', 'المدينة التعليمية'],
    latitude: 25.3164,
    longitude: 51.4369,
    locationName: 'Education City',
  },
  {
    labelEn: 'Aspire Zone',
    labelAr: 'أسباير زون',
    aliases: ['aspire zone', 'aspire', 'أسباير زون'],
    latitude: 25.2637,
    longitude: 51.4436,
    locationName: 'Aspire Zone',
  },
];

function normalizeLocationQuery(value: string) {
  return value.trim().toLowerCase();
}

export function findLocationPreset(query: string): LocationOverride | null {
  const normalizedQuery = normalizeLocationQuery(query);

  if (!normalizedQuery) {
    return null;
  }

  const preset = QATAR_LOCATION_PRESETS.find(item =>
    item.aliases.some(alias => normalizeLocationQuery(alias) === normalizedQuery)
  );

  if (!preset) {
    return null;
  }

  return {
    latitude: preset.latitude,
    longitude: preset.longitude,
    locationName: preset.locationName,
  };
}

export function getLocationPresetLabel(
  location: LocationOverride,
  language: AppLanguage
) {
  const preset = QATAR_LOCATION_PRESETS.find(
    item =>
      item.latitude === location.latitude &&
      item.longitude === location.longitude
  );

  if (!preset) {
    return location.locationName;
  }

  return language === 'ar' ? preset.labelAr : preset.labelEn;
}
