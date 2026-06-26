import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { RiderScreenShell, RiderPrimaryButton } from '../../components/rider';
import { pickActiveDriverAuxilio } from '../../utils/riderActiveAuxilio';
import { isSimulationAuxilio } from '../../constants/demoAuxilio';
import { COLORS, SIZES } from '../../constants/theme';

const RiderServicioHubScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [activeAuxilio, setActiveAuxilio] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auxilioService.getUserAuxilios({ role: 'driver' });
      const active = pickActiveDriverAuxilio(res.auxilios || []);
      setActiveAuxilio(active);
      if (active) {
        navigation.replace('ServicioActivo', {
          auxilioId: active.id,
          auxilio: active,
          simulation: isSimulationAuxilio(active),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.riderBlue} />
      </View>
    );
  }

  return (
    <RiderScreenShell title="Servicio">
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="help-buoy-outline" size={48} color={COLORS.riderBlue} />
        </View>
        <Text style={styles.title}>Sin servicio activo</Text>
        <Text style={styles.message}>
          Cuando aceptes un auxilio desde Guardia, el servicio en curso aparecerá acá automáticamente.
        </Text>
        <RiderPrimaryButton
          title="Ir a Guardia"
          onPress={() => navigation.getParent()?.navigate('RiderGuardiaTab')}
          style={styles.btn}
        />
      </View>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.riderNavy },
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

export default RiderServicioHubScreen;
