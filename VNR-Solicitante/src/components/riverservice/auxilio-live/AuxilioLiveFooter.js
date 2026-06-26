import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../../../constants/theme';

const AuxilioLiveFooter = ({ status, onCancel, onReport, loading, simulating }) => {
  if (['finalizado', 'cancelado', 'rechazado'].includes(status)) return null;

  if (simulating && !['arribado', 'en_proceso'].includes(status)) return null;

  if (['arribado', 'en_proceso'].includes(status)) {
    return (
      <TouchableOpacity style={styles.reportBtn} onPress={onReport} disabled={loading}>
        <Text style={styles.reportText}>Reportar problema</Text>
      </TouchableOpacity>
    );
  }

  const isZarpado = status === 'zarpado';

  return (
    <TouchableOpacity
      style={[styles.cancelBtn, isZarpado && styles.cancelBtnBlue]}
      onPress={onCancel}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={isZarpado ? COLORS.info : COLORS.error} />
      ) : (
        <Text style={[styles.cancelText, isZarpado && styles.cancelTextBlue]}>
          Cancelar solicitud
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.error,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    marginTop: SIZES.sm,
  },
  cancelBtnBlue: { borderColor: COLORS.info },
  cancelText: { color: COLORS.error, fontSize: SIZES.subtitle, fontWeight: '700' },
  cancelTextBlue: { color: COLORS.info },
  reportBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.info,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    marginTop: SIZES.sm,
  },
  reportText: { color: COLORS.info, fontSize: SIZES.subtitle, fontWeight: '700' },
});

export default AuxilioLiveFooter;
