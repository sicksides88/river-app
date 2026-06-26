import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../common';
import { COLORS, SIZES } from '../../constants/theme';

const CONTACT = {
  phone: '+54 9 11 4823 5500',
  whatsapp: '+5491148235500',
  website: 'https://riverservice.com.ar',
  websiteLabel: 'riverservice.com.ar',
};

const NoSocioModal = ({ visible, onClose, onJoin }) => {
  const openPhone = () => Linking.openURL(`tel:${CONTACT.phone.replace(/\s/g, '')}`);
  const openWhatsApp = () => Linking.openURL(`https://wa.me/${CONTACT.whatsapp}`);
  const openWeb = () => Linking.openURL(CONTACT.website);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#0B1220', '#0F172A', '#0B1220']}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroIcon}>
              <Ionicons name="boat" size={44} color={COLORS.white} />
            </View>

            <Text style={styles.title}>Servicio exclusivo para socios</Text>
            <Text style={styles.description}>
              El auxilio náutico de River Service es un servicio privado, disponible para
              navegantes adheridos directamente o a través de una compañía de seguros asociada.
            </Text>

            <View style={styles.contactCard}>
              <Text style={styles.contactLabel}>DATOS DE CONTACTO</Text>

              <TouchableOpacity style={styles.contactRow} onPress={openPhone}>
                <View style={styles.contactIcon}>
                  <Ionicons name="call-outline" size={18} color={COLORS.info} />
                </View>
                <View style={styles.contactText}>
                  <Text style={styles.contactTitle}>Teléfono</Text>
                  <Text style={styles.contactValue}>{CONTACT.phone}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactRow} onPress={openWhatsApp}>
                <View style={styles.contactIcon}>
                  <Ionicons name="logo-whatsapp" size={18} color={COLORS.info} />
                </View>
                <View style={styles.contactText}>
                  <Text style={styles.contactTitle}>WhatsApp</Text>
                  <Text style={styles.contactValue}>{CONTACT.phone}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactRow} onPress={openWeb}>
                <View style={styles.contactIcon}>
                  <Ionicons name="globe-outline" size={18} color={COLORS.info} />
                </View>
                <View style={styles.contactText}>
                  <Text style={styles.contactTitle}>Sitio web</Text>
                  <Text style={styles.contactValue}>{CONTACT.websiteLabel}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button title="Adherirme ahora" onPress={onJoin} style={styles.joinBtn} />
            <TouchableOpacity onPress={onClose} style={styles.backLink}>
              <Text style={styles.backLinkText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
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
  scroll: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.lg,
    alignItems: 'center',
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: SIZES.h2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: SIZES.xl,
  },
  contactCard: {
    width: '100%',
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactLabel: {
    color: COLORS.info,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SIZES.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactText: { flex: 1 },
  contactTitle: { color: COLORS.textMuted, fontSize: SIZES.caption },
  contactValue: {
    color: COLORS.text,
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.md,
  },
  joinBtn: { marginBottom: SIZES.md },
  backLink: { alignItems: 'center', paddingVertical: SIZES.sm },
  backLinkText: { color: COLORS.info, fontSize: SIZES.subtitle, fontWeight: '600' },
});

export default NoSocioModal;
