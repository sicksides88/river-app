// Tema basado en diseño Figma - VNR App Movilidad
export const COLORS = {
  // Primary colors - Black & White theme
  primary: '#000000',
  primaryLight: '#f5f5f5',
  primaryDark: '#000000',

  // Text colors
  text: '#000000',
  textSecondary: '#666666',
  textMuted: '#999999',
  textLight: '#AAAAAA',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9F9F9',
  backgroundTertiary: '#F5F5F5',
  backgroundInput: '#F5F5F5', // Input background from Figma

  // Border colors
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  borderDark: '#000000',

  // Status colors
  success: '#22C55E', // Verde más vivo para origen
  successDark: '#155724',
  successLight: '#d4edda',
  successBorder: '#c3e6cb',

  error: '#EF4444', // Rojo para destino y errores
  errorDark: '#DC2626',
  errorLight: '#FEF2F2',
  errorBorder: '#FECACA',
  errorText: '#B91C1C',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningBorder: '#FDE68A',

  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Badge/Accent colors (Figma)
  accent: '#FFD700', // Amarillo dorado para badges "POCOS"
  accentOrange: '#F97316', // Naranja para destacados

  // Rating
  star: '#FBBF24', // Amarillo estrellas

  // Basic colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#666666',
  lightGray: '#E5E5E5',
  darkGray: '#374151',

  // Map markers
  markerOrigin: '#22C55E', // Verde
  markerDestination: '#EF4444', // Rojo
  routeLine: '#000000', // Negro

  // Auth screens - White theme
  authBackground: '#FFFFFF',
  authText: '#1A1A2E',
  authTextSecondary: '#64748B',
  authInputBg: '#F1F5F9',
  authInputBorder: '#E2E8F0',
  authInputText: '#1A1A2E',
  authInputPlaceholder: '#94A3B8',
  authAccent: '#3B82F6',

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

export const SIZES = {
  // Spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // Font sizes (matching Figma)
  caption: 12,
  small: 13,
  body: 14,
  bodyLarge: 15,
  subtitle: 16,
  title: 18,
  h3: 20,
  h2: 24,
  h1: 28,
  hero: 32,
  display: 36,

  // Border radius (matching Figma)
  radiusXs: 4,
  radiusSm: 8,
  radius: 12,
  radiusLg: 16,
  radiusXl: 25,  // Pill shape for inputs/buttons
  radiusFull: 9999,

  // Border width
  borderWidth: 1,
  borderWidthMedium: 1.5,
  borderWidthThick: 2,

  // Component specific
  inputHeight: 52,
  buttonHeight: 52,
  tabBarHeight: 80,
  headerHeight: 56,
  cardPadding: 16,
  screenPadding: 20,
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Typography presets
export const TYPOGRAPHY = {
  displayLarge: {
    fontSize: SIZES.display,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: SIZES.h1,
    fontWeight: '700',
    color: COLORS.text,
  },
  h2: {
    fontSize: SIZES.h2,
    fontWeight: '600',
    color: COLORS.text,
  },
  h3: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.text,
  },
  title: {
    fontSize: SIZES.title,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '500',
    color: COLORS.text,
  },
  body: {
    fontSize: SIZES.body,
    fontWeight: '400',
    color: COLORS.text,
  },
  bodySecondary: {
    fontSize: SIZES.body,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: SIZES.caption,
    fontWeight: '400',
    color: COLORS.textMuted,
  },
  label: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.text,
  },
  price: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
  },
  priceSmall: {
    fontSize: SIZES.title,
    fontWeight: '600',
    color: COLORS.text,
  },
};
