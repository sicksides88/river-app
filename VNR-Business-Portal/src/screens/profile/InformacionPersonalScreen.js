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
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/theme';

// InformacionPersonalScreen - Pantalla de información personal basado en Figma
const InformacionPersonalScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');

  const tabs = [
    { id: 'info', label: 'Información personal' },
    { id: 'seguridad', label: 'Seguridad' },
    { id: 'datos', label: 'Protección de datos' },
  ];

  const userInfo = [
    {
      id: 'nombre',
      label: 'Nombre',
      value: `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Sin nombre',
      onPress: () => navigation.navigate('EditField', { field: 'nombre' }),
    },
    {
      id: 'genero',
      label: 'Género',
      value: user?.genero || 'No especificado',
      onPress: () => navigation.navigate('EditField', { field: 'genero' }),
    },
    {
      id: 'telefono',
      label: 'Número de teléfono',
      value: user?.telefono || '+543442123456',
      onPress: () => navigation.navigate('EditField', { field: 'telefono' }),
    },
    {
      id: 'email',
      label: 'Correo electrónico',
      value: user?.email || 'santiescobar@gmail.com',
      onPress: () => navigation.navigate('EditField', { field: 'email' }),
    },
    {
      id: 'identidad',
      label: 'Verificar identidad',
      value: 'Agregar tu id',
      onPress: () => navigation.navigate('VerificarIdentidad'),
    },
  ];

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'seguridad') {
      navigation.navigate('Seguridad');
    } else if (tabId === 'datos') {
      navigation.navigate('ProteccionDatos');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header con botón atrás */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

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
        <Text style={styles.title}>Información personal</Text>

        {/* Avatar */}
        <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.7}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={40} color={COLORS.textMuted} />
          </View>
          <View style={styles.avatarEditBadge}>
            <Ionicons name="pencil" size={12} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        {/* Info List */}
        <View style={styles.infoList}>
          {userInfo.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.infoItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Avatar
  avatarContainer: {
    alignSelf: 'flex-start',
    marginBottom: SIZES.xl,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info List
  infoList: {
    gap: 0,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
});

export default InformacionPersonalScreen;
