import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/common';
import { TopBar } from '../../components/riverservice';
import { COLORS, SIZES } from '../../constants/theme';

const EmptyStateScreen = ({ navigation, title, message, actionLabel, onAction, icon }) => (
  <SafeAreaView style={styles.container}>
    <TopBar title="" onBack={() => navigation.goBack()} />
    <View style={styles.content}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && <Button title={actionLabel} onPress={onAction} style={styles.btn} />}
    </View>
  </SafeAreaView>
);

export const NoEmbarcacionScreen = ({ navigation }) => (
  <EmptyStateScreen
    navigation={navigation}
    icon="⛵"
    title="Cargá tu primera embarcación"
    message="Sin embarcación cargada no podemos enviarte auxilio. Es un proceso rápido."
    actionLabel="Agregar embarcación"
    onAction={() => navigation.getParent()?.navigate('FleetTab', { screen: 'AddVessel' })}
  />
);

export const NoSocioScreen = ({ navigation }) => (
  <EmptyStateScreen
    navigation={navigation}
    icon="🔒"
    title="Socio requerido"
    message="Tu póliza no está activa o no sos socio. Contactá a tu aseguradora o suscribite a River Service."
    actionLabel="Ver suscripción"
    onAction={() => navigation.navigate('Suscripcion')}
  />
);

export const SinConexionScreen = ({ navigation }) => (
  <EmptyStateScreen
    navigation={navigation}
    icon="📡"
    title="Sin conexión"
    message="El SOS funciona aún sin internet. Tu solicitud se enviará cuando recuperes señal."
    actionLabel="Reintentar"
    onAction={() => navigation.goBack()}
  />
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.xl },
  icon: { fontSize: 48, marginBottom: SIZES.lg },
  title: { color: COLORS.text, fontSize: SIZES.h2, fontWeight: '700', textAlign: 'center' },
  message: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.md, lineHeight: 22 },
  btn: { marginTop: SIZES.xl, width: '100%' },
});

export default NoEmbarcacionScreen;
