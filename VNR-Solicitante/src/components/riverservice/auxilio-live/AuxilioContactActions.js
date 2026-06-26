import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../../constants/theme';

const AuxilioContactActions = ({ driver, onMessage }) => {
  const phone = driver?.phone?.replace(/\s/g, '');

  const call = () => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.btn} onPress={call} disabled={!phone}>
        <Ionicons name="call-outline" size={20} color={COLORS.info} />
        <Text style={styles.btnText}>Llamar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={onMessage}>
        <Ionicons name="chatbubble-outline" size={20} color={COLORS.info} />
        <Text style={styles.btnText}>Mensaje</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.md },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnText: { color: COLORS.text, fontSize: SIZES.body, fontWeight: '600' },
});

export default AuxilioContactActions;
