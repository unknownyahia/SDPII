import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  canvas: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceMuted: '#F8F4EE',
  surfaceRaised: '#FFFCF9',
  surfaceInset: '#F1EBE4',

  border: '#ECE6DE',
  borderStrong: '#DED5CC',

  text: '#241B17',
  textMuted: '#6F645D',
  textSubtle: '#9B8F87',

  primary: '#F45A4E',
  primaryPressed: '#DB4D42',
  primarySoft: '#FFF2EF',

  success: '#2E9B57',
  successSoft: '#EAF7EE',

  warning: '#B87A24',
  warningSoft: '#FCF2E2',

  danger: '#C34E42',
  dangerSoft: '#FBEAE7',

  info: '#3E79C5',
  infoSoft: '#EAF2FC',

  overlay: 'rgba(36, 27, 23, 0.12)',
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
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  hero: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.9,
  } satisfies TextStyle,

  title: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  } satisfies TextStyle,

  sectionTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.25,
  } satisfies TextStyle,

  body: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  } satisfies TextStyle,

  bodyMuted: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  } satisfies TextStyle,

  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
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
    lineHeight: 19,
    fontWeight: '700',
    color: colors.text,
  } satisfies TextStyle,
} as const;

export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#20150E',
      shadowOpacity: 0.05,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
    },
    android: {
      elevation: 2,
    },
    default: {},
  }) as ViewStyle,

  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#20150E',
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
    },
    android: {
      elevation: 5,
    },
    default: {},
  }) as ViewStyle,
} as const;