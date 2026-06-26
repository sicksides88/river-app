import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { formatVesselSubtitle, VESSEL_TYPE_OPTIONS } from '../../utils/vesselForm';

const getVesselIcon = (type) =>
  VESSEL_TYPE_OPTIONS.find((o) => o.id === type)?.icon || 'boat-outline';

const VesselPickerModal = ({
  visible,
  onClose,
  vessels = [],
  activeVesselId,
  onSelect,
  onAddNew,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>Mis embarcaciones</Text>
        <Text style={styles.subtitle}>
          Elegí cuál vas a usar al pedir auxilio. El patrón verá estos datos al asistirte.
        </Text>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {vessels.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="boat-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>
                Todavía no cargaste ninguna embarcación.
              </Text>
            </View>
          ) : (
            vessels.map((vessel) => {
              const selected = vessel.id === activeVesselId;
              return (
                <TouchableOpacity
                  key={vessel.id}
                  style={[styles.item, selected && styles.itemSelected]}
                  activeOpacity={0.85}
                  onPress={() => onSelect(vessel)}
                >
                  <View style={[styles.itemIcon, selected && styles.itemIconSelected]}>
                    <Ionicons
                      name={getVesselIcon(vessel.type)}
                      size={24}
                      color={selected ? COLORS.text : COLORS.textSecondary}
                    />
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {vessel.name}
                    </Text>
                    <Text style={styles.itemMeta} numberOfLines={1}>
                      {formatVesselSubtitle(vessel)}
                    </Text>
                  </View>

                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? (
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={onAddNew}>
            <Ionicons name="add" size={20} color={COLORS.info} />
            <Text style={styles.addBtnText}>Agregar embarcación nueva</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    backgroundColor: COLORS.backgroundSecondary,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    maxHeight: '78%',
    paddingTop: SIZES.sm,
    paddingHorizontal: SIZES.screenPadding,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lightGray,
    marginBottom: SIZES.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: SIZES.h3,
    fontWeight: '700',
    marginBottom: SIZES.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    lineHeight: 20,
    marginBottom: SIZES.lg,
  },
  list: { flexGrow: 0 },
  listContent: { paddingBottom: SIZES.sm },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
    gap: SIZES.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: SIZES.body,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
  },
  itemSelected: {
    borderColor: COLORS.info,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
  },
  itemIcon: {
    width: 52,
    height: 52,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemIconSelected: {
    borderColor: COLORS.borderLight,
  },
  itemInfo: { flex: 1, paddingRight: SIZES.sm },
  itemName: {
    color: COLORS.text,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemMeta: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.info,
    backgroundColor: COLORS.info,
  },
  footer: {
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.sm,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.xs,
    borderWidth: 1.5,
    borderColor: COLORS.info,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md,
    marginBottom: SIZES.sm,
  },
  addBtnText: {
    color: COLORS.info,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
  },
});

export default VesselPickerModal;
