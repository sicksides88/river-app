import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { driverService } from '../../../services';
import { COLORS, SIZES } from '../../../constants/theme';

// Generar lista de años desde 2000 hasta el año actual
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1999 }, (_, i) => (currentYear - i).toString());

const AddVehicleScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const handleContinue = async () => {
    if (!brand || !model || !year || !plate) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await driverService.addVehicle({
        brand,
        model,
        year: parseInt(year),
        plateNumber: plate.toUpperCase(),
        color: color || null,
        vehicleType: 'sedan', // Por defecto sedan
      });

      if (response.success) {
        Alert.alert(
          'Vehículo agregado',
          'Tu vehículo ha sido registrado exitosamente.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'No se pudo registrar el vehículo');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Error de conexión. Intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Requisitos del vehículo</Text>
        <Text style={styles.subtitle}>Ingresa la información del vehículo</Text>

        {/* Marca */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Marca</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="Honda Civic"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* Modelo */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Modelo</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="Silver"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* Año */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Año</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowYearPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectText, year ? styles.selectTextActive : null]}>
              {year || 'Seleccionar año'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Número de matrícula */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Número de la matrícula</Text>
          <TextInput
            style={styles.input}
            value={plate}
            onChangeText={setPlate}
            placeholder="FNB 785"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="characters"
          />
        </View>
      </ScrollView>

      {/* Bottom button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 65 + SIZES.md }]}>
        <TouchableOpacity
          style={[styles.continueButton, isLoading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.continueButtonText}>Continuar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal selector de año */}
      <Modal
        visible={showYearPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar año</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={YEARS}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.yearItem,
                    year === item && styles.yearItemSelected,
                  ]}
                  onPress={() => {
                    setYear(item);
                    setShowYearPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.yearItemText,
                      year === item && styles.yearItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {year === item && (
                    <Ionicons name="checkmark" size={20} color={COLORS.text} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingVertical: SIZES.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: 120,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xl,
  },
  inputGroup: {
    marginBottom: SIZES.lg,
  },
  inputLabel: {
    fontSize: SIZES.small,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  input: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  selectInput: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: SIZES.body,
    color: COLORS.textMuted,
  },
  selectTextActive: {
    color: COLORS.text,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.screenPadding,
    backgroundColor: COLORS.background,
  },
  continueButton: {
    backgroundColor: COLORS.text,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    maxHeight: '60%',
    paddingBottom: SIZES.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.text,
  },
  yearItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  yearItemSelected: {
    backgroundColor: COLORS.backgroundInput,
  },
  yearItemText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  yearItemTextSelected: {
    fontWeight: '600',
  },
});

export default AddVehicleScreen;
