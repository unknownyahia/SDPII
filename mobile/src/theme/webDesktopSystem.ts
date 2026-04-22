import { radius, spacing } from './designSystem';

export const webDesktopLayout = {
  maxWidth: 1480,
  horizontalPadding: spacing.xxxl + 8,
  topPadding: spacing.xxl,
  bottomPadding: spacing.xxxl + 12,
  sectionGap: spacing.lg,
} as const;

export const webDesktopSurface = {
  borderRadius: radius.xl + 2,
  borderWidth: 1,
  borderColor: '#E9DED2',
  backgroundColor: '#FFFCF8',
  shadowColor: '#291C15',
  shadowOpacity: 0.035,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
} as const;

export const webDesktopSupportSurface = {
  borderRadius: radius.xl,
  borderWidth: 1,
  borderColor: '#ECE3D9',
  backgroundColor: '#FFFDF9',
  shadowColor: '#291C15',
  shadowOpacity: 0.03,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
} as const;

export const webDesktopControl = {
  minHeight: 42,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: '#E8DDD1',
  backgroundColor: '#FFFEFC',
} as const;

export const webDesktopChip = {
  minHeight: 36,
  borderRadius: radius.pill,
  borderWidth: 1,
  borderColor: '#E8DDD1',
  backgroundColor: '#FFFEFC',
} as const;

export const webDesktopSectionTitle = {
  fontSize: 18,
  lineHeight: 23,
} as const;
