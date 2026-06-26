import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopBar, GlassCard } from '../../components/riverservice';
import { COLORS, SIZES } from '../../constants/theme';

const FAQ = [
  { q: '¿Cómo pedir auxilio?', a: 'Desde Inicio, tocá el botón SOS y seguí los 3 pasos.' },
  { q: '¿Cómo cargar embarcación?', a: 'Andá a Flota y tocá el botón + para agregar tu embarcación.' },
  { q: '¿Funciona sin señal?', a: 'Próximamente podrás solicitar auxilio offline; se enviará al recuperar conexión.' },
];

const AyudaScreen = ({ navigation }) => (
  <SafeAreaView style={styles.container} edges={['bottom']}>
    <TopBar title="Ayuda" onBack={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={styles.content}>
      {FAQ.map((item) => (
        <GlassCard key={item.q} style={styles.card}>
          <Text style={styles.q}>{item.q}</Text>
          <Text style={styles.a}>{item.a}</Text>
        </GlassCard>
      ))}
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.screenPadding },
  card: { marginBottom: SIZES.md },
  q: { color: COLORS.text, fontWeight: '600', marginBottom: SIZES.sm },
  a: { color: COLORS.textSecondary, lineHeight: 20 },
});

export default AyudaScreen;
