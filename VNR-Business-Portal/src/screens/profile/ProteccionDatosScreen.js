import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

// ProteccionDatosScreen - Pantalla de protección de datos basado en Figma
const ProteccionDatosScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('datos');

  const tabs = [
    { id: 'info', label: 'Información personal' },
    { id: 'seguridad', label: 'Seguridad' },
    { id: 'datos', label: 'Protección de datos' },
  ];

  const dataOptions = [
    {
      id: 'privacidad',
      label: 'Privacidad y seguridad',
      description: 'Gestioná tu información y descubrí cómo la mantenemos segura.',
      onPress: () => navigation.navigate('PrivacidadSeguridad'),
    },
  ];

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'info') {
      navigation.navigate('InformacionPersonal');
    } else if (tabId === 'seguridad') {
      navigation.navigate('Seguridad');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => handleTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Protección de datos</Text>

        {/* Data Options List */}
        <View style={styles.optionsList}>
          {dataOptions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.optionItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionLabel}>{item.label}</Text>
                {item.description && (
                  <Text style={styles.optionDescription}>{item.description}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
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

  // Tabs
  tabsContainer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    gap: SIZES.md,
  },
  tab: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusXl,
    backgroundColor: 'transparent',
    marginRight: SIZES.sm,
  },
  tabActive: {
    backgroundColor: COLORS.backgroundInput,
  },
  tabText: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.text,
    fontWeight: '500',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },

  // Title
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.xl,
  },

  // Options List
  optionsList: {
    gap: 0,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

export default ProteccionDatosScreen;
