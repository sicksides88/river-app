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
import { vesselService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import {
  getFleetTechnicalRows,
  getVesselTypeIcon,
} from '../../utils/vesselForm';

const FleetDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { vessel: initialVessel, vesselId } = route.params || {};
  const [vessel, setVessel] = useState(initialVessel || null);
  const [activeVesselId, setActiveVesselId] = useState(route.params?.activeVesselId || null);
  const [loading, setLoading] = useState(!initialVessel);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      let current = initialVessel;
      if (vesselId) {
        const res = await vesselService.getVesselById(vesselId);
        current = res.vessel || current;
      }
      setVessel(current);
      const activeId = await vesselService.getActiveVesselId();
      setActiveVesselId(activeId);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [initialVessel, vesselId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const isActive = vessel?.id && vessel.id === activeVesselId;
  const iconName = getVesselTypeIcon(vessel?.type);
  const technicalRows = getFleetTechnicalRows(vessel);

  const handleSetActive = async () => {
    if (!vessel?.id || isActive) return;
    setActionLoading(true);
    try {
      await vesselService.setActiveVesselId(vessel.id);
      setActiveVesselId(vessel.id);
      Alert.alert('Embarcación activa', `${vessel.name} quedó seleccionada para pedir auxilio.`);
    } catch {
      Alert.alert('Error', 'No se pudo establecer la embarcación activa.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    if (!vessel?.id) return;
    Alert.alert(
      'Eliminar embarcación',
      `¿Confirmás que querés eliminar "${vessel.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await vesselService.deleteVessel(vessel.id);
              if (activeVesselId === vessel.id) {
                await vesselService.clearActiveVesselId();
              }
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la embarcación.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('AddVessel', { vessel, vesselId: vessel?.id, mode: 'edit' });
  };

  if (loading && !vessel) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.info} />
      </View>
    );
  }

  if (!vessel) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>No se encontró la embarcación.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de embarcación</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleEdit}>
          <Ionicons name="pencil-outline" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, SIZES.lg) + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name={iconName} size={28} color={COLORS.text} />
          </View>
          <View style={styles.summaryBody}>
            <Text style={styles.vesselName}>{vessel.name}</Text>
            {isActive ? (
              <View style={styles.activeRow}>
                <View style={styles.activeDot} />
                <Text style={styles.activeLabel}>EMBARCACIÓN ACTIVA</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionLabel}>DATOS TÉCNICOS</Text>
        <View style={styles.techCard}>
          {technicalRows.map(([label, value], index) => (
            <View
              key={label}
              style={[styles.techRow, index < technicalRows.length - 1 && styles.techRowBorder]}
            >
              <Text style={styles.techLabel}>{label}</Text>
              <Text style={styles.techValue}>{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SIZES.md) }]}>
        {!isActive ? (
          <TouchableOpacity
            style={[styles.primaryBtn, actionLoading && styles.btnDisabled]}
            onPress={handleSetActive}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.info} />
            ) : (
              <Text style={styles.primaryBtnText}>Establecer como activa</Text>
            )}
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={actionLoading}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          <Text style={styles.deleteBtnText}>Eliminar embarcación</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: '700',
    paddingHorizontal: SIZES.xs,
  },
  scroll: { paddingHorizontal: SIZES.screenPadding },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radiusMd,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  summaryBody: { flex: 1 },
  vesselName: {
    color: COLORS.text,
    fontSize: SIZES.h2,
    fontWeight: '700',
    marginBottom: SIZES.sm,
  },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.info,
  },
  activeLabel: {
    color: COLORS.info,
    fontSize: SIZES.small,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    color: COLORS.info,
    fontSize: SIZES.small,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: SIZES.sm,
  },
  techCard: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    gap: SIZES.md,
  },
  techRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  techLabel: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    flex: 1,
  },
  techValue: {
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    backgroundColor: 'rgba(11, 18, 32, 0.96)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SIZES.sm,
  },
  primaryBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.info,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.info,
    fontSize: SIZES.body,
    fontWeight: '700',
  },
  btnDisabled: { opacity: 0.6 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.xs,
    paddingVertical: SIZES.sm,
  },
  deleteBtnText: {
    color: COLORS.error,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  errorText: { color: COLORS.textSecondary, marginBottom: SIZES.md },
  linkText: { color: COLORS.info, fontWeight: '600' },
});

export default FleetDetailScreen;
