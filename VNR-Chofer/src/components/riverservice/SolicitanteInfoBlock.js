import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const resolveSolicitante = (auxilio) => {
  if (!auxilio) return null;
  const raw =
    auxilio.solicitante ||
    auxilio.user ||
    auxilio.passenger ||
    auxilio.ride?.user;

  if (!raw) return null;

  const name =
    raw.name ||
    [raw.nombre, raw.apellido].filter(Boolean).join(' ').trim() ||
    null;

  return {
    id: raw.id,
    name,
    phone: raw.phone || raw.telefono_numero || raw.telefono,
    email: raw.email,
  };
};

const SolicitanteInfoBlock = ({ auxilio, solicitante: solicitanteProp, compact = false, style }) => {
  const solicitante = solicitanteProp || resolveSolicitante(auxilio);
  if (!solicitante?.name && !solicitante?.phone && !solicitante?.email) return null;

  const callPhone = () => {
    if (!solicitante.phone) return;
    Linking.openURL(`tel:${solicitante.phone}`);
  };

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconBox}>
        <Ionicons name="person" size={compact ? 20 : 24} color={COLORS.text} />
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Navegante</Text>
        {solicitante.name ? (
          <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
            {solicitante.name}
          </Text>
        ) : null}
        {solicitante.phone ? (
          <TouchableOpacity onPress={callPhone} style={styles.row}>
            <Ionicons name="call-outline" size={14} color={COLORS.primaryAccent} />
            <Text style={styles.link}>{solicitante.phone}</Text>
          </TouchableOpacity>
        ) : null}
        {solicitante.email ? (
          <Text style={styles.detail} numberOfLines={1}>
            {solicitante.email}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  info: { flex: 1 },
  label: {
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    fontWeight: '600',
    marginBottom: 2,
  },
  name: {
    color: COLORS.text,
    fontSize: SIZES.title,
    fontWeight: '700',
    marginBottom: 4,
  },
  nameCompact: {
    fontSize: SIZES.subtitle,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  link: {
    color: COLORS.primaryAccent,
    fontSize: SIZES.caption,
    fontWeight: '600',
  },
  detail: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
    lineHeight: 18,
  },
});

export default SolicitanteInfoBlock;
