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

// SeguridadScreen - Pantalla de seguridad basado en Figma
const SeguridadScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('seguridad');

  const tabs = [
    { id: 'info', label: 'Información personal' },
    { id: 'seguridad', label: 'Seguridad' },
    { id: 'datos', label: 'Protección de datos' },
  ];

  const securityOptions = [
    {
      id: 'password',
      label: 'Contraseña',
      description: null,
      onPress: () => navigation.navigate('CambiarContrasena'),
    },
    {
      id: 'recovery',
      label: 'Teléfono para la recuperación',
      description: 'Agrega un número de teléfono alternativo para recuperar tu cuenta en caso de pérdida.',
      onPress: () => navigation.navigate('CambiarTelefono'),
    },
  ];

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'info') {
      navigation.navigate('InformacionPersonal');
    } else if (tabId === 'datos') {
      navigation.navigate('ProteccionDatos');
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
        <Text style={styles.title}>Seguridad</Text>

        {/* Security Options List */}
        <View style={styles.optionsList}>
          {securityOptions.map((item) => (
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

export default SeguridadScreen;
