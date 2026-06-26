import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/common';
import { COLORS, SIZES } from '../../constants/theme';
import { navigateMainTab } from '../../navigation/rootNavigation';

const CONTACT = {
  phone: '+54 9 11 4823 5500',
  whatsapp: '+5491148235500',
  website: 'https://riverservice.com.ar',
  websiteLabel: 'riverservice.com.ar',
};

const NoSocioScreen = ({ navigation }) => {
  const openPhone = () => Linking.openURL(`tel:${CONTACT.phone.replace(/\s/g, '')}`);
  const openWhatsApp = () => Linking.openURL(`https://wa.me/${CONTACT.whatsapp}`);
  const openWeb = () => Linking.openURL(CONTACT.website);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0B1220', '#0F172A', '#0B1220']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.badge}>
            <Ionicons name="lock-closed" size={28} color={COLORS.warning} />
          </View>
          <Text style={styles.title}>Servicio exclusivo para socios</Text>
          <Text style={styles.message}>
            Para pedir auxilio necesitás una póliza activa o ser socio de River Service.
          </Text>

          <View style={styles.contactCard}>
            <TouchableOpacity style={styles.contactRow} onPress={openPhone}>
              <Ionicons name="call-outline" size={20} color={COLORS.info} />
              <Text style={styles.contactText}>{CONTACT.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactRow} onPress={openWhatsApp}>
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.success} />
              <Text style={styles.contactText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactRow} onPress={openWeb}>
              <Ionicons name="globe-outline" size={20} color={COLORS.info} />
              <Text style={styles.contactText}>{CONTACT.websiteLabel}</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Adherirme ahora"
            onPress={() => {
              navigation.goBack();
              navigateMainTab(navigation, 'ProfileTab', { screen: 'Suscripcion' });
            }}
            style={styles.btn}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

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
  scroll: { padding: SIZES.xl, paddingTop: SIZES.lg },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: SIZES.lg,
  },
  title: { color: COLORS.text, fontSize: SIZES.h2, fontWeight: '700', textAlign: 'center' },
  message: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.md, lineHeight: 22 },
  contactCard: {
    marginTop: SIZES.xl,
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SIZES.sm,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, paddingVertical: SIZES.sm },
  contactText: { color: COLORS.text, fontSize: SIZES.body },
  btn: { marginTop: SIZES.xl },
});

export default NoSocioScreen;
