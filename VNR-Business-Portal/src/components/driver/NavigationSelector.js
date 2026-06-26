/**
 * NavigationSelector - Selector de app de navegación para conductores
 * Muestra botones para abrir Google Maps, Waze o Apple Maps
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { navigationService } from '../../services/navigation.service';

// Iconos para cada app de navegación
const APP_ICONS = {
  googleMaps: { icon: 'map', color: '#4285F4' },
  waze: { icon: 'navigation', color: '#33CCFF' },
  appleMaps: { icon: 'map-pin', color: '#000000' },
  googleMapsWeb: { icon: 'globe', color: '#4285F4' },
};

const NavigationSelector = ({
  destination,
  origin,
  address,
  variant = 'button', // 'button' | 'fab' | 'inline'
  size = 'medium', // 'small' | 'medium' | 'large'
  showLabel = true,
  onNavigationStart,
  onNavigationError,
  style,
}) => {
  const [availableApps, setAvailableApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [navigating, setNavigating] = useState(false);

  // Detectar apps disponibles al montar
  useEffect(() => {
    const detectApps = async () => {
      try {
        const apps = await navigationService.getAvailableApps();
        setAvailableApps(apps);
      } catch (error) {
        console.error('Error detectando apps:', error);
        // Fallback a Google Maps web
        setAvailableApps([{
          key: 'googleMapsWeb',
          name: 'Google Maps',
          icon: 'map',
          isWeb: true,
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    detectApps();
  }, []);

  // Abrir navegación
  const handleOpenNavigation = async (appKey) => {
    if (!destination) {
      onNavigationError?.('No se ha especificado un destino');
      return;
    }

    setNavigating(true);
    setShowModal(false);

    try {
      onNavigationStart?.(appKey);
      const success = await navigationService.openNavigationApp(
        appKey,
        destination,
        origin,
        address
      );

      if (!success) {
        onNavigationError?.('No se pudo abrir la aplicación de navegación');
      }
    } catch (error) {
      console.error('Error abriendo navegación:', error);
      onNavigationError?.(error.message || 'Error al abrir navegación');
    } finally {
      setNavigating(false);
    }
  };

  // Si solo hay una app, abrir directamente
  const handlePress = () => {
    if (availableApps.length === 1) {
      handleOpenNavigation(availableApps[0].key);
    } else {
      setShowModal(true);
    }
  };

  // Tamaños según variante
  const getSizes = () => {
    switch (size) {
      case 'small':
        return { button: 40, icon: 18, text: SIZES.small };
      case 'large':
        return { button: 56, icon: 26, text: SIZES.subtitle };
      default:
        return { button: 48, icon: 22, text: SIZES.body };
    }
  };

  const sizes = getSizes();

  // Renderizar según variante
  if (variant === 'fab') {
    return (
      <>
        <TouchableOpacity
          style={[styles.fab, style]}
          onPress={handlePress}
          disabled={isLoading || navigating}
          activeOpacity={0.8}
        >
          {isLoading || navigating ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Feather name="navigation" size={24} color={COLORS.white} />
          )}
        </TouchableOpacity>
        {renderModal()}
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <>
        <View style={[styles.inlineContainer, style]}>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            availableApps.map((app) => (
              <TouchableOpacity
                key={app.key}
                style={styles.inlineButton}
                onPress={() => handleOpenNavigation(app.key)}
                disabled={navigating}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.inlineIconContainer,
                  { backgroundColor: APP_ICONS[app.key]?.color || COLORS.primary }
                ]}>
                  <Feather
                    name={APP_ICONS[app.key]?.icon || 'map'}
                    size={16}
                    color={COLORS.white}
                  />
                </View>
                <Text style={styles.inlineText} numberOfLines={1}>
                  {app.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </>
    );
  }

  // Variante 'button' (default)
  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          { height: sizes.button },
          style
        ]}
        onPress={handlePress}
        disabled={isLoading || navigating}
        activeOpacity={0.8}
      >
        {isLoading || navigating ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <>
            <Feather name="navigation" size={sizes.icon} color={COLORS.white} />
            {showLabel && (
              <Text style={[styles.buttonText, { fontSize: sizes.text }]}>
                Navegar
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>
      {renderModal()}
    </>
  );

  // Modal para seleccionar app
  function renderModal() {
    return (
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Abrir con</Text>

            {availableApps.map((app) => (
              <TouchableOpacity
                key={app.key}
                style={styles.modalOption}
                onPress={() => handleOpenNavigation(app.key)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.modalIconContainer,
                  { backgroundColor: APP_ICONS[app.key]?.color || COLORS.primary }
                ]}>
                  <Feather
                    name={APP_ICONS[app.key]?.icon || 'map'}
                    size={22}
                    color={COLORS.white}
                  />
                </View>
                <Text style={styles.modalOptionText}>{app.name}</Text>
                <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }
};

const styles = StyleSheet.create({
  // Botón principal
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusXl,
    gap: SIZES.sm,
    ...SHADOWS.md,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
  },

  // FAB (Floating Action Button)
  fab: {
    position: 'absolute',
    right: SIZES.md,
    bottom: SIZES.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },

  // Inline buttons
  inlineContainer: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundTertiary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusXl,
    gap: SIZES.xs,
  },
  inlineIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineText: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.text,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SIZES.lg,
  },
  modalTitle: {
    fontSize: SIZES.title,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  modalOptionText: {
    flex: 1,
    fontSize: SIZES.subtitle,
    fontWeight: '500',
    color: COLORS.text,
  },
  modalCancel: {
    marginTop: SIZES.lg,
    paddingVertical: SIZES.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});

export default NavigationSelector;
