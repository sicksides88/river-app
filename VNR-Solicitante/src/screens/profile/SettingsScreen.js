import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// SettingsScreen - Configuración basado en diseño Figma
const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [locationServices, setLocationServices] = React.useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Contactar Soporte',
              'Para eliminar tu cuenta, contacta a soporte@vnr.com'
            ),
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent, danger }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !rightComponent}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? COLORS.error : COLORS.text} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (onPress && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      ))}
    </TouchableOpacity>
  );

  const ToggleItem = ({ icon, title, subtitle, value, onValueChange, disabled }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={COLORS.text} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.borderLight, true: COLORS.black }}
        thumbColor={COLORS.white}
        disabled={disabled}
        style={styles.switch}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          <View style={styles.card}>
            <ToggleItem
              icon="notifications-outline"
              title="Push"
              subtitle="Viajes, envíos y promociones"
              value={notifications}
              onValueChange={setNotifications}
            />
            <View style={styles.divider} />
            <ToggleItem
              icon="mail-outline"
              title="Email"
              subtitle="Resumen semanal y ofertas"
              value={emailNotifications}
              onValueChange={setEmailNotifications}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad</Text>
          <View style={styles.card}>
            <ToggleItem
              icon="location-outline"
              title="Ubicación"
              subtitle="Necesario para los servicios"
              value={locationServices}
              onValueChange={setLocationServices}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Política de Privacidad"
              onPress={() => Alert.alert('Próximamente', 'Ver política de privacidad')}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="document-text-outline"
              title="Términos de Servicio"
              onPress={() => Alert.alert('Próximamente', 'Ver términos de servicio')}
            />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>
          <View style={styles.card}>
            <SettingItem
              icon="language-outline"
              title="Idioma"
              subtitle="Español"
              onPress={() => Alert.alert('Próximamente', 'Cambiar idioma')}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="information-circle-outline"
              title="Versión"
              subtitle="1.0.0"
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          <View style={styles.card}>
            <SettingItem
              icon="help-circle-outline"
              title="Centro de Ayuda"
              onPress={() => Alert.alert('Próximamente', 'Centro de ayuda')}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="chatbubble-outline"
              title="Contactar Soporte"
              subtitle="soporte@vnr.com"
              onPress={() => Alert.alert('Soporte', 'Envía un email a soporte@vnr.com')}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="star-outline"
              title="Calificar App"
              onPress={() => Alert.alert('Próximamente', 'Calificar en la tienda')}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zona de Peligro</Text>
          <View style={[styles.card, styles.dangerCard]}>
            <SettingItem
              icon="trash-outline"
              title="Eliminar Cuenta"
              subtitle="Esta acción es permanente"
              onPress={handleDeleteAccount}
              danger
            />
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
  },
  headerSpacer: {
    width: 40,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },

  // Section
  section: {
    marginTop: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SIZES.sm,
    paddingLeft: SIZES.xs,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: COLORS.errorLight || '#FFCDD2',
  },

  // Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundInput,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  settingIconDanger: {
    backgroundColor: COLORS.errorLight || '#FFEBEE',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingTitleDanger: {
    color: COLORS.error,
  },
  settingSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginLeft: 68, // icon width + padding
  },

  // Switch
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
});

export default SettingsScreen;
