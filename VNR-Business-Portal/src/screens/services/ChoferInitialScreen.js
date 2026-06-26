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

// ChoferInitialScreen - Pantalla inicial de Chofer basado en Figma
const ChoferInitialScreen = ({ navigation }) => {
  // Tabs de servicios
  const serviceTabs = [
    { id: 'vuelta', label: 'Vuelta Segura', screen: 'VueltaSegura' },
    { id: 'envios', label: 'Envíos', screen: 'EnviosInitial' },
    { id: 'fletes', label: 'Fletes', screen: 'FletesInitial' },
    { id: 'chofer', label: 'Chofer', screen: 'ChoferInitial', active: true },
  ];

  const handleTabPress = (tab) => {
    if (!tab.active && tab.screen) {
      navigation.navigate(tab.screen);
    }
  };

  const handleStartTrip = () => {
    navigation.navigate('Chofer');
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

        {/* Search Bar - "¿A donde vamos?" */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
          <Text style={styles.searchPlaceholder}>¿A donde vamos?</Text>
        </TouchableOpacity>

        {/* Banner Card - como en Figma */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>¿Querés empezar{'\n'}un viaje?</Text>
            <TouchableOpacity
              style={styles.bannerButton}
              onPress={handleStartTrip}
              activeOpacity={0.7}
            >
              <Text style={styles.bannerButtonText}>Viajar con la app</Text>
            </TouchableOpacity>
          </View>

          {/* Placeholder para ilustración - ASSET NEEDED: taxi-illustration.png */}
          <View style={styles.bannerIllustration}>
            <View style={styles.illustrationPlaceholder}>
              <Ionicons name="car-sport" size={48} color={COLORS.warning} />
              <Ionicons name="person" size={32} color={COLORS.text} style={styles.personIcon} />
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

  // Banner Card
  bannerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1', // Light yellow/cream as in Figma
    borderRadius: SIZES.radiusLg,
    marginHorizontal: SIZES.screenPadding,
    overflow: 'hidden',
    minHeight: 160,
  },
  bannerContent: {
    flex: 1,
    padding: SIZES.lg,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.md,
    lineHeight: 28,
  },
  bannerButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusXl,
    alignSelf: 'flex-start',
    ...SHADOWS.sm,
  },
  bannerButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },

  // Illustration
  bannerIllustration: {
    width: 160,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  illustrationPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  personIcon: {
    position: 'absolute',
    top: 30,
    left: 20,
  },
});

export default ChoferInitialScreen;
