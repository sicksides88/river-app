// River Service — tema náutico (teal / dark)
export const COLORS = {
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',
  primaryAccent: '#2DD4BF',
  primaryTint: '#CCFBF1',
  primaryTintStrong: '#99F6E4',

  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textLight: '#475569',
  textOnLight: '#0F172A',

  background: '#0B1220',
  backgroundSecondary: '#111827',
  backgroundTertiary: '#1E293B',
  backgroundInput: '#1E293B',
  backgroundCard: 'rgba(30, 41, 59, 0.85)',

  border: '#334155',
  borderLight: '#1E293B',
  borderDark: '#0F172A',

  success: '#22C55E',
  successDark: '#15803D',
  successLight: '#DCFCE7',
  successBorder: '#86EFAC',

  error: '#EF4444',
  errorDark: '#DC2626',
  errorLight: '#FEE2E2',
  errorBorder: '#FECACA',
  errorText: '#FCA5A5',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningBorder: '#FDE68A',

  info: '#38BDF8',
  infoLight: '#E0F2FE',
  brandBlue: '#4285F4',
  brandBlueMuted: 'rgba(66, 133, 244, 0.12)',

  accent: '#FBBF24',
  accentOrange: '#F97316',
  sos: '#DC2626',
  sosGlow: 'rgba(220, 38, 38, 0.35)',

  star: '#FBBF24',

  white: '#FFFFFF',
  black: '#000000',
  gray: '#64748B',
  lightGray: '#334155',
  darkGray: '#1E293B',

  markerOrigin: '#0D9488',
  markerDestination: '#EF4444',
  routeLine: '#14B8A6',

  authBackground: '#0B1220',
  authText: '#F8FAFC',
  authTextSecondary: '#94A3B8',
  authInputBg: '#1E293B',
  authInputBorder: '#334155',
  authInputText: '#F8FAFC',
  authInputPlaceholder: '#64748B',
  authAccent: '#14B8A6',

  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.35)',
  glass: 'rgba(15, 23, 42, 0.72)',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

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

  radiusXs: 4,
  radiusSm: 8,
  radius: 12,
  radiusLg: 16,
  radiusXl: 25,
  radiusFull: 9999,

  borderWidth: 1,
  borderWidthMedium: 1.5,
  borderWidthThick: 2,

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
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  sos: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
};

export const TYPOGRAPHY = {
  displayLarge: {
    fontSize: SIZES.display,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  h1: { fontSize: SIZES.h1, fontWeight: '700', color: COLORS.text },
  h2: { fontSize: SIZES.h2, fontWeight: '600', color: COLORS.text },
  h3: { fontSize: SIZES.h3, fontWeight: '600', color: COLORS.text },
  title: { fontSize: SIZES.title, fontWeight: '600', color: COLORS.text },
  subtitle: { fontSize: SIZES.subtitle, fontWeight: '500', color: COLORS.text },
  body: { fontSize: SIZES.body, fontWeight: '400', color: COLORS.text },
  bodySecondary: { fontSize: SIZES.body, fontWeight: '400', color: COLORS.textSecondary },
  caption: { fontSize: SIZES.caption, fontWeight: '400', color: COLORS.textMuted },
  label: { fontSize: SIZES.small, fontWeight: '500', color: COLORS.text },
};

// Estados del auxilio náutico
export const AUXILIO_STATES = {
  solicitado: { label: 'Solicitado', order: 0 },
  buscando: { label: 'Buscando patrón', order: 1 },
  asignado: { label: 'Patrón asignado', order: 2 },
  arribado: { label: 'Patrón arribado', order: 3 },
  zarpado: { label: 'Zarpado', order: 4 },
  en_proceso: { label: 'En proceso', order: 5 },
  finalizado: { label: 'Finalizado', order: 6 },
  rechazado: { label: 'Rechazado', order: -1 },
  cancelado: { label: 'Cancelado', order: -1 },
};

export const EMERGENCY_TYPES = [
  {
    id: 'amarrado_fondeado',
    label: 'Amarrado / fondeado',
    subtitle: 'En muelle o anclado sin zarpar',
    icon: 'anchor',
    iconFamily: 'material',
    grid: true,
  },
  {
    id: 'al_garete',
    label: 'Al garete',
    subtitle: 'A la deriva',
    icon: 'weather-windy',
    iconFamily: 'material',
    grid: true,
  },
  {
    id: 'varado',
    label: 'Varado',
    subtitle: 'Encallado o varadura',
    icon: 'lifebuoy',
    iconFamily: 'material',
    grid: true,
  },
  {
    id: 'via_agua',
    label: 'Vía de agua',
    subtitle: 'Peligro inminente',
    icon: 'water-alert',
    iconFamily: 'material',
    danger: true,
    grid: true,
  },
  {
    id: 'salud',
    label: 'Emergencia de salud',
    subtitle: 'Asistencia médica urgente a bordo',
    icon: 'heart-pulse',
    iconFamily: 'material',
    danger: true,
    grid: false,
  },
];

export const EMERGENCY_GRID_OPTIONS = EMERGENCY_TYPES.filter((t) => t.grid);
export const EMERGENCY_HEALTH_OPTION = EMERGENCY_TYPES.find((t) => t.id === 'salud');

export const FAILURE_CHIPS = [
  'Sin batería',
  'Sin combustible',
  'Sin motor',
  'Otro / no sé',
];
