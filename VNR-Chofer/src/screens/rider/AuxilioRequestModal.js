import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, EMERGENCY_TYPES } from '../../constants/theme';
import { VesselInfoBlock, SolicitanteInfoBlock } from '../../components/riverservice';
import { RiderPrimaryButton, RiderEmergencyBanner } from '../../components/rider';

const getEmergencyLabel = (type) =>
  EMERGENCY_TYPES.find((e) => e.id === type)?.label || type || 'Auxilio náutico';

const AuxilioRequestModal = ({ visible, auxilio, onAccept, onReject, onClose }) => {
  if (!auxilio) return null;

  const lat = auxilio.pickup?.coordinates?.lat ?? auxilio.pickup?.lat;
  const lng = auxilio.pickup?.coordinates?.lng ?? auxilio.pickup?.lng;
  const address =
    auxilio.pickup?.address ||
    (lat ? `Lat ${lat.toFixed(4)}, Lng ${lng?.toFixed(4)}` : 'Ubicación del auxilio');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Ionicons name="boat" size={16} color={COLORS.riderBlue} />
              <Text style={styles.badgeText}>Nuevo auxilio</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={26} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <RiderEmergencyBanner label={getEmergencyLabel(auxilio.emergencyType)} compact />

          <VesselInfoBlock auxilio={auxilio} compact style={styles.block} />
          <SolicitanteInfoBlock auxilio={auxilio} compact style={styles.block} />

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.riderBlue} />
            <Text style={styles.address} numberOfLines={2}>
              {address}
            </Text>
          </View>

          {auxilio.failureTypes?.length > 0 && (
            <Text style={styles.failures}>Fallas: {auxilio.failureTypes.join(', ')}</Text>
          )}

          <View style={styles.actions}>
            <RiderPrimaryButton title="Rechazar" variant="outline" onPress={onReject} style={styles.actionBtn} />
            <RiderPrimaryButton title="Ver detalle" onPress={onAccept} style={styles.actionBtn} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
    padding: SIZES.md,
    paddingBottom: SIZES.xl,
  },
  card: {
    backgroundColor: COLORS.riderNavy,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.riderCard,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    gap: 6,
  },
  badgeText: { color: COLORS.riderBlue, fontSize: SIZES.small, fontWeight: '600' },
  block: { marginBottom: SIZES.md },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.md, gap: SIZES.sm },
  address: { flex: 1, color: COLORS.text, fontSize: SIZES.body, lineHeight: 20 },
  failures: { color: COLORS.textMuted, fontSize: SIZES.small, marginBottom: SIZES.lg },
  actions: { flexDirection: 'row', gap: SIZES.sm },
  actionBtn: { flex: 1 },
});

export default AuxilioRequestModal;
