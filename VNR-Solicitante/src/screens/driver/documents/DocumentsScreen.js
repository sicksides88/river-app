import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import driverService from '../../../services/driver.service';

const DocumentsScreen = ({ navigation }) => {
  const [personalDocs, setPersonalDocs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Cargar documentos y vehículos en paralelo
      const [docsResponse, vehiclesResponse] = await Promise.all([
        driverService.getDocuments(),
        driverService.getVehicles(),
      ]);

      // Procesar documentos personales
      if (docsResponse.success && docsResponse.documents) {
        const docs = docsResponse.documents;
        const mappedPersonalDocs = [];

        // Mapear documentos a formato UI
        const docTypeMap = {
          'dni_front': { title: 'DNI (Frente)', order: 1 },
          'dni_back': { title: 'DNI (Dorso)', order: 2 },
          'license_front': { title: 'Licencia de Conducir (Frente)', order: 3 },
          'license_back': { title: 'Licencia de Conducir (Dorso)', order: 4 },
          'selfie_verification': { title: 'Foto de perfil', order: 5 },
          'buena_conducta': { title: 'Certificado de buena conducta', order: 6 },
          'seguro_accidentes': { title: 'Seguro de accidentes personales', order: 7 },
          'criminal_record': { title: 'Certificado de Antecedentes Penales', order: 8 },
        };

        docs.forEach(doc => {
          if (docTypeMap[doc.document_type]) {
            const statusMap = {
              'approved': { status: 'complete', statusText: 'Completo' },
              'pending': { status: 'pending', statusText: 'Pendiente de revisión' },
              'rejected': { status: 'rejected', statusText: 'Rechazado' },
            };

            // Verificar si está por vencer (30 días)
            let statusInfo = statusMap[doc.status] || { status: 'pending', statusText: 'Pendiente' };
            if (doc.expires_at) {
              const expiresDate = new Date(doc.expires_at);
              const today = new Date();
              const daysUntilExpiry = Math.ceil((expiresDate - today) / (1000 * 60 * 60 * 24));
              if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                statusInfo = {
                  status: 'expiring',
                  statusText: `Vence el ${expiresDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`
                };
              }
            }

            mappedPersonalDocs.push({
              id: doc.id,
              title: docTypeMap[doc.document_type].title,
              order: docTypeMap[doc.document_type].order,
              ...statusInfo,
            });
          }
        });

        // Ordenar por orden definido
        mappedPersonalDocs.sort((a, b) => a.order - b.order);
        setPersonalDocs(mappedPersonalDocs);
      }

      // Procesar vehículos con sus documentos reales
      if (vehiclesResponse.success && vehiclesResponse.vehicles) {
        const mappedVehicles = vehiclesResponse.vehicles.map(vehicle => {
          const docsStatus = vehicle.documents_status || {};

          // Mapear estado del backend a UI
          const getDocStatus = (status) => {
            switch (status) {
              case 'approved': return { status: 'complete', statusText: 'Aprobado' };
              case 'pending': return { status: 'pending', statusText: 'Pendiente de revisión' };
              case 'rejected': return { status: 'rejected', statusText: 'Rechazado' };
              default: return { status: 'missing', statusText: 'Sin subir' };
            }
          };

          const registrationFrontStatus = getDocStatus(docsStatus.registration_front_status);
          const registrationBackStatus = getDocStatus(docsStatus.registration_back_status);
          const insuranceStatus = getDocStatus(docsStatus.insurance_status);

          return {
            id: vehicle.id,
            name: `${vehicle.brand} ${vehicle.model} - ${vehicle.year}`,
            plate: vehicle.plate_number,
            is_verified: vehicle.is_verified,
            all_approved: docsStatus.all_approved || false,
            documents: [
              {
                id: vehicle.documents?.registration_front?.id || `registration_front_${vehicle.id}`,
                type: 'vehicle_registration_front',
                title: 'Cédula del vehículo (Frente)',
                ...registrationFrontStatus,
                vehicleId: vehicle.id,
              },
              {
                id: vehicle.documents?.registration_back?.id || `registration_back_${vehicle.id}`,
                type: 'vehicle_registration_back',
                title: 'Cédula del vehículo (Dorso)',
                ...registrationBackStatus,
                vehicleId: vehicle.id,
              },
              {
                id: vehicle.documents?.insurance?.id || `insurance_${vehicle.id}`,
                type: 'vehicle_insurance',
                title: 'Seguro del vehículo',
                ...insuranceStatus,
                vehicleId: vehicle.id,
              },
            ],
            expanded: false,
          };
        });
        setVehicles(mappedVehicles);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recargar cuando se vuelve a la pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const toggleVehicle = (vehicleId) => {
    setVehicles(vehicles.map(v =>
      v.id === vehicleId ? { ...v, expanded: !v.expanded } : v
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete':
        return '#34C759'; // Verde
      case 'expiring':
        return '#FF9500'; // Naranja
      case 'pending':
        return '#FF9500'; // Naranja
      case 'rejected':
        return '#FF3B30'; // Rojo
      case 'missing':
        return COLORS.textMuted; // Gris
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'rejected':
        return 'close-circle';
      case 'missing':
        return 'cloud-upload-outline';
      default:
        return 'ellipse-outline';
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
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando documentos...</Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        <Text style={styles.title}>Documentos</Text>
        <Text style={styles.subtitle}>
          Administra los documentos laborales y del vehículo
        </Text>

        {/* Sección Viajes (documentos personales) */}
        {personalDocs.length > 0 && (
          <Text style={styles.sectionTitle}>Documentos personales</Text>
        )}

        {personalDocs.length > 0 && (
          <View style={styles.card}>
            {personalDocs.map((doc, idx) => (
              <View key={doc.id} style={[styles.documentItem, idx > 0 && styles.rowDivider]}>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>{doc.title}</Text>
                  <Text style={[styles.documentStatus, { color: getStatusColor(doc.status) }]}>
                    {doc.statusText}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Vehículos con documentos */}
        {vehicles.length > 0 && (
          <Text style={styles.sectionTitle}>Documentos de vehículos</Text>
        )}

        {vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.vehicleContainer}>
            {/* Vehicle header */}
            <TouchableOpacity
              style={styles.vehicleItem}
              onPress={() => toggleVehicle(vehicle.id)}
              activeOpacity={0.7}
            >
              {/* Vehicle image placeholder */}
              <View style={styles.vehicleImage}>
                <Ionicons name="car-sport" size={32} color={COLORS.textMuted} />
              </View>

              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <View style={styles.vehicleStatusRow}>
                  <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
                  {vehicle.all_approved ? (
                    <View style={styles.vehicleStatusBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                      <Text style={[styles.vehicleStatusText, { color: '#34C759' }]}>Completo</Text>
                    </View>
                  ) : (
                    <View style={styles.vehicleStatusBadge}>
                      <Ionicons name="alert-circle" size={14} color="#FF9500" />
                      <Text style={[styles.vehicleStatusText, { color: '#FF9500' }]}>Pendiente</Text>
                    </View>
                  )}
                </View>
              </View>

              <Ionicons
                name={vehicle.expanded ? "chevron-up" : "chevron-down"}
                size={24}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            {/* Vehicle documents (expanded) */}
            {vehicle.expanded && vehicle.documents.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.vehicleDocItem}
                activeOpacity={0.7}
                onPress={() => {
                  // Navegar a subir documento
                  navigation.navigate('UploadDocument', {
                    documentType: doc.type,
                    vehicleId: doc.vehicleId,
                    documentTitle: doc.title,
                    currentStatus: doc.status,
                  });
                }}
              >
                <Ionicons
                  name={getStatusIcon(doc.status)}
                  size={20}
                  color={getStatusColor(doc.status)}
                  style={styles.docIcon}
                />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>{doc.title}</Text>
                  <Text style={[styles.documentStatus, { color: getStatusColor(doc.status) }]}>
                    {doc.statusText}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Mensaje si no hay datos */}
        {personalDocs.length === 0 && vehicles.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color={'rgba(255,255,255,0.55)'} />
            <Text style={styles.emptyText}>No tienes documentos cargados</Text>
          </View>
        )}
      </ScrollView>
      )}
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
    paddingBottom: SIZES.xxl,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: SIZES.small,
  },
  vehicleContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  vehicleImage: {
    width: 60,
    height: 40,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  vehiclePlate: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginRight: SIZES.sm,
  },
  vehicleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  vehicleStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vehicleStatusText: {
    fontSize: SIZES.small - 1,
    fontWeight: '500',
  },
  docIcon: {
    marginRight: SIZES.sm,
  },
  vehicleDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingLeft: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
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
  },
});

export default DocumentsScreen;
