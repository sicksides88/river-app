import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { driverService } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import { useDriverSocket } from '../../../hooks/useSocket';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';

const { width, height } = Dimensions.get('window');

const SERVICE_OPTIONS = [
  { id: 'vuelta_segura', title: 'Vuelta Segura', icon: 'car-sport' },
  { id: 'cadete', title: 'Envío', icon: 'bicycle' },
  { id: 'chofer', title: 'Chofer', icon: 'person' },
  { id: 'fletes', title: 'Flete', icon: 'bus' },
];

const DriverHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  // Estado: false = pantalla inicial desconectado, true = en el mapa
  const [isOnline, setIsOnline] = useState(false);
  // Estado: false = no recibiendo viajes, true = recibiendo viajes activamente
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [showTripRequest, setShowTripRequest] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [driverStatus, setDriverStatus] = useState(null); // pending_documents, pending_review, active, suspended
  const [driverType, setDriverType] = useState(null); // vuelta_segura, envios, fletes, chofer
  const [activeTrip, setActiveTrip] = useState(null); // Viaje activo del conductor
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [activeServiceType, setActiveServiceType] = useState(null);
  const [selectedService, setSelectedService] = useState(null); // Selección temporal en el modal
  const [rememberService, setRememberService] = useState(false);
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);

  const [region, setRegion] = useState({
    latitude: -32.4825,
    longitude: -58.2372,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Socket para recibir solicitudes de viajes y envíos
  const { isConnected: socketConnected, goOnline, goOffline } = useDriverSocket({
    onNewRideRequest: (data) => {
      if (isActive) {
        // Formatear datos para TripRequestScreen
        const tripData = {
          rideId: data.rideId,
          type: data.serviceType || 'Vuelta segura',
          price: data.estimatedPrice,
          pickup: {
            address: data.pickup?.address,
            lat: data.pickup?.lat,
            lng: data.pickup?.lng,
          },
          dropoff: {
            address: data.dropoff?.address,
            lat: data.dropoff?.lat,
            lng: data.dropoff?.lng,
          },
          distance: data.distance,
          duration: data.duration,
          user: data.user,
          rating: data.user?.rating || 4.5,
          reviews: 0,
          timeoutSeconds: 15,
        };
        navigation.navigate('TripRequest', { trip: tripData });
      }
    },
    onNewDeliveryRequest: (data) => {
      if (isActive) {
        // Formatear datos para TripRequestScreen (mismo formato que viajes)
        const tripData = {
          deliveryId: data.deliveryId,
          rideId: data.deliveryId, // Para compatibilidad con TripRequestScreen
          isDelivery: true, // Flag para identificar que es un envío
          type: data.serviceType === 'flete' ? 'Flete' : 'Envío',
          price: data.estimatedPrice,
          pickup: {
            address: data.pickup?.address,
            lat: data.pickup?.lat,
            lng: data.pickup?.lng,
          },
          dropoff: {
            address: data.dropoff?.address,
            lat: data.dropoff?.lat,
            lng: data.dropoff?.lng,
          },
          distance: data.distance,
          packageDescription: data.packageDescription,
          packageWeight: data.packageWeight,
          packageDimensions: data.packageDimensions,
          helpers: data.helpers || 0,
          serviceType: data.serviceType,
          vehicleType: data.vehicleType,
          user: data.user,
          // No incluir rating para envíos - los clientes no tienen rating
          timeoutSeconds: 20, // Más tiempo para envíos
          vehicleId: currentVehicle?.id, // ID del vehículo actual del conductor
        };
        navigation.navigate('TripRequest', { trip: tripData });
      }
    },
    onRideTaken: () => {},
    onDeliveryTaken: () => {},
  });

  useEffect(() => {
    initializeLocation();
    AsyncStorage.getItem('driverRememberedService').then(val => {
      if (val) setActiveServiceType(val);
    });

    // Limpiar cualquier estado "disponible" que haya quedado colgado
    // (ej: app crasheó, se cerró sin desconectar, etc.)
    driverService.updateAvailability(false, 0, 0).catch(() => {});

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Recargar datos del conductor cada vez que la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      loadDriverData();
    }, [])
  );

  // Escuchar eventos de socket para actualizar el viaje activo
  useEffect(() => {
    if (!socketConnected) return;

    // Importar el socket desde el servicio
    const handleStatusChange = (data) => {
      if (activeTrip && (data.deliveryId === activeTrip.id || data.rideId === activeTrip.id)) {
        if (data.status === 'cancelled' || data.status === 'completed' || data.status === 'delivered') {
          setActiveTrip(null);
        }
      }
    };

    // No tenemos acceso directo al socket aquí, así que recargamos datos
    // cuando la pantalla recupera el foco (ya implementado arriba)
  }, [socketConnected, activeTrip]);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos de ubicación',
          'Necesitamos acceso a tu ubicación para mostrar tu posición en el mapa y recibir solicitudes de viaje.'
        );
        return;
      }

      setLocationPermission(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadDriverData = async () => {
    setLoadingVehicle(true);
    try {
      // Cargar cada dato por separado para evitar que un error cancele todo
      // Estado del conductor
      try {
        const statusResponse = await driverService.getDriverStatus();
        if (statusResponse.success) {
          setDriverStatus(statusResponse.status);
          setDriverType(statusResponse.driverType);
        }
      } catch (e) {
        console.error('Error loading driver status:', e);
      }

      // Vehículos
      try {
        const vehiclesResponse = await driverService.getVehicles();
        if (vehiclesResponse.success && vehiclesResponse.vehicles?.length > 0) {
          const approvedVehicle = vehiclesResponse.vehicles.find(
            v => v.documents_status?.all_approved === true
          );
          setCurrentVehicle(approvedVehicle || vehiclesResponse.vehicles[0]);
        } else {
          setCurrentVehicle(null);
        }
      } catch (e) {
        console.error('Error loading vehicles:', e);
        setCurrentVehicle(null);
      }

      // Viaje activo
      try {
        console.log('🔍 Calling getActiveTrip...');
        const activeTripResponse = await driverService.getActiveTrip();
        console.log('🔍 getActiveTrip response:', activeTripResponse);
        if (activeTripResponse.success && activeTripResponse.hasActiveTrip) {
          setActiveTrip(activeTripResponse.activeTrip);
        } else {
          setActiveTrip(null);
        }
      } catch (e) {
        console.error('Error loading active trip:', e);
        setActiveTrip(null);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
      setCurrentVehicle(null);
      setActiveTrip(null);
    } finally {
      setLoadingVehicle(false);
    }
  };

  const startLocationTracking = async () => {
    if (!locationPermission) return;

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 50,
      },
      async (location) => {
        const { latitude, longitude } = location.coords;

        setRegion(prev => ({
          ...prev,
          latitude,
          longitude,
        }));

        if (isActive && currentVehicle) {
          try {
            await driverService.updateAvailability(
              true,
              latitude,
              longitude,
              currentVehicle.id
            );
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }
      }
    );
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  // Ir a la pantalla del mapa (conectarse)
  const handleConnect = async () => {
    if (loadingVehicle) {
      return;
    }

    if (!currentVehicle) {
      Alert.alert(
        'Vehículo requerido',
        'Debes registrar un vehículo antes de conectarte.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Agregar vehículo', onPress: () => navigation.navigate('AddVehicle') },
        ]
      );
      return;
    }

    // Verificar si el vehículo tiene documentos aprobados
    if (currentVehicle.documents_status?.all_approved !== true) {
      Alert.alert(
        'Documentos pendientes',
        'Tu vehículo no tiene los documentos aprobados. Sube la cédula (frente y dorso) y el seguro del vehículo para poder conectarte.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver documentos', onPress: () => navigation.navigate('Documents') },
        ]
      );
      return;
    }

    // Verificar si hay servicio recordado en AsyncStorage
    const remembered = await AsyncStorage.getItem('driverRememberedService');
    if (remembered) {
      setActiveServiceType(remembered);
      setIsOnline(true);
    } else {
      // Mostrar modal de selección de servicio
      setSelectedService(null);
      setRememberService(false);
      setShowServiceModal(true);
    }
  };

  const handleServiceSelected = async (serviceId, remember) => {
    setActiveServiceType(serviceId);
    if (remember) {
      await AsyncStorage.setItem('driverRememberedService', serviceId);
    } else {
      await AsyncStorage.removeItem('driverRememberedService');
    }
    setShowServiceModal(false);
    setIsOnline(true);
  };

  const handleChangeService = async () => {
    const remembered = await AsyncStorage.getItem('driverRememberedService');
    setSelectedService(activeServiceType);
    setRememberService(!!remembered);
    setShowServiceModal(true);
  };

  // Comenzar a recibir viajes (INICIAR)
  const handleStartReceiving = async () => {
    setIsLoading(true);
    try {
      const response = await driverService.updateAvailability(
        true,
        region.latitude,
        region.longitude,
        currentVehicle.id,
        activeServiceType
      );

      if (response.success) {
        setIsActive(true);
        startLocationTracking();

        // Unirse a la room de conductores disponibles via socket
        if (socketConnected) {
          goOnline({
            latitude: region.latitude,
            longitude: region.longitude,
            serviceType: activeServiceType,
          });
        }
      } else {
        Alert.alert('Error', response.message || 'No se pudo activar. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error starting:', error);

      // Obtener mensaje de error más específico
      let errorMessage = 'Error de conexión. Verifica tu internet.';

      if (error.response) {
        // Error del servidor
        const serverMessage = error.response.data?.message;
        const debugInfo = error.response.data?.debug;

        if (error.response.status === 403) {
          // Mostrar info de debug y opción para activar
          let debugMsg = serverMessage || 'Tu cuenta de conductor no está activa.';
          if (debugInfo) {
            debugMsg += `\n\nDebug: is_driver=${debugInfo.is_driver}, driver_status=${debugInfo.driver_status}`;
          }

          Alert.alert('Cuenta no activa', debugMsg, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Activar ahora', onPress: handleDevActivate },
          ]);
          return;
        } else if (error.response.status === 401) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Error en el servidor. Intenta más tarde.';
        } else if (serverMessage) {
          errorMessage = serverMessage;
        }
      } else if (error.request) {
        // No hubo respuesta del servidor
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Desconectarse completamente (botón casa)
  const handleDisconnect = async () => {
    if (isActive) {
      try {
        await driverService.updateAvailability(
          false,
          region.latitude,
          region.longitude,
          currentVehicle?.id
        );
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
      stopLocationTracking();
      if (socketConnected) {
        goOffline();
      }
      setIsActive(false);
    }
    setIsOnline(false);
  };

  // Dejar de recibir viajes (DETENER)
  const handleStopReceiving = async () => {
    setIsLoading(true);
    try {
      await driverService.updateAvailability(
        false,
        region.latitude,
        region.longitude,
        currentVehicle?.id
      );

      setIsActive(false);
      stopLocationTracking();

      // Salir de la room de conductores disponibles via socket
      if (socketConnected) {
        goOffline();
      }
    } catch (error) {
      console.error('Error stopping:', error);
      setIsActive(false);
      stopLocationTracking();

      // Aún así intentar salir del socket
      if (socketConnected) {
        goOffline();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTrip = () => {
    setShowTripRequest(false);
    navigation.navigate('TripActive', {
      trip: currentTrip,
      isDelivery: currentTrip?.isDelivery || false,
    });
  };

  const handleRejectTrip = () => {
    setShowTripRequest(false);
    setCurrentTrip(null);
  };

  const centerOnLocation = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 500);
    }
  };

  // Auto-activar conductor (solo desarrollo)
  const handleDevActivate = async () => {
    try {
      setIsLoading(true);
      const response = await driverService.devActivate();
      if (response.success) {
        Alert.alert('Activado', 'Tu cuenta ha sido activada. Intenta conectarte nuevamente.');
      } else {
        Alert.alert('Error', response.message || 'No se pudo activar');
      }
    } catch (error) {
      console.error('Error activando:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al activar cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  // Navegar al viaje activo
  const handleActiveTripPress = () => {
    if (!activeTrip) return;

    // Formatear datos para TripActiveScreen
    const tripData = {
      id: activeTrip.id,
      deliveryId: activeTrip.type === 'delivery' ? activeTrip.id : undefined,
      type: activeTrip.serviceType === 'vuelta_segura' ? 'Vuelta segura' :
            activeTrip.serviceType === 'chofer' ? 'Chofer' :
            activeTrip.serviceType === 'flete' ? 'Flete' : 'Envío',
      price: activeTrip.price,
      status: activeTrip.status,
      payment_method: activeTrip.paymentMethod,
      pickup: {
        lat: activeTrip.pickup?.lat,
        lng: activeTrip.pickup?.lng,
        address: activeTrip.pickup?.address || activeTrip.origin,
      },
      dropoff: {
        lat: activeTrip.dropoff?.lat,
        lng: activeTrip.dropoff?.lng,
        address: activeTrip.dropoff?.address || activeTrip.destination,
      },
      user: activeTrip.user,
      // Detalles del paquete para envíos
      packageDescription: activeTrip.packageDescription,
      packageWeight: activeTrip.packageWeight,
      packageDimensions: activeTrip.packageDimensions,
      packageIsFragile: activeTrip.packageIsFragile,
    };

    navigation.navigate('TripActive', {
      trip: tripData,
      isDelivery: activeTrip.type === 'delivery',
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      accepted: 'En camino',
      arrived: 'Esperando',
      arrived_pickup: 'En punto de retiro',
      in_progress: 'En curso',
      picked_up: 'Paquete recogido',
      in_transit: 'En tránsito',
      arrived_dropoff: 'En destino',
    };
    return statusMap[status] || status;
  };

  const getServiceIcon = (serviceType) => {
    const iconMap = {
      vuelta_segura: 'car-sport-outline',
      chofer: 'person-outline',
      envio: 'cube-outline',
      flete: 'bus-outline',
    };
    return iconMap[serviceType] || 'car-outline';
  };

  // Función para obtener info del estado
  const getStatusInfo = () => {
    switch (driverStatus) {
      case 'pending_documents':
        return {
          title: 'Documentos pendientes',
          subtitle: 'Tus documentos están siendo procesados. Verifica el estado para continuar.',
          icon: 'document-text-outline',
          color: COLORS.warning,
          action: null,
        };
      case 'pending_review':
        return {
          title: 'En revisión',
          subtitle: 'Tus documentos están siendo revisados. Te notificaremos cuando tu cuenta sea aprobada.',
          icon: 'time-outline',
          color: COLORS.info,
          action: null,
        };
      case 'suspended':
        return {
          title: 'Cuenta suspendida',
          subtitle: 'Tu cuenta ha sido suspendida. Contacta a soporte para más información.',
          icon: 'alert-circle-outline',
          color: COLORS.error,
          action: { text: 'Contactar soporte', screen: 'Support' },
        };
      default:
        return null;
    }
  };

  // Bloquear si documentos no aprobados o cuenta suspendida
  if (driverStatus && driverStatus !== 'active') {
    const statusInfo = getStatusInfo();
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.pendingContainer}>
          <View style={[styles.pendingIconContainer, { backgroundColor: statusInfo.color + '20' }]}>
            <Ionicons name={statusInfo.icon} size={64} color={statusInfo.color} />
          </View>
          <Text style={styles.pendingTitle}>{statusInfo.title}</Text>
          <Text style={styles.pendingSubtitle}>{statusInfo.subtitle}</Text>

          {statusInfo.action && (
            <TouchableOpacity
              style={[styles.pendingButton, { backgroundColor: statusInfo.color }]}
              onPress={() => navigation.navigate(statusInfo.action.screen, {
                type: 'profile',
                serviceType: driverType,
              })}
              activeOpacity={0.8}
            >
              <Text style={styles.pendingButtonText}>{statusInfo.action.text}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadDriverData}
            disabled={loadingVehicle}
          >
            {loadingVehicle ? (
              <ActivityIndicator size="small" color={COLORS.textSecondary} />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.refreshButtonText}>Verificar estado</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Pantalla inicial - Desconectado
  if (!isOnline) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>Estás desconectado</Text>
          <Text style={styles.disconnectedSubtitle}>¿Todo listo para viajar?</Text>

          {/* Banner de viaje activo */}
          {activeTrip && (
            <TouchableOpacity
              style={styles.activeTripBanner}
              onPress={handleActiveTripPress}
              activeOpacity={0.9}
            >
              <View style={styles.activeTripLeft}>
                <View style={styles.activeTripIconContainer}>
                  <Ionicons
                    name={getServiceIcon(activeTrip.serviceType)}
                    size={24}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.activeTripInfo}>
                  <Text style={styles.activeTripTitle}>
                    {activeTrip.type === 'delivery' ? 'Envío en curso' : 'Viaje en curso'}
                  </Text>
                  <Text style={styles.activeTripStatus} numberOfLines={1}>
                    {getStatusText(activeTrip.status)}
                  </Text>
                  {activeTrip.destination && (
                    <Text style={styles.activeTripDestination} numberOfLines={1}>
                      {activeTrip.destination}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.activeTripRight}>
                <Text style={styles.activeTripPrice}>
                  ${activeTrip.price?.toLocaleString('es-AR') || '0'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.mapPreviewContainer}>
            <MapView
              ref={mapRef}
              style={styles.mapPreview}
              provider={PROVIDER_GOOGLE}
              region={region}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
                <View style={styles.locationMarker}>
                  <Ionicons name="navigate" size={20} color={COLORS.text} />
                </View>
              </Marker>
            </MapView>
          </View>

          {/* Indicador de servicio recordado */}
          {activeServiceType && (
            <TouchableOpacity
              style={styles.rememberedServiceRow}
              onPress={handleChangeService}
              activeOpacity={0.7}
            >
              <View style={styles.rememberedServiceLeft}>
                <Ionicons
                  name={SERVICE_OPTIONS.find(s => s.id === activeServiceType)?.icon || 'car-sport'}
                  size={18}
                  color={COLORS.text}
                />
                <Text style={styles.rememberedServiceText}>
                  {SERVICE_OPTIONS.find(s => s.id === activeServiceType)?.title || activeServiceType}
                </Text>
              </View>
              <Text style={styles.rememberedServiceChange}>Cambiar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.connectButton, isLoading && styles.buttonDisabled]}
            onPress={handleConnect}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.connectButtonText}>Conectarse</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal de selección de servicio */}
        <Modal
          visible={showServiceModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowServiceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.serviceModalCard}>
              <View style={styles.serviceModalHeader}>
                <Text style={styles.serviceModalTitle}>
                  ¿Con qué servicio querés conectarte?
                </Text>
                <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                  <Ionicons name="close" size={28} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.serviceOptionsList}>
                {SERVICE_OPTIONS.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceOption,
                      selectedService === service.id && styles.serviceOptionSelected,
                    ]}
                    onPress={() => setSelectedService(service.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.serviceOptionLeft}>
                      <View style={[
                        styles.serviceOptionIcon,
                        selectedService === service.id && styles.serviceOptionIconSelected,
                      ]}>
                        <Ionicons
                          name={service.icon}
                          size={24}
                          color={selectedService === service.id ? COLORS.white : COLORS.text}
                        />
                      </View>
                      <Text style={[
                        styles.serviceOptionTitle,
                        selectedService === service.id && styles.serviceOptionTitleSelected,
                      ]}>
                        {service.title}
                      </Text>
                    </View>
                    <View style={[
                      styles.radioOuter,
                      selectedService === service.id && styles.radioOuterSelected,
                    ]}>
                      {selectedService === service.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.rememberRow}>
                <Text style={styles.rememberText}>Recordar mi elección</Text>
                <Switch
                  value={rememberService}
                  onValueChange={setRememberService}
                  trackColor={{ false: COLORS.border, true: COLORS.text }}
                  thumbColor={COLORS.white}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.serviceModalButton,
                  !selectedService && styles.serviceModalButtonDisabled,
                ]}
                onPress={() => selectedService && handleServiceSelected(selectedService, rememberService)}
                disabled={!selectedService}
                activeOpacity={0.8}
              >
                <Text style={styles.serviceModalButtonText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Pantalla del mapa - Conectado
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.fullMap}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
          <View style={styles.locationMarker}>
            <Ionicons name="navigate" size={20} color={COLORS.text} />
          </View>
        </Marker>
      </MapView>

      {/* Header overlay */}
      <SafeAreaView style={styles.headerOverlay} edges={['top', 'bottom']}>
        <TouchableOpacity
          style={styles.homeIcon}
          onPress={handleDisconnect}
        >
          <Ionicons name="home-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.earningsBadge}>
          <Text style={styles.earningsText}>
            ${earnings.toFixed(2).replace('.', ',')}
          </Text>
        </View>
      </SafeAreaView>

      {/* Banner de viaje/envío activo en el mapa */}
      {activeTrip && (
        <TouchableOpacity
          style={styles.activeTripBannerMap}
          onPress={handleActiveTripPress}
          activeOpacity={0.9}
        >
          <View style={styles.activeTripLeft}>
            <View style={styles.activeTripIconContainer}>
              <Ionicons
                name={getServiceIcon(activeTrip.serviceType)}
                size={24}
                color={COLORS.white}
              />
            </View>
            <View style={styles.activeTripInfo}>
              <Text style={styles.activeTripTitle}>
                {activeTrip.type === 'delivery' ? 'Envío en curso' : 'Viaje en curso'}
              </Text>
              <Text style={styles.activeTripStatus} numberOfLines={1}>
                {getStatusText(activeTrip.status)}
              </Text>
              {activeTrip.destination && (
                <Text style={styles.activeTripDestination} numberOfLines={1}>
                  → {activeTrip.destination}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.activeTripRight}>
            <Text style={styles.activeTripPrice}>
              ${activeTrip.price?.toLocaleString('es-AR') || '0'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
          </View>
        </TouchableOpacity>
      )}

      {/* Botón central INICIAR/DETENER */}
      <View style={styles.centerButtonContainer}>
        <TouchableOpacity
          style={[styles.centerButton, isLoading && styles.buttonDisabled]}
          onPress={isActive ? handleStopReceiving : handleStartReceiving}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.centerButtonText}>
              {isActive ? 'DETENER' : 'INICIAR'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Botón ubicación */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={centerOnLocation}
        >
          <Ionicons name="locate" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Footer status */}
      <View style={styles.statusFooter}>
        <Text style={styles.statusText}>
          {isActive ? 'Estás conectado' : 'Estás desconectado'}
        </Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Modal de solicitud de viaje */}
      <Modal
        visible={showTripRequest}
        transparent
        animationType="slide"
        onRequestClose={handleRejectTrip}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.tripRequestCard}>
            <View style={styles.tripTypeRow}>
              <View style={styles.tripTypeBadge}>
                <Text style={styles.tripTypeText}>{currentTrip?.type || 'Vuelta segura'}</Text>
              </View>
              <TouchableOpacity onPress={handleRejectTrip}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.tripPrice}>
              ${currentTrip?.price?.toLocaleString('es-AR') || '2.919'}
            </Text>

            {/* Solo mostrar rating para viajes, no para envíos */}
            {!currentTrip?.isDelivery && currentTrip?.rating && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={COLORS.text} />
                <Text style={styles.ratingText}>
                  {currentTrip?.rating} {currentTrip?.reviews ? `(${currentTrip.reviews})` : ''}
                </Text>
              </View>
            )}

            <View style={styles.locationsContainer}>
              <View style={styles.locationRow}>
                <View style={styles.originDot} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Punto de partida</Text>
                  <Text style={styles.locationValue}>
                    A {currentTrip?.pickup?.time || '17'} min ({currentTrip?.pickup?.distance || '7.1'} km)
                  </Text>
                </View>
              </View>

              <View style={styles.locationLine} />

              <View style={styles.locationRow}>
                <View style={styles.destinationDot} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Destino</Text>
                  <Text style={styles.locationValue}>
                    Viaje {currentTrip?.destination?.time || '14'} min ({currentTrip?.destination?.distance || '7.1'} km)
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAcceptTrip}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Estado desconectado
  disconnectedContainer: {
    flex: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl,
  },
  disconnectedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  disconnectedSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.lg,
  },

  // Active Trip Banner
  activeTripBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.text,
    marginBottom: SIZES.md,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    ...SHADOWS.md,
  },
  // Active Trip Banner en el mapa (posición absoluta)
  activeTripBannerMap: {
    position: 'absolute',
    top: 100,
    left: SIZES.screenPadding,
    right: SIZES.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.text,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    ...SHADOWS.lg,
  },
  activeTripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeTripIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  activeTripInfo: {
    flex: 1,
  },
  activeTripTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  activeTripStatus: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  activeTripDestination: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  activeTripRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SIZES.sm,
  },
  activeTripPrice: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.white,
    marginRight: SIZES.xs,
  },

  // Estado pendiente/suspendido
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding * 2,
  },
  pendingIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  pendingTitle: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  pendingSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.xl,
  },
  pendingButton: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.xl,
    borderRadius: SIZES.radiusFull,
    marginBottom: SIZES.lg,
  },
  pendingButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    gap: SIZES.xs,
  },
  refreshButtonText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
  },

  mapPreviewContainer: {
    flex: 1,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    marginBottom: SIZES.lg,
  },
  mapPreview: {
    flex: 1,
  },
  rememberedServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusFull,
    marginBottom: SIZES.sm,
  },
  rememberedServiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  rememberedServiceText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  rememberedServiceChange: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: COLORS.text,
    paddingVertical: SIZES.md + 2,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  connectButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },

  // Estado conectado - mapa
  fullMap: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
  },
  homeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  earningsBadge: {
    backgroundColor: COLORS.text,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    marginLeft: SIZES.sm,
  },
  earningsText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },

  // Botón central
  centerButtonContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  centerButton: {
    backgroundColor: COLORS.text,
    paddingHorizontal: SIZES.xl + 8,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
  },
  centerButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '700',
    letterSpacing: 1,
  },
  locationButton: {
    position: 'absolute',
    right: SIZES.screenPadding,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },

  // Footer status
  statusFooter: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.screenPadding,
  },
  statusText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterButton: {
    position: 'absolute',
    right: SIZES.screenPadding,
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  // Location marker
  locationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.text,
  },

  // Modal solicitud viaje
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  tripRequestCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  tripTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  tripTypeBadge: {
    backgroundColor: COLORS.text,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
  },
  tripTypeText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  tripPrice: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    marginBottom: SIZES.lg,
  },
  ratingText: {
    fontSize: SIZES.small,
    color: COLORS.text,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Ubicaciones
  locationsContainer: {
    marginBottom: SIZES.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.text,
    backgroundColor: 'transparent',
    marginTop: 4,
    marginRight: SIZES.sm,
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.text,
    marginTop: 4,
    marginRight: SIZES.sm,
  },
  locationLine: {
    width: 0,
    height: 20,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginLeft: 4,
    marginVertical: SIZES.xs,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Botón aceptar
  acceptButton: {
    backgroundColor: COLORS.text,
    paddingVertical: SIZES.md + 2,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },

  // Modal selección de servicio
  serviceModalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  serviceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  serviceModalTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: SIZES.sm,
  },
  serviceOptionsList: {
    marginBottom: SIZES.lg,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.xs,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  serviceOptionSelected: {
    borderColor: COLORS.text,
    backgroundColor: COLORS.backgroundInput,
  },
  serviceOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  serviceOptionIconSelected: {
    backgroundColor: COLORS.text,
  },
  serviceOptionTitle: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  serviceOptionTitleSelected: {
    fontWeight: '600',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.text,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.text,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  rememberText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  serviceModalButton: {
    backgroundColor: COLORS.text,
    paddingVertical: SIZES.md + 2,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  serviceModalButtonDisabled: {
    opacity: 0.4,
  },
  serviceModalButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default DriverHomeScreen;
