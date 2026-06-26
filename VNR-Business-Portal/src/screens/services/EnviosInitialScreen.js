import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// EnviosInitialScreen - Pantalla inicial de Envíos basado en Figma
const EnviosInitialScreen = ({ navigation }) => {
  // Tabs de servicios
  const serviceTabs = [
    { id: 'vuelta', label: 'Vuelta Segura', screen: 'VueltaSegura' },
    { id: 'envios', label: 'Envíos', screen: 'EnviosInitial', active: true },
    { id: 'fletes', label: 'Fletes', screen: 'FletesInitial' },
    { id: 'chofer', label: 'Chofer', screen: 'ChoferInitial' },
  ];

  // Tipos de entregas
  const deliveryTypes = [
    {
      id: 'enviar',
      title: 'Enviar artículos',
      icon: 'cube-outline',
      onPress: () => navigation.navigate('EnviarArticulo'),
    },
    {
      id: 'recibir',
      title: 'Recibir artículos',
      icon: 'archive-outline',
      onPress: () => navigation.navigate('RecibirArticulo'),
    },
  ];

  // Contenido info card según Figma
  const infoCardItems = [
    'Regalos y flores',
    'Pedidos de clientes o productos vendidos',
    'Documentos y trámites',
    'Compras o artículos olvidados',
    'Algo que te olvidaste o necesitás urgente',
  ];

  const handleTabPress = (tab) => {
    if (!tab.active && tab.screen) {
      navigation.navigate(tab.screen);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Tabs - como en Figma */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {serviceTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, tab.active && styles.tabActive]}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, tab.active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Bar - "¿Entregar en...?" */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
          <Text style={styles.searchPlaceholder}>¿Entregar en...?</Text>
        </TouchableOpacity>

        {/* Tipos de entregas */}
        <Text style={styles.sectionTitle}>Tipos de entregas</Text>

        <View style={styles.deliveryTypesContainer}>
          {deliveryTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={styles.deliveryCard}
              onPress={type.onPress}
              activeOpacity={0.7}
            >
              {/* Placeholder para ilustración - ASSET NEEDED */}
              <View style={styles.deliveryIllustration}>
                <Ionicons name={type.icon} size={48} color={COLORS.text} />
              </View>
              <Text style={styles.deliveryTitle}>{type.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cómo usar envíos - según Figma */}
        <Text style={styles.sectionTitle}>¿Cómo usar envíos?</Text>
        <Text style={styles.sectionSubtitle}>Enviá y recibí paquetes sin complicaciones, en minutos.</Text>

        <View style={styles.howToCard}>
          {/* Placeholder para ilustración - ASSET NEEDED */}
          <View style={styles.howToIllustration}>
            <Ionicons name="phone-portrait-outline" size={48} color={COLORS.primary} />
            <Ionicons name="people-outline" size={32} color={COLORS.text} style={styles.illustrationOverlay} />
          </View>

          <View style={styles.howToContent}>
            <Text style={styles.howToTitle}>Usá el servicio de envíos para enviar o recibir lo que necesites</Text>
            <View style={styles.howToSteps}>
              {infoCardItems.map((item, index) => (
                <View key={index} style={styles.howToStep}>
                  <View style={styles.howToBullet} />
                  <Text style={styles.howToStepText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SIZES.xxl,
  },

  // Service Tabs
  tabsContainer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    gap: SIZES.sm,
  },
  tab: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusXl,
    backgroundColor: COLORS.backgroundInput,
    marginRight: SIZES.sm,
  },
  tabActive: {
    backgroundColor: COLORS.black,
  },
  tabText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.white,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.lg,
    gap: SIZES.sm,
  },
  searchPlaceholder: {
    fontSize: SIZES.body,
    color: COLORS.textMuted,
  },

  // Section Title
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.xs,
  },
  sectionSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.md,
  },

  // Delivery Types
  deliveryTypesContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.screenPadding,
    gap: SIZES.md,
    marginBottom: SIZES.xl,
  },
  deliveryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  deliveryIllustration: {
    width: 100,
    height: 100,
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
  },
  deliveryTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },

  // How To Use
  howToCard: {
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    marginHorizontal: SIZES.screenPadding,
    padding: SIZES.lg,
    ...SHADOWS.sm,
  },
  howToIllustration: {
    height: 120,
    borderRadius: SIZES.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
    position: 'relative',
  },
  illustrationOverlay: {
    position: 'absolute',
    bottom: 10,
    right: '30%',
  },
  howToContent: {
    flex: 1,
  },
  howToTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  howToSteps: {
    flex: 1,
  },
  howToStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.sm,
  },
  howToBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.text,
    marginTop: 6,
    marginRight: SIZES.sm,
  },
  howToStepText: {
    flex: 1,
    fontSize: SIZES.small,
    color: COLORS.text,
    lineHeight: 18,
  },
});

export default EnviosInitialScreen;
