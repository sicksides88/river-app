import { StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from './theme';

export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerPadded: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.md,
  },
  containerCentered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerWhite: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    ...SHADOWS.md,
  },

  // Text
  textTitle: {
    fontSize: SIZES.title,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  textSubtitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.dark,
  },
  textBody: {
    fontSize: SIZES.body,
    color: COLORS.gray,
  },
  textCaption: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  textWhite: {
    color: COLORS.white,
  },
  textPrimary: {
    color: COLORS.primary,
  },
  textCenter: {
    textAlign: 'center',
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm + 4,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: COLORS.white,
    fontSize: SIZES.subtitle,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: SIZES.sm + 4,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    color: COLORS.primary,
    fontSize: SIZES.subtitle,
    fontWeight: '600',
  },

  // Inputs
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    fontSize: SIZES.body,
    color: COLORS.dark,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  inputLabel: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: SIZES.xs,
  },
  inputErrorText: {
    fontSize: SIZES.caption,
    color: COLORS.danger,
    marginTop: SIZES.xs,
  },

  // Flex helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },

  // Spacing
  mt_xs: { marginTop: SIZES.xs },
  mt_sm: { marginTop: SIZES.sm },
  mt_md: { marginTop: SIZES.md },
  mt_lg: { marginTop: SIZES.lg },
  mt_xl: { marginTop: SIZES.xl },
  mb_xs: { marginBottom: SIZES.xs },
  mb_sm: { marginBottom: SIZES.sm },
  mb_md: { marginBottom: SIZES.md },
  mb_lg: { marginBottom: SIZES.lg },
  mb_xl: { marginBottom: SIZES.xl },
  p_sm: { padding: SIZES.sm },
  p_md: { padding: SIZES.md },
  p_lg: { padding: SIZES.lg },
  ph_md: { paddingHorizontal: SIZES.md },
  pv_md: { paddingVertical: SIZES.md },
});

export default globalStyles;
