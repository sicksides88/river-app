import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiderScreenShell, RiderPrimaryButton } from '../../components/rider';
import { COLORS, SIZES } from '../../constants/theme';

const COPY = {
  no_schedule: {
    title: 'Configurá tu disponibilidad',
    message:
      'No tenés horarios de guardia definidos. Indicá tu semana tipo en Agenda para poder activar EN GUARDIA y recibir auxilios.',
  },
  outside_window: {
    title: 'Fuera de tu horario',
    message:
      'Ahora no estás dentro de tu ventana de disponibilidad. Ajustá tu agenda o esperá al próximo horario configurado.',
  },
  no_patrol_shift: {
    title: 'Sin turno asignado',
    message:
      'River Service no te asignó un turno de guardia para este horario. Consultá tus turnos en Agenda.',
  },
};

const SinTurnoScreen = ({ navigation, route }) => {
  const reason = ['no_schedule', 'outside_window', 'no_patrol_shift'].includes(route.params?.reason)
    ? route.params.reason
    : 'outside_window';
  const copy = COPY[reason];

  const goToDisponibilidad = () => {
    navigation.getParent()?.navigate('RiderAgendaTab', { screen: 'RiderDisponibilidad' });
  };

  return (
    <RiderScreenShell title="Sin turno activo" onBack={() => navigation.goBack()}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="calendar-outline" size={48} color={COLORS.riderOrange} />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.message}>{copy.message}</Text>
        <RiderPrimaryButton
          title="Configurar disponibilidad"
          onPress={goToDisponibilidad}
          style={styles.btn}
        />
        <RiderPrimaryButton
          title="Ver mis turnos"
          variant="outline"
          onPress={() => navigation.getParent()?.navigate('RiderAgendaTab')}
          style={styles.btn}
        />
        <RiderPrimaryButton
          title="Volver al inicio"
          variant="outline"
          onPress={() => navigation.getParent()?.navigate('RiderGuardiaTab')}
        />
      </View>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.xl },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.riderOrangeMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  title: { color: COLORS.text, fontSize: SIZES.h2, fontWeight: '700', textAlign: 'center' },
  message: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.md, lineHeight: 22 },
  btn: { marginTop: SIZES.lg, marginBottom: SIZES.sm, alignSelf: 'stretch' },
});

export default SinTurnoScreen;
