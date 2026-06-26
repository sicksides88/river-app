import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { auxilioService, membershipService } from '../../services';
import { OnboardingAseguradoraScreen } from '../onboarding/riverservice';
import { COLORS, SIZES } from '../../constants/theme';
import {
  hasInsuranceProfileData,
  getInsuranceCompanyLogoLabel,
  formatPolicyDisplay,
  formatPolicyValidity,
  computeInsuranceCoverageUsage,
  formatCoverageValue,
} from '../../utils/insuranceProfile';

const CoverageBar = ({ label, used, limit, unit = '' }) => {
  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;

  return (
    <View style={styles.coverageItem}>
      <View style={styles.coverageHeader}>
        <Text style={styles.coverageLabel}>{label}</Text>
        <Text style={styles.coverageValue}>{formatCoverageValue(used, limit, unit)}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
};

const AseguradoraDetailView = ({ membership, coverage, onBack }) => {
  const insets = useSafeAreaInsets();
  const company = membership?.insurance_company || '—';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={[styles.topRow, { paddingTop: insets.top + SIZES.sm }]}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.companyCard}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>{getInsuranceCompanyLogoLabel(company)}</Text>
          </View>
          <Text style={styles.companyName}>{company}</Text>
          <Text style={styles.policyLine}>{formatPolicyDisplay(membership?.policy_number)}</Text>
          <Text style={styles.validityLine}>
            {formatPolicyValidity(membership?.policy_expiry_date)}
          </Text>
        </View>

        <View style={styles.limitsCard}>
          <Text style={styles.limitsTitle}>LÍMITES DE COBERTURA</Text>
          <Text style={styles.limitsHint}>
            Plan por servicios y horas — se descuenta lo que se agote primero.
          </Text>

          <CoverageBar
            label="Servicios anuales"
            used={coverage.servicesUsed}
            limit={coverage.servicesLimit}
          />
          <CoverageBar
            label="Horas de remolque"
            used={coverage.hoursUsed}
            limit={coverage.hoursLimit}
            unit="hs"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const AseguradoraScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState(null);
  const [coverage, setCoverage] = useState({
    servicesUsed: 0,
    servicesLimit: 8,
    hoursUsed: 0,
    hoursLimit: 20,
  });
  const [showForm, setShowForm] = useState(false);

  const loadInsurance = useCallback(async () => {
    setLoading(true);
    try {
      const [membershipRes, auxRes] = await Promise.all([
        membershipService.getMembership().catch(() => null),
        auxilioService.getUserAuxilios().catch(() => ({ auxilios: [] })),
      ]);

      const membershipData = membershipRes?.membership || null;
      setMembership(membershipData);
      setCoverage(computeInsuranceCoverageUsage(auxRes?.auxilios || []));
      setShowForm(!hasInsuranceProfileData(membershipData, user));
    } catch (error) {
      console.error('Error loading insurance profile:', error);
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadInsurance();
    }, [loadInsurance])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.info} />
      </View>
    );
  }

  if (showForm) {
    return (
      <OnboardingAseguradoraScreen
        navigation={navigation}
        route={{ params: { fromProfile: true, returnTo: 'Aseguradora' } }}
      />
    );
  }

  return (
    <AseguradoraDetailView
      membership={membership}
      coverage={coverage}
      onBack={() => navigation.goBack()}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  topRow: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
    gap: SIZES.md,
  },
  companyCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.lg,
    alignItems: 'center',
  },
  logoBox: {
    minWidth: 120,
    minHeight: 72,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
  },
  logoText: {
    color: COLORS.info,
    fontSize: SIZES.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  companyName: {
    color: COLORS.text,
    fontSize: SIZES.h3,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  policyLine: {
    color: COLORS.info,
    fontSize: SIZES.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  validityLine: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
    textAlign: 'center',
  },
  limitsCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: SIZES.md,
    gap: SIZES.md,
  },
  limitsTitle: {
    color: COLORS.info,
    fontSize: SIZES.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  limitsHint: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
    lineHeight: 18,
    marginBottom: SIZES.xs,
  },
  coverageItem: {
    gap: SIZES.sm,
  },
  coverageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SIZES.md,
  },
  coverageLabel: {
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: '600',
    flex: 1,
  },
  coverageValue: {
    color: COLORS.info,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.backgroundTertiary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.info,
  },
});

export default AseguradoraScreen;
