import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/common';
import { COLORS, SIZES } from '../../constants/theme';
import { navigateMainTab } from '../../navigation/rootNavigation';

const NoEmbarcacionScreen = ({ navigation }) => (
  <View style={styles.container}>
    <LinearGradient colors={['#0B1220', '#0F172A', '#0B1220']} style={StyleSheet.absoluteFill} />
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={22} color={COLORS.text} />
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.icon}>⛵</Text>
        <Text style={styles.title}>Cargá tu primera embarcación</Text>
        <Text style={styles.message}>
          Sin embarcación cargada no podemos enviarte auxilio. Es un proceso rápido.
        </Text>
        <Button
          title="Agregar embarcación"
          onPress={() => {
            navigation.goBack();
            navigateMainTab(navigation, 'FleetTab', { screen: 'AddVessel' });
          }}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.screenPadding,
    marginTop: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.xl },
  icon: { fontSize: 48, marginBottom: SIZES.lg },
  title: { color: COLORS.text, fontSize: SIZES.h2, fontWeight: '700', textAlign: 'center' },
  message: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.md, lineHeight: 22 },
  btn: { marginTop: SIZES.xl, width: '100%' },
});

export default NoEmbarcacionScreen;
