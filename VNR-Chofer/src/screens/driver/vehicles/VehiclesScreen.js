import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import driverService from '../../../services/driver.service';

const VehiclesScreen = ({ navigation }) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activating, setActivating] = useState(false);

  const loadVehicles = useCallback(async () => {
    try {
      const response = await driverService.getVehicles();
      if (response.success && response.vehicles) {
        // Mapear los datos del backend al formato esperado por la UI
        const mappedVehicles = response.vehicles.map(vehicle => ({
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          color: vehicle.color,
          year: vehicle.year,
          plate: vehicle.plate_number,
          type: vehicle.vehicle_type === 'motorcycle' ? 'Solo envíos' : 'Solo viajes',
          capacity: vehicle.capacity,
          is_active: vehicle.is_active,
          is_verified: vehicle.is_verified,
          documents_status: vehicle.documents_status || {},
          canBeUsed: vehicle.documents_status?.all_approved || false,
          image: null,
        }));
        setVehicles(mappedVehicles);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Error', 'No se pudieron cargar los vehículos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // Recargar cuando se vuelve a la pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadVehicles();
    });
    return unsubscribe;
  }, [navigation, loadVehicles]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVehicles();
  }, [loadVehicles]);

  const handleVehiclePress = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  const handleDeleteVehicle = () => {
    setVehicles(vehicles.filter(v => v.id !== selectedVehicle.id));
    setShowModal(false);
    setSelectedVehicle(null);
  };

  const handleViewDocuments = () => {
    setShowModal(false);
    navigation.navigate('VehicleInfo', { vehicle: selectedVehicle });
  };

  const handleUseVehicle = async () => {
    if (!selectedVehicle) return;

    setActivating(true);
    try {
      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para activar el vehículo');
        setActivating(false);
        return;
      }

      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Actualizar disponibilidad con el vehículo seleccionado
      const response = await driverService.updateAvailability(
        true,
        location.coords.latitude,
        location.coords.longitude,
        selectedVehicle.id
      );

      if (response.success) {
        setShowModal(false);
        Alert.alert(
          'Vehículo activado',
          `Estás disponible con: ${selectedVehicle.brand} ${selectedVehicle.model}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.message || 'No se pudo activar el vehículo');
      }
    } catch (error) {
      console.error('Error activating vehicle:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo activar el vehículo. Intenta nuevamente.'
      );
    } finally {
      setActivating(false);
    }
  };

  const getDocumentStatusColor = (status) => {
    switch (status) {
      case 'approved': return COLORS.success || '#34C759';
      case 'pending': return '#FF9500';
      case 'rejected': return '#FF3B30';
      default: return COLORS.textMuted;
    }
  };

  const getDocumentStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return 'Sin subir';
    }
  };

  const renderVehicle = ({ item }) => (
    <TouchableOpacity
      style={styles.vehicleCard}
      onPress={() => handleVehiclePress(item)}
      activeOpacity={0.7}
    >
      {/* Vehicle image placeholder */}
      <View style={styles.vehicleImage}>
        <Ionicons name="car-sport" size={40} color={COLORS.textMuted} />
      </View>

      {/* Vehicle info */}
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName}>
          {item.brand} {item.model} - {item.year}
        </Text>
        <Text style={styles.vehiclePlate}>
          {item.plate} - {item.type}
        </Text>
        {/* Estado de documentos */}
        <View style={styles.docsStatusContainer}>
          {item.canBeUsed ? (
            <View style={styles.docsStatusBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#34C759" />
              <Text style={[styles.docsStatusText, { color: '#34C759' }]}>Listo para usar</Text>
            </View>
          ) : (
            <View style={styles.docsStatusBadge}>
              <Ionicons name="alert-circle" size={14} color="#FF9500" />
              <Text style={[styles.docsStatusText, { color: '#FF9500' }]}>Documentos pendientes</Text>
            </View>
          )}
        </View>
      </View>

      {/* Menu dots */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => handleVehiclePress(item)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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

        <Text style={styles.headerTitle}>Tus vehículos</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddVehicle')}
        >
          <Ionicons name="car" size={20} color={COLORS.white} />
          <Ionicons name="add" size={14} color={COLORS.white} style={styles.addIcon} />
        </TouchableOpacity>
      </View>

      {/* Vehicle list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando vehículos...</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={64} color={'rgba(255,255,255,0.55)'} />
              <Text style={styles.emptyText}>No tienes vehículos registrados</Text>
              <TouchableOpacity
                style={styles.addVehicleButton}
                onPress={() => navigation.navigate('AddVehicle')}
              >
                <Text style={styles.addVehicleButtonText}>Agregar vehículo</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Vehicle options modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>
              {selectedVehicle?.year} {selectedVehicle?.brand} {selectedVehicle?.model}
            </Text>
            <Text style={styles.modalPlate}>{selectedVehicle?.plate}</Text>

            {/* Documentos del vehículo - clickeables para subir */}
            <View style={styles.docsDetailContainer}>
              {/* Cédula Frente */}
              <TouchableOpacity
                style={styles.docDetailRow}
                onPress={() => {
                  if (selectedVehicle?.documents_status?.registration_front_status !== 'approved') {
                    setShowModal(false);
                    navigation.navigate('UploadDocument', {
                      documentType: 'vehicle_registration_front',
                      vehicleId: selectedVehicle?.id,
                      documentTitle: 'Cédula del vehículo (Frente)',
                      currentStatus: selectedVehicle?.documents_status?.registration_front_status,
                    });
                  }
                }}
                disabled={selectedVehicle?.documents_status?.registration_front_status === 'approved'}
                activeOpacity={selectedVehicle?.documents_status?.registration_front_status === 'approved' ? 1 : 0.7}
              >
                <Ionicons
                  name={selectedVehicle?.documents_status?.registration_front_status === 'approved' ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={20}
                  color={getDocumentStatusColor(selectedVehicle?.documents_status?.registration_front_status)}
                  style={styles.docIcon}
                />
                <View style={styles.docDetailInfo}>
                  <Text style={styles.docDetailLabel}>Cédula (Frente)</Text>
                  <Text style={[styles.docDetailStatus, { color: getDocumentStatusColor(selectedVehicle?.documents_status?.registration_front_status) }]}>
                    {getDocumentStatusText(selectedVehicle?.documents_status?.registration_front_status)}
                  </Text>
                </View>
                {selectedVehicle?.documents_status?.registration_front_status !== 'approved' && (
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                )}
              </TouchableOpacity>

              {/* Cédula Dorso */}
              <TouchableOpacity
                style={styles.docDetailRow}
                onPress={() => {
                  if (selectedVehicle?.documents_status?.registration_back_status !== 'approved') {
                    setShowModal(false);
                    navigation.navigate('UploadDocument', {
                      documentType: 'vehicle_registration_back',
                      vehicleId: selectedVehicle?.id,
                      documentTitle: 'Cédula del vehículo (Dorso)',
                      currentStatus: selectedVehicle?.documents_status?.registration_back_status,
                    });
                  }
                }}
                disabled={selectedVehicle?.documents_status?.registration_back_status === 'approved'}
                activeOpacity={selectedVehicle?.documents_status?.registration_back_status === 'approved' ? 1 : 0.7}
              >
                <Ionicons
                  name={selectedVehicle?.documents_status?.registration_back_status === 'approved' ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={20}
                  color={getDocumentStatusColor(selectedVehicle?.documents_status?.registration_back_status)}
                  style={styles.docIcon}
                />
                <View style={styles.docDetailInfo}>
                  <Text style={styles.docDetailLabel}>Cédula (Dorso)</Text>
                  <Text style={[styles.docDetailStatus, { color: getDocumentStatusColor(selectedVehicle?.documents_status?.registration_back_status) }]}>
                    {getDocumentStatusText(selectedVehicle?.documents_status?.registration_back_status)}
                  </Text>
                </View>
                {selectedVehicle?.documents_status?.registration_back_status !== 'approved' && (
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                )}
              </TouchableOpacity>

              {/* Seguro */}
              <TouchableOpacity
                style={[styles.docDetailRow, { borderBottomWidth: 0 }]}
                onPress={() => {
                  if (selectedVehicle?.documents_status?.insurance_status !== 'approved') {
                    setShowModal(false);
                    navigation.navigate('UploadDocument', {
                      documentType: 'vehicle_insurance',
                      vehicleId: selectedVehicle?.id,
                      documentTitle: 'Seguro del vehículo',
                      currentStatus: selectedVehicle?.documents_status?.insurance_status,
                    });
                  }
                }}
                disabled={selectedVehicle?.documents_status?.insurance_status === 'approved'}
                activeOpacity={selectedVehicle?.documents_status?.insurance_status === 'approved' ? 1 : 0.7}
              >
                <Ionicons
                  name={selectedVehicle?.documents_status?.insurance_status === 'approved' ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={20}
                  color={getDocumentStatusColor(selectedVehicle?.documents_status?.insurance_status)}
                  style={styles.docIcon}
                />
                <View style={styles.docDetailInfo}>
                  <Text style={styles.docDetailLabel}>Seguro del vehículo</Text>
                  <Text style={[styles.docDetailStatus, { color: getDocumentStatusColor(selectedVehicle?.documents_status?.insurance_status) }]}>
                    {getDocumentStatusText(selectedVehicle?.documents_status?.insurance_status)}
                  </Text>
                </View>
                {selectedVehicle?.documents_status?.insurance_status !== 'approved' && (
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            {/* Use vehicle button - solo habilitado si documentos aprobados */}
            <TouchableOpacity
              style={[
                styles.useVehicleButton,
                (!selectedVehicle?.canBeUsed || activating) && styles.buttonDisabled
              ]}
              onPress={handleUseVehicle}
              disabled={!selectedVehicle?.canBeUsed || activating}
            >
              {activating ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.useVehicleButtonText}>
                  {selectedVehicle?.canBeUsed ? 'Usar este vehículo' : 'Documentos pendientes'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Delete button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteVehicle}
            >
              <Text style={styles.deleteButtonText}>Eliminar vehículo</Text>
            </TouchableOpacity>

            {/* Close */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
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
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addIcon: {
    marginLeft: -4,
    marginTop: -8,
  },
  listContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  vehicleImage: {
    width: 80,
    height: 50,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  vehicleName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  vehiclePlate: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  docsStatusContainer: {
    marginTop: 4,
  },
  docsStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docsStatusText: {
    fontSize: SIZES.small - 1,
    fontWeight: '500',
  },
  menuButton: {
    padding: SIZES.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xxl * 2,
  },
  loadingText: {
    marginTop: SIZES.md,
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xxl * 2,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
  },
  addVehicleButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
  },
  addVehicleButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SIZES.lg,
  },
  modalTitle: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  modalPlate: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  docsDetailContainer: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.lg,
  },
  docDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  docIcon: {
    marginRight: SIZES.sm,
  },
  docDetailInfo: {
    flex: 1,
  },
  docDetailLabel: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 2,
  },
  docDetailStatus: {
    fontSize: SIZES.small,
  },
  useVehicleButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  useVehicleButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  documentsButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  documentsButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: SIZES.body,
  },
});

export default VehiclesScreen;
