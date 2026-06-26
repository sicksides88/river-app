import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiderScreenShell, RiderPrimaryButton } from '../../components/rider';
import { COLORS, SIZES } from '../../constants/theme';

const OfflineScreen = ({ navigation }) => (
  <RiderScreenShell title="Sin conexión" onBack={() => navigation.goBack()}>
    <View style={styles.content}>
      <View style={styles.iconWrap}>
        <Ionicons name="cloud-offline-outline" size={48} color={COLORS.riderBlue} />
      </View>
      <Text style={styles.title}>Sin señal</Text>
      <Text style={styles.message}>
        No hay conexión a internet. Activá EN GUARDIA cuando recuperes señal para recibir auxilios náuticos.
      </Text>
      <RiderPrimaryButton title="Reintentar" onPress={() => navigation.goBack()} style={styles.btn} />
    </View>
  </RiderScreenShell>
);

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.xl },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.riderCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { color: COLORS.text, fontSize: SIZES.h2, fontWeight: '700', textAlign: 'center' },
  message: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.md, lineHeight: 22 },
  btn: { marginTop: SIZES.xl, alignSelf: 'stretch' },
});

export default OfflineScreen;
