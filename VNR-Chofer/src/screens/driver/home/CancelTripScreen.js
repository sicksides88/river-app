import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { rideService, deliveryService } from '../../../services';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';

const CANCEL_REASONS = [
  { id: 'client_not_found', label: 'No encontré al cliente', icon: 'person-outline' },
  { id: 'client_not_responding', label: 'El cliente no responde', icon: 'call-outline' },
  { id: 'wrong_address', label: 'Dirección incorrecta', icon: 'location-outline' },
  { id: 'vehicle_issue', label: 'Problema con mi vehículo', icon: 'car-outline' },
  { id: 'personal_emergency', label: 'Emergencia personal', icon: 'medical-outline' },
  { id: 'unsafe_area', label: 'Zona insegura', icon: 'warning-outline' },
  { id: 'other', label: 'Otro motivo', icon: 'ellipsis-horizontal-outline' },
];

const CancelTripScreen = ({ navigation, route }) => {
  const { trip, isDelivery } = route.params || {};
  const [selectedReason, setSelectedReason] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const tripId = isDelivery ? (trip?.deliveryId || trip?.id) : trip?.id;

  const handleCancel = async () => {
    if (!selectedReason) {
      Alert.alert('Selecciona una razón', 'Por favor selecciona el motivo de la cancelación.');
      return;
    }

    const reasonLabel = CANCEL_REASONS.find(r => r.id === selectedReason)?.label || '';
    const fullReason = additionalNotes
      ? `${reasonLabel}: ${additionalNotes}`
      : reasonLabel;

    setIsLoading(true);
    try {
      if (isDelivery && tripId) {
        await deliveryService.cadeteCancelDelivery(tripId, fullReason);
      } else if (tripId) {
        await rideService.driverCancelRide(tripId, fullReason);
      }

      Alert.alert(
        'Envío cancelado',
        'El envío ha sido cancelado exitosamente.',
        [{
          text: 'OK',
          onPress: () => navigation.navigate('DriverHome'),
        }]
      );
    } catch (error) {
      console.error('Error canceling:', error);
      Alert.alert('Error', 'No se pudo cancelar el envío. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cancelar {isDelivery ? 'envío' : 'viaje'}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Warning Message */}
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
            <Text style={styles.warningText}>
              Cancelar con frecuencia puede afectar tu calificación y disponibilidad en la plataforma.
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.sectionTitle}>¿Por qué deseas cancelar?</Text>
          <Text style={styles.sectionSubtitle}>
            Selecciona el motivo principal de la cancelación
          </Text>

          {/* Reason Options */}
          <View style={styles.reasonsContainer}>
            {CANCEL_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.id && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.reasonIconContainer,
                  selectedReason === reason.id && styles.reasonIconContainerSelected,
                ]}>
                  <Ionicons
                    name={reason.icon}
                    size={20}
                    color={selectedReason === reason.id ? COLORS.white : COLORS.text}
                  />
                </View>
                <Text style={[
                  styles.reasonLabel,
                  selectedReason === reason.id && styles.reasonLabelSelected,
                ]}>
                  {reason.label}
                </Text>
                {selectedReason === reason.id && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.text} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Notes */}
          <Text style={styles.notesLabel}>Notas adicionales (opcional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Describe brevemente el problema..."
            placeholderTextColor={COLORS.textMuted}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          <Text style={styles.charCount}>{additionalNotes.length}/200</Text>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={handleGoBack}
            disabled={isLoading}
          >
            <Text style={styles.goBackButtonText}>Volver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedReason || isLoading) && styles.confirmButtonDisabled,
            ]}
            onPress={handleCancel}
            disabled={!selectedReason || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar cancelación</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: SIZES.md,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.lg,
    gap: SIZES.sm,
  },
  warningText: {
    flex: 1,
    fontSize: SIZES.small,
    color: '#92400E',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  sectionSubtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.lg,
  },
  reasonsContainer: {
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonOptionSelected: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.text,
  },
  reasonIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  reasonIconContainerSelected: {
    backgroundColor: COLORS.primary,
  },
  reasonLabel: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  reasonLabelSelected: {
    fontWeight: '600',
  },
  notesLabel: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: SIZES.sm,
  },
  notesInput: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'right',
    marginTop: SIZES.xs,
  },
  footer: {
    flexDirection: 'row',
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.lg,
    gap: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    backgroundColor: COLORS.background,
  },
  goBackButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  goBackButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: COLORS.error,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default CancelTripScreen;
