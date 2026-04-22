import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  canvas: '#F6F2EC',
  surface: '#FFFCF8',
  surfaceMuted: '#F3ECE4',
  surfaceRaised: '#FBF7F2',
  surfaceInset: '#EEE5DC',
  border: '#E5DCD1',
  borderStrong: '#D7CCC0',
  text: '#201B16',
  textMuted: '#655C54',
  textSubtle: '#8E8378',
  primary: '#D94B37',
  primaryPressed: '#B93A28',
  primarySoft: '#F8E4DE',
  success: '#2E7B57',
  successSoft: '#E8F2EC',
  warning: '#B67A24',
  warningSoft: '#FAF0DF',
  danger: '#B94638',
  dangerSoft: '#F8E7E3',
  info: '#456C97',
  infoSoft: '#EAF1F8',
  overlay: 'rgba(32, 27, 22, 0.12)',
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
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  hero: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.9,
  } satisfies TextStyle,
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
  } satisfies TextStyle,
  sectionTitle: {
    fontSize: 19,
    lineHeight: 25,
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
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
      shadowColor: '#2A2119',
      shadowOpacity: 0.06,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    android: {
      elevation: 3,
    },
    default: {},
  }) as ViewStyle,
  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#2A2119',
      shadowOpacity: 0.1,
      shadowRadius: 26,
      shadowOffset: { width: 0, height: 14 },
    },
    android: {
      elevation: 7,
    },
    default: {},
  }) as ViewStyle,
} as const;
