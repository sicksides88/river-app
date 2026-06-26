import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const RiderPhotoCaptureBox = ({ onPress, captured, label = 'Tomar foto', hint = 'o tocá para abrir cámara' }) => (
  <TouchableOpacity style={styles.box} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.iconCircle}>
      <Ionicons name="camera-outline" size={28} color={COLORS.riderBlue} />
    </View>
    <Text style={styles.label}>{captured ? 'Foto cargada · tocar para cambiar' : label}</Text>
    {!captured ? <Text style={styles.hint}>{hint}</Text> : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.riderCardElevated,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xxl,
    alignItems: 'center',
    gap: SIZES.sm,
    marginBottom: SIZES.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.riderBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.xs,
  },
  label: { color: COLORS.riderBlue, fontWeight: '700', fontSize: SIZES.body },
  hint: { color: COLORS.textMuted, fontSize: SIZES.caption },
});

export default RiderPhotoCaptureBox;
