import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// FletesInitialScreen - Pantalla inicial de Fletes basado en Figma
const FletesInitialScreen = ({ navigation }) => {
  // Tabs de servicios
  const serviceTabs = [
    { id: 'vuelta', label: 'Vuelta Segura', screen: 'VueltaSegura' },
    { id: 'envios', label: 'Envíos', screen: 'EnviosInitial' },
    { id: 'fletes', label: 'Fletes', screen: 'FletesInitial', active: true },
    { id: 'chofer', label: 'Chofer', screen: 'ChoferInitial' },
  ];

  // Tipos de entregas - 4 opciones como en Figma
  const fleteTypes = [
    {
      id: 'programar',
      title: 'Programar flete',
      icon: 'calendar-outline',
      color: '#E3F2FD',
      onPress: () => navigation.navigate('Fletes', { mode: 'schedule' }),
    },
    {
      id: 'inmediato',
      title: 'Flete inmediato',
      icon: 'flash-outline',
      color: '#FFF3E0',
      onPress: () => navigation.navigate('Fletes', { mode: 'immediate' }),
    },
    {
      id: 'mudanzas',
      title: 'Mudanzas',
      icon: 'home-outline',
      color: '#E8F5E9',
      onPress: () => navigation.navigate('Fletes', { mode: 'moving' }),
    },
    {
      id: 'mercancias',
      title: 'Mercancías',
      icon: 'cube-outline',
      color: '#FCE4EC',
      onPress: () => navigation.navigate('Fletes', { mode: 'goods' }),
    },
  ];

  // Info sobre fletes
  const fleteInfo = [
    'Mudanzas chicas y grandes',
    'Mercaderia',
    'Pallets y herramientas',
    'Electrodomesticos y muebles',
    'Compras, retiros o entregas urgentes',
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

        {/* Grid 2x2 de opciones */}
        <View style={styles.fleteTypesGrid}>
          {fleteTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={styles.fleteCard}
              onPress={type.onPress}
              activeOpacity={0.7}
            >
              {/* Placeholder para ilustración - ASSET NEEDED */}
              <View style={[styles.fleteIllustration, { backgroundColor: type.color }]}>
                <Ionicons name={type.icon} size={40} color={COLORS.text} />
              </View>
              <Text style={styles.fleteTitle}>{type.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cómo usar fletes */}
        <Text style={styles.sectionTitle}>¿Cómo usar fletes?</Text>
        <Text style={styles.sectionSubtitle}>
          Explora como podes mover objetos grandes y pesados.
        </Text>

        <View style={styles.infoCard}>
          {/* Placeholder para ilustración - ASSET NEEDED */}
          <View style={styles.infoIllustration}>
            <Ionicons name="bus-outline" size={64} color={COLORS.textMuted} />
          </View>

          <View style={styles.infoList}>
            {fleteInfo.map((item, index) => (
              <View key={index} style={styles.infoItem}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>{item}</Text>
              </View>
            ))}
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
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
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
    color: COLORS.white,
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.xs,
  },
  sectionSubtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.md,
  },

  // Flete Types Grid
  fleteTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.screenPadding,
    gap: SIZES.md,
    marginBottom: SIZES.xl,
  },
  fleteCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  fleteIllustration: {
    width: '100%',
    height: 100,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  fleteTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    marginHorizontal: SIZES.screenPadding,
    padding: SIZES.lg,
    overflow: 'hidden',
  },
  infoIllustration: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
  },
  infoList: {
    gap: SIZES.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.text,
    marginTop: 6,
    marginRight: SIZES.sm,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
    lineHeight: 20,
  },
});

export default FletesInitialScreen;
