import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions } from '@react-navigation/native';
import { COLORS, SIZES } from '../../constants/theme';
import {
  DEFAULT_ASSIGNMENT_FAILURE_REASON,
  OPERATOR_CONTACT,
  resolveAuxilioRejectionReason,
} from '../../utils/auxilioRejection';

const AuxilioRechazadoScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { auxilio, reason } = route.params || {};
  const rejectionReason = resolveAuxilioRejectionReason(auxilio, reason);

  const goHome = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
    );
  };

  const handleCallOperator = () => {
    Linking.openURL(`tel:${OPERATOR_CONTACT.phoneDial}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0B1220', '#0F172A', '#0B1220']} style={StyleSheet.absoluteFill} />
      <View style={styles.glow} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.backBtn} onPress={goHome}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, SIZES.lg) + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrap}>
            <View style={styles.iconSquare}>
              <View style={styles.iconCircle}>
                <Ionicons name="close" size={28} color={COLORS.white} />
              </View>
            </View>
          </View>

          <Text style={styles.title}>Tu pedido no pudo asignarse</Text>
          <Text style={styles.description}>
            El operador de auxilio no encontró una tripulación disponible en este momento. Te
            vamos a contactar por teléfono para resolverlo.
          </Text>

          <View style={styles.reasonCard}>
            <Text style={styles.reasonLabel}>MOTIVO DEL RECHAZO</Text>
            <Text style={styles.reasonText}>
              {rejectionReason || DEFAULT_ASSIGNMENT_FAILURE_REASON}
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SIZES.md) }]}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleCallOperator}>
            <Text style={styles.primaryBtnText}>Llamar al operador</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={goHome}>
            <Text style={styles.secondaryBtnText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  glow: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.screenPadding,
    marginTop: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: SIZES.xl,
    marginTop: SIZES.lg,
  },
  iconSquare: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: 'rgba(127, 29, 29, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(248, 113, 113, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: SIZES.md,
  },
  description: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.xxl,
    maxWidth: 340,
  },
  reasonCard: {
    width: '100%',
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.lg,
    marginTop: 'auto',
  },
  reasonLabel: {
    fontSize: SIZES.small,
    fontWeight: '700',
    color: COLORS.error,
    letterSpacing: 0.8,
    marginBottom: SIZES.sm,
  },
  reasonText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    backgroundColor: 'rgba(11, 18, 32, 0.94)',
  },
  primaryBtn: {
    backgroundColor: COLORS.info,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md + 2,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
    marginTop: SIZES.xs,
  },
  secondaryBtnText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.info,
  },
});

export default AuxilioRechazadoScreen;
