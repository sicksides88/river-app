import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { membershipService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import {
  SUBSCRIPTION_PLANS,
  formatPlanPrice,
  resolveCurrentPlanId,
  resolveBillingCycle,
  resolveSubscriptionExpiry,
  getPlanById,
} from '../../utils/subscriptionPlans';

const BILLING_CYCLES = [
  { id: 'annual', label: 'Anual' },
  { id: 'monthly', label: 'Mensual' },
];

const SuscripcionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState('annual');
  const [storedBillingCycle, setStoredBillingCycle] = useState('annual');
  const [currentPlanId, setCurrentPlanId] = useState('bronce');
  const [selectedPlanId, setSelectedPlanId] = useState('bronce');
  const [expiryLabel, setExpiryLabel] = useState('—');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const applyMembership = useCallback((membership) => {
    const activePlanId = resolveCurrentPlanId(user, membership);
    const cycle = resolveBillingCycle(membership, user);
    setCurrentPlanId(activePlanId);
    setSelectedPlanId(activePlanId);
    setBillingCycle(cycle);
    setStoredBillingCycle(cycle);
    setExpiryLabel(resolveSubscriptionExpiry(membership, user));
  }, [user]);

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const res = await membershipService.getMembership().catch(() => null);
      applyMembership(res?.membership || null);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [applyMembership]);

  useFocusEffect(
    useCallback(() => {
      loadSubscription();
    }, [loadSubscription])
  );

  const currentPlan = getPlanById(currentPlanId);
  const hasPlanChange = selectedPlanId !== currentPlanId;
  const hasBillingChange = billingCycle !== storedBillingCycle;

  const handleChangePlan = async () => {
    if (!hasPlanChange && !hasBillingChange) {
      Alert.alert('Sin cambios', 'Seleccioná un plan o ciclo distinto para actualizar tu suscripción.');
      return;
    }

    const target = getPlanById(selectedPlanId);
    setSaving(true);
    try {
      const res = await membershipService.setSubscription({
        planId: selectedPlanId,
        billingCycle,
      });
      applyMembership(res?.membership || null);
      Alert.alert(
        'Plan actualizado',
        `Tu plan quedó en ${target.name} (${billingCycle === 'annual' ? 'anual' : 'mensual'}). Es un cambio de demo sin cobro real.`
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'No se pudo guardar el plan. Si es la primera vez, ejecutá river_service_subscription_patch.sql en Supabase.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancelar suscripción',
      '¿Querés volver al plan Bronce? (demo, sin cobro real)',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const res = await membershipService.cancelSubscription();
              applyMembership(res?.membership || null);
              setBillingCycle('annual');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo cancelar la suscripción.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={[styles.topRow, { paddingTop: insets.top + SIZES.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="ribbon" size={28} color="#0B1220" />
          </View>
          <Text style={styles.heroTitle}>Plan {currentPlan.name}</Text>
          <Text style={styles.heroStatus}>Activo · vence el {expiryLabel}</Text>
        </View>

        <View style={styles.cycleToggle}>
          {BILLING_CYCLES.map((cycle) => {
            const active = billingCycle === cycle.id;
            return (
              <TouchableOpacity
                key={cycle.id}
                style={[styles.cycleBtn, active && styles.cycleBtnActive]}
                onPress={() => setBillingCycle(cycle.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.cycleBtnText, active && styles.cycleBtnTextActive]}>
                  {cycle.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.brandBlue} />
          </View>
        ) : (
          <View style={styles.planList}>
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isPendingSelection = plan.id === selectedPlanId && !isCurrent;
              const price =
                billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planRow, isPendingSelection && styles.planRowSelected]}
                  onPress={() => setSelectedPlanId(plan.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.planRowText}>
                    <View style={styles.planNameRow}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {isCurrent ? (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Plan activo</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
                  </View>
                  <Text style={styles.planPrice}>
                    {formatPlanPrice(price, billingCycle)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[styles.changeBtn, saving && styles.changeBtnDisabled]}
          onPress={handleChangePlan}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.brandBlue} />
          ) : (
            <Text style={styles.changeBtnText}>Cambiar plan</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelLink}
          onPress={handleCancelSubscription}
          activeOpacity={0.75}
        >
          <Text style={styles.cancelLinkText}>Cancelar suscripción</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  },
  heroCard: {
    backgroundColor: COLORS.brandBlue,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.lg,
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(11, 18, 32, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  heroTitle: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: '#0B1220',
    marginBottom: 4,
  },
  heroStatus: {
    fontSize: SIZES.body,
    color: 'rgba(11, 18, 32, 0.75)',
  },
  cycleToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radiusFull,
    padding: 4,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  cycleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: SIZES.radiusFull,
  },
  cycleBtnActive: {
    backgroundColor: COLORS.brandBlue,
  },
  cycleBtnText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  cycleBtnTextActive: {
    color: '#0B1220',
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: SIZES.xl,
    alignItems: 'center',
  },
  planList: {
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SIZES.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1.5,
    borderColor: COLORS.borderDark,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
  },
  planRowSelected: {
    borderColor: COLORS.brandBlue,
    backgroundColor: COLORS.brandBlueMuted,
  },
  planRowText: {
    flex: 1,
    minWidth: 0,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SIZES.sm,
    marginBottom: 4,
  },
  planName: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
  },
  activeBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.brandBlueMuted,
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.35)',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brandBlue,
    letterSpacing: 0.2,
  },
  planSubtitle: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  planPrice: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.brandBlue,
    textAlign: 'right',
    flexShrink: 0,
  },
  changeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SIZES.buttonHeight,
    borderRadius: SIZES.radiusLg,
    backgroundColor: '#152238',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.45)',
    marginBottom: SIZES.md,
  },
  changeBtnDisabled: {
    opacity: 0.7,
  },
  changeBtnText: {
    color: COLORS.brandBlue,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  cancelLinkText: {
    color: COLORS.brandBlue,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default SuscripcionScreen;
