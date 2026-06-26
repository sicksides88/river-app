import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const EnviosDimensionesScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { origin, destination, type, price: estimatedPrice, distance: estimatedDistance, duration, packageWeight } = route.params || {};

  const [dimensions, setDimensions] = useState({
    height: '',
    width: '',
    depth: '',
    weight: '',
  });
  const [description, setDescription] = useState('');

  const handleDimensionChange = (field, value) => {
    // Solo permitir números y punto decimal
    const numericValue = value.replace(/[^0-9.]/g, '');
    setDimensions(prev => ({ ...prev, [field]: numericValue }));
  };

  const isFormValid = () => {
    return (
      dimensions.height.trim() !== '' &&
      dimensions.width.trim() !== '' &&
      dimensions.depth.trim() !== '' &&
      dimensions.weight.trim() !== ''
    );
  };

  const handleContinue = () => {
    if (!isFormValid()) return;

    // Navegar a la pantalla de confirmación con las dimensiones
    navigation.navigate('DeliveryConfirm', {
      pickup: origin,
      delivery: destination,
      packageDescription: description,
      packageWeight: packageWeight,
      weight: dimensions.weight,
      dimensions: {
        height: dimensions.height,
        width: dimensions.width,
        depth: dimensions.depth,
      },
      price: estimatedPrice,
      distance: estimatedDistance,
      duration,
      type: 'envio',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Detalles del paquete</Text>
          </View>

          {/* Descripción del paquete */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción (opcional)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Ej: Caja con documentos, electrodoméstico, etc."
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Dimensiones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dimensiones del paquete</Text>
            <Text style={styles.sectionSubtitle}>Medidas en centímetros (cm)</Text>

            <View style={styles.dimensionsGrid}>
              <View style={styles.dimensionItem}>
                <Text style={styles.dimensionLabel}>Alto</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.dimensionInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    value={dimensions.height}
                    onChangeText={(value) => handleDimensionChange('height', value)}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.unitText}>cm</Text>
                </View>
              </View>

              <View style={styles.dimensionItem}>
                <Text style={styles.dimensionLabel}>Ancho</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.dimensionInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    value={dimensions.width}
                    onChangeText={(value) => handleDimensionChange('width', value)}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.unitText}>cm</Text>
                </View>
              </View>

              <View style={styles.dimensionItem}>
                <Text style={styles.dimensionLabel}>Profundidad</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.dimensionInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    value={dimensions.depth}
                    onChangeText={(value) => handleDimensionChange('depth', value)}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.unitText}>cm</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Peso */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Peso del paquete</Text>
            <View style={styles.weightContainer}>
              <View style={styles.weightInputContainer}>
                <Ionicons name="scale-outline" size={24} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.weightInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  value={dimensions.weight}
                  onChangeText={(value) => handleDimensionChange('weight', value)}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.weightUnit}>kg</Text>
              </View>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              Las dimensiones y el peso nos ayudan a calcular el precio y asignar el vehículo adecuado para tu envío.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={[styles.bottomContainer, { bottom: insets.bottom }]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isFormValid() && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isFormValid()}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.md,
    marginBottom: SIZES.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
  },
  section: {
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  sectionSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  descriptionInput: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dimensionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.sm,
  },
  dimensionItem: {
    flex: 1,
  },
  dimensionLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.sm,
  },
  dimensionInput: {
    flex: 1,
    paddingVertical: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.text,
    textAlign: 'center',
  },
  unitText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  weightContainer: {
    marginTop: SIZES.sm,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.md,
  },
  weightInput: {
    flex: 1,
    paddingVertical: SIZES.md,
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SIZES.sm,
  },
  weightUnit: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  continueButton: {
    backgroundColor: COLORS.text,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default EnviosDimensionesScreen;
