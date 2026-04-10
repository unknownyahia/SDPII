import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  background: '#F4F7FB',
  backgroundAccent: '#EAF0F7',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  surfaceStrong: '#ECF2F8',
  border: '#D8E2EE',
  borderStrong: '#C4D0DD',
  text: '#142033',
  textMuted: '#617086',
  textSubtle: '#7E8CA1',
  primary: '#1C6DD0',
  primaryPressed: '#1559AA',
  primarySoft: '#E4EEFB',
  success: '#1F8F63',
  successSoft: '#E7F6EF',
  warning: '#B7791F',
  warningSoft: '#FFF4DD',
  danger: '#C24747',
  dangerSoft: '#FDEDED',
  overlay: 'rgba(15, 23, 42, 0.14)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  hero: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.8,
  } satisfies TextStyle,
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  } satisfies TextStyle,
  bodyMuted: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  } satisfies TextStyle,
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSubtle,
  } satisfies TextStyle,
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  } satisfies TextStyle,
} as const;

export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    android: {
      elevation: 4,
    },
    default: {},
  }) as ViewStyle,
  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
    },
    android: {
      elevation: 8,
    },
    default: {},
  }) as ViewStyle,
} as const;
