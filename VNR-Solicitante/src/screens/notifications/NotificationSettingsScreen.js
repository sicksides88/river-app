import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { notificationService } from '../../services';

const NotificationSettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: '22:00',
    end: '08:00',
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const result = await notificationService.getPreferencesSummary();

      if (result.success) {
        setCategories(result.categories || []);
        setSoundEnabled(result.soundEnabled !== false);
        setVibrationEnabled(result.vibrationEnabled !== false);
        setQuietHours(result.quietHours || { enabled: false, start: '22:00', end: '08:00' });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'No se pudieron cargar las preferencias');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = async (categoryId, enabled) => {
    try {
      setSaving(true);
      const result = await notificationService.toggleCategory(categoryId, enabled);

      if (result.success) {
        setCategories(categories.map((cat) =>
          cat.id === categoryId ? { ...cat, enabled } : cat
        ));
      } else {
        Alert.alert('Error', 'No se pudo actualizar la preferencia');
      }
    } catch (error) {
      console.error('Error toggling category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSound = async (enabled) => {
    try {
      setSaving(true);
      const result = await notificationService.toggleSound(enabled);

      if (result.success) {
        setSoundEnabled(enabled);
      }
    } catch (error) {
      console.error('Error toggling sound:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVibration = async (enabled) => {
    try {
      setSaving(true);
      const result = await notificationService.toggleVibration(enabled);

      if (result.success) {
        setVibrationEnabled(enabled);
      }
    } catch (error) {
      console.error('Error toggling vibration:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleQuietHours = async (enabled) => {
    try {
      setSaving(true);
      const result = await notificationService.setQuietHours(
        enabled,
        quietHours.start,
        quietHours.end
      );

      if (result.success) {
        setQuietHours({ ...quietHours, enabled });
      }
    } catch (error) {
      console.error('Error toggling quiet hours:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Restablecer preferencias',
      'Esto restaurará todas las preferencias de notificaciones a los valores por defecto. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const result = await notificationService.resetPreferences();
              if (result.success) {
                await loadPreferences();
                Alert.alert('Listo', 'Preferencias restablecidas');
              }
            } catch (error) {
              console.error('Error resetting preferences:', error);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (iconName) => {
    const iconMap = {
      car: 'car-outline',
      location: 'location-outline',
      card: 'card-outline',
      chatbubble: 'chatbubble-outline',
      star: 'star-outline',
      pricetag: 'pricetag-outline',
      calendar: 'calendar-outline',
    };
    return iconMap[iconName] || 'notifications-outline';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Configuracion</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipos de notificaciones</Text>
          <Text style={styles.sectionSubtitle}>
            Elige que notificaciones quieres recibir
          </Text>

          <View style={styles.card}>
            {categories.map((category, index) => (
              <View
                key={category.id}
                style={[
                  styles.settingRow,
                  index < categories.length - 1 && styles.settingRowBorder,
                ]}
              >
                <View style={styles.settingIconContainer}>
                  <Ionicons
                    name={getCategoryIcon(category.icon)}
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>{category.label}</Text>
                  <Text style={styles.settingDescription}>
                    {category.description}
                  </Text>
                </View>
                <Switch
                  value={category.enabled}
                  onValueChange={(value) => handleToggleCategory(category.id, value)}
                  trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                  thumbColor={category.enabled ? COLORS.primary : COLORS.textMuted}
                  disabled={saving}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sonido y vibracion</Text>

          <View style={styles.card}>
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name="volume-high-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Sonido</Text>
                <Text style={styles.settingDescription}>
                  Reproducir sonido con notificaciones
                </Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={handleToggleSound}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                thumbColor={soundEnabled ? COLORS.primary : COLORS.textMuted}
                disabled={saving}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Vibracion</Text>
                <Text style={styles.settingDescription}>
                  Vibrar al recibir notificaciones
                </Text>
              </View>
              <Switch
                value={vibrationEnabled}
                onValueChange={handleToggleVibration}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                thumbColor={vibrationEnabled ? COLORS.primary : COLORS.textMuted}
                disabled={saving}
              />
            </View>
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horario silencioso</Text>

          <View style={styles.card}>
            <View style={[styles.settingRow, quietHours.enabled && styles.settingRowBorder]}>
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name="moon-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>No molestar</Text>
                <Text style={styles.settingDescription}>
                  Silenciar notificaciones en ciertos horarios
                </Text>
              </View>
              <Switch
                value={quietHours.enabled}
                onValueChange={handleToggleQuietHours}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                thumbColor={quietHours.enabled ? COLORS.primary : COLORS.textMuted}
                disabled={saving}
              />
            </View>

            {quietHours.enabled && (
              <View style={styles.quietHoursInfo}>
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Desde</Text>
                  <View style={styles.timeValue}>
                    <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.timeText}>{quietHours.start}</Text>
                  </View>
                </View>
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Hasta</Text>
                  <View style={styles.timeValue}>
                    <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.timeText}>{quietHours.end}</Text>
                  </View>
                </View>
                <Text style={styles.quietHoursNote}>
                  Las notificaciones importantes como alertas de viaje aún se enviarán
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Reset */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetToDefaults}
            disabled={saving}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.error} />
            <Text style={styles.resetText}>Restablecer a valores por defecto</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Saving indicator */}
      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.white,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },
  section: {
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  sectionSubtitle: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  settingContent: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  settingLabel: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  quietHoursInfo: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  timeLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radiusSm,
  },
  timeText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
    marginLeft: SIZES.xs,
  },
  quietHoursNote: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: SIZES.xs,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
  },
  resetText: {
    fontSize: SIZES.body,
    color: COLORS.error,
    marginLeft: SIZES.xs,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: SIZES.md,
  },
});

export default NotificationSettingsScreen;
