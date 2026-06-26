import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { rideService, deliveryService, mapsService } from '../../../services';
import { useDriverLocationSender } from '../../../hooks';
import { useSocketContext } from '../../../context/SocketContext';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import NavigationSelector from '../../../components/driver/NavigationSelector';
import { MapViewWrapper } from '../../../components/common';
import DeliveryCodeModal from '../../../components/modals/DeliveryCodeModal';

const TripActiveScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { trip, isDelivery } = route.params || {};

  // Mapear el estado del backend al estado interno de la pantalla
  const getInitialTripStatus = () => {
    const backendStatus = trip?.status;
    if (!backendStatus) return 'going_pickup';

    // Estados de rides (soporta guión y guión bajo)
    if (['pending', 'confirmed', 'accepted', 'driver-assigned', 'driver_assigned'].includes(backendStatus)) {
      return 'going_pickup';
    }
    if (['driver-arrived', 'driver_arrived', 'arrived'].includes(backendStatus)) {
      return 'at_pickup';
    }
    if (['in-progress', 'in_progress'].includes(backendStatus)) {
      return 'in_progress';
    }
    // Estados de deliveries
    if (['arrived_pickup'].includes(backendStatus)) {
      return 'at_pickup';
    }
    if (['picked_up', 'in_transit', 'arrived_dropoff'].includes(backendStatus)) {
      return 'in_progress';
    }
    if (backendStatus === 'delivered' || backendStatus === 'completed') {
      return 'completed';
    }
    return 'going_pickup';
  };

  const [tripStatus, setTripStatus] = useState(getInitialTripStatus); // going_pickup, at_pickup, in_progress, completed
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [navigationMode, setNavigationMode] = useState(true); // GPS navigation mode by default
  const [eta, setEta] = useState(null); // ETA en minutos
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);
  const lastLocationSentRef = useRef(0);
  const lastEtaUpdateRef = useRef(0);
  const { socket, isConnected } = useSocketContext();

  // ID del viaje/envío
  const tripId = isDelivery ? (trip?.deliveryId || trip?.id) : trip?.id;

  // Coordenadas de pickup y dropoff (soporta múltiples formatos)
  const pickupCoords = useMemo(() => {
    const pickup = trip?.pickup || trip?.origin;
    if (!pickup) return null;

    // Formato: pickup.lat, pickup.lng
    if (pickup.lat && pickup.lng) {
      return { lat: pickup.lat, lng: pickup.lng };
    }
    // Formato: pickup.latitude, pickup.longitude
    if (pickup.latitude && pickup.longitude) {
      return { lat: pickup.latitude, lng: pickup.longitude };
    }
    // Formato: pickup.coordinates.lat, pickup.coordinates.lng
    if (pickup.coordinates?.lat && pickup.coordinates?.lng) {
      return { lat: pickup.coordinates.lat, lng: pickup.coordinates.lng };
    }
    return null;
  }, [trip]);

  const dropoffCoords = useMemo(() => {
    const dropoff = trip?.dropoff || trip?.destination;
    if (!dropoff) return null;

    // Formato: dropoff.lat, dropoff.lng
    if (dropoff.lat && dropoff.lng) {
      return { lat: dropoff.lat, lng: dropoff.lng };
    }
    // Formato: dropoff.latitude, dropoff.longitude
    if (dropoff.latitude && dropoff.longitude) {
      return { lat: dropoff.latitude, lng: dropoff.longitude };
    }
    // Formato: dropoff.coordinates.lat, dropoff.coordinates.lng
    if (dropoff.coordinates?.lat && dropoff.coordinates?.lng) {
      return { lat: dropoff.coordinates.lat, lng: dropoff.coordinates.lng };
    }
    return null;
  }, [trip]);


  // Helper para calcular distancia entre dos puntos (en metros)
  const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Radio de la tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Origen y destino del mapa - depende del estado del viaje
  // - Yendo al pickup: mostrar ruta conductor → pickup (o pickup → dropoff si no hay ubicación)
  // - Después de pickup: mostrar ruta conductor → dropoff
  const mapOrigin = useMemo(() => {
    const isGoingToPickup = tripStatus === 'going_pickup' || tripStatus === 'confirmed' || tripStatus === 'accepted';
    const currentDest = isGoingToPickup ? pickupCoords : dropoffCoords;

    // Si tenemos ubicación actual
    if (currentLocation && currentDest) {
      // Calcular distancia al destino
      const distance = getDistanceMeters(
        currentLocation.latitude, currentLocation.longitude,
        currentDest.lat, currentDest.lng
      );

      // Si estamos muy cerca del destino (< 100m), mostrar ruta estática para que se vea
      if (distance < 100) {
        return pickupCoords ? { ...pickupCoords, title: 'Punto de retiro' } : null;
      }

      return {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        title: 'Tu ubicación'
      };
    }
    // Sin ubicación actual, mostrar ruta estática pickup → dropoff
    return pickupCoords ? { ...pickupCoords, title: 'Punto de retiro' } : null;
  }, [pickupCoords, dropoffCoords, currentLocation, tripStatus]);

  const mapDestination = useMemo(() => {
    // Solo cuando está yendo al pickup (antes de llegar)
    const isGoingToPickup = tripStatus === 'going_pickup' || tripStatus === 'confirmed' || tripStatus === 'accepted';

    // Si tenemos ubicación actual
    if (currentLocation) {
      // Si vamos al pickup, destino es pickup
      if (isGoingToPickup) {
        return pickupCoords ? { ...pickupCoords, title: 'Punto de retiro' } : null;
      }
      // Ya llegó al pickup o está en camino al dropoff, destino es dropoff
      return dropoffCoords ? { ...dropoffCoords, title: 'Punto de entrega' } : null;
    }
    // Sin ubicación actual, mostrar ruta estática pickup → dropoff
    return dropoffCoords ? { ...dropoffCoords, title: 'Punto de entrega' } : null;
  }, [pickupCoords, dropoffCoords, tripStatus, currentLocation]);

  // Marcadores adicionales - mostrar el punto de entrega cuando vamos al pickup
  const additionalMarkers = useMemo(() => {
    const markers = [];
    const isGoingToPickup = tripStatus === 'going_pickup' || tripStatus === 'confirmed' || tripStatus === 'accepted';

    // Si estamos yendo al pickup, mostrar el dropoff como marcador adicional
    if (isGoingToPickup) {
      if (dropoffCoords) {
        markers.push({
          id: 'dropoff',
          coordinate: {
            latitude: dropoffCoords.lat,
            longitude: dropoffCoords.lng,
          },
          title: 'Punto de entrega',
          color: '#FF3B30', // Rojo para destino
        });
      }
    } else {
      // Ya llegó al pickup o está en camino al dropoff, mostrar pickup como referencia
      if (pickupCoords) {
        markers.push({
          id: 'pickup',
          coordinate: {
            latitude: pickupCoords.lat,
            longitude: pickupCoords.lng,
          },
          title: 'Punto de retiro',
          color: '#888888', // Gris para indicar que ya pasó
        });
      }
    }

    return markers;
  }, [tripStatus, pickupCoords, dropoffCoords]);

  // Broadcast driver location to passenger in real-time
  // Active while trip is not completed
  const isTrackingActive = tripStatus !== 'completed' && !!trip?.id;
  const { isSending, isConnected: isSocketConnected } = useDriverLocationSender(
    trip?.id,
    isTrackingActive,
    5000 // Send location every 5 seconds
  );

  // Sincronizar tripStatus cuando cambian los params de navegación (ej: desde el banner)
  useEffect(() => {
    if (trip?.status) {
      const mappedStatus = (() => {
        const backendStatus = trip.status;
        if (['confirmed', 'accepted'].includes(backendStatus)) return 'going_pickup';
        if (backendStatus === 'arrived_pickup') return 'at_pickup';
        if (['picked_up', 'in_transit', 'arrived_dropoff'].includes(backendStatus)) return 'in_progress';
        if (backendStatus === 'delivered' || backendStatus === 'completed') return 'completed';
        return 'going_pickup';
      })();

      if (mappedStatus !== tripStatus) {
        setTripStatus(mappedStatus);
      }
    }
  }, [trip?.status]);

  useEffect(() => {
    startLocationTracking();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // La cancelación del usuario se maneja de forma global en useDriverSocket
  // (DriverHomeScreen) para que el chofer se entere esté en la pantalla que esté.

  // Enviar ubicación al usuario via socket
  const sendLocationToUser = useCallback((lat, lng, heading) => {
    if (!isConnected || !socket || tripStatus === 'completed') return;

    const now = Date.now();
    // Enviar cada 5 segundos máximo
    if (now - lastLocationSentRef.current < 5000) return;
    lastLocationSentRef.current = now;

    if (isDelivery && tripId) {
      // Para envíos, usar el evento de delivery
      socket.emit('delivery:location_update', {
        deliveryId: tripId,
        lat,
        lng,
        heading,
      });
    } else if (tripId) {
      // Para viajes, usar el evento de location:update que espera el backend
      socket.emit('location:update', {
        rideId: tripId,
        latitude: lat,
        longitude: lng,
        heading,
      });
    }
  }, [isConnected, socket, tripId, isDelivery, tripStatus]);

  // Calcular ETA hacia el destino actual
  const calculateETA = useCallback(async (location) => {
    const now = Date.now();
    // Calcular ETA cada 30 segundos máximo
    if (now - lastEtaUpdateRef.current < 30000) return;
    lastEtaUpdateRef.current = now;

    // Determinar destino según estado del viaje
    const isGoingToPickup = tripStatus === 'going_pickup' || tripStatus === 'at_pickup' ||
                            tripStatus === 'confirmed' || tripStatus === 'accepted' ||
                            tripStatus === 'arrived_pickup';

    const destCoords = isGoingToPickup ? pickupCoords : dropoffCoords;

    if (!destCoords || !location) return;

    try {
      const etaData = await mapsService.calculateETA(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: destCoords.lat, longitude: destCoords.lng }
      );

      if (etaData?.duration?.value) {
        const minutes = Math.ceil(etaData.duration.value / 60);
        setEta(minutes);
      }
    } catch (error) {
      console.error('Error calculating ETA:', error);
    }
  }, [tripStatus, pickupCoords, dropoffCoords]);

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const initialLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading || 0,
      };

      setCurrentLocation(initialLocation);
      // Enviar ubicación inicial
      sendLocationToUser(initialLocation.latitude, initialLocation.longitude, initialLocation.heading);
      // Calcular ETA inicial
      calculateETA(initialLocation);

      // Suscribirse a actualizaciones de ubicación
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (loc) => {
          const newLocation = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading || 0,
          };
          setCurrentLocation(newLocation);
          // Enviar ubicación actualizada al usuario
          sendLocationToUser(newLocation.latitude, newLocation.longitude, newLocation.heading);
          // Actualizar ETA
          calculateETA(newLocation);
        }
      );
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleArrivePickup = async () => {
    if (!trip?.id && !trip?.deliveryId) {
      setTripStatus('at_pickup');
      return;
    }

    setIsLoading(true);
    try {
      if (isDelivery) {
        const deliveryId = trip.deliveryId || trip.id;
        const response = await deliveryService.updateDeliveryStatus(deliveryId, 'arrived_pickup');
        if (response.success) {
          setTripStatus('at_pickup');
        } else {
          Alert.alert('Error', response.message || 'No se pudo actualizar el estado');
        }
      } else {
        const response = await rideService.updateRideStatus(trip.id, 'arrived');
        if (response.success) {
          setTripStatus('at_pickup');
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrip = async () => {
    if (!trip?.id && !trip?.deliveryId) {
      setTripStatus('in_progress');
      return;
    }

    setIsLoading(true);
    try {
      if (isDelivery) {
        const deliveryId = trip.deliveryId || trip.id;
        // Para envíos: picked_up -> in_transit
        await deliveryService.updateDeliveryStatus(deliveryId, 'picked_up');
        const response = await deliveryService.updateDeliveryStatus(deliveryId, 'in_transit');
        if (response.success) {
          setTripStatus('in_progress');
        } else {
          Alert.alert('Error', response.message || 'No se pudo iniciar el envío');
        }
      } else {
        const response = await rideService.updateRideStatus(trip.id, 'in_progress');
        if (response.success) {
          setTripStatus('in_progress');
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!trip?.id && !trip?.deliveryId) {
      showCompletionAlert();
      return;
    }

    // Envíos: pedir el código de entrega (PIN) antes de cerrar. Salvo envíos
    // viejos sin código (requiresDeliveryCode === false), que se cierran directo.
    if (isDelivery && trip?.requiresDeliveryCode !== false) {
      setShowCodeModal(true);
      return;
    }

    setIsLoading(true);
    try {
      if (isDelivery) {
        const deliveryId = trip.deliveryId || trip.id;
        const response = await deliveryService.updateDeliveryStatus(deliveryId, 'delivered');
        if (response.success) {
          showCompletionAlert(response.paymentMethod, response.delivery);
        } else {
          Alert.alert('Error', response.message || 'No se pudo completar el envío');
        }
      } else {
        const response = await rideService.updateRideStatus(trip.id, 'completed');
        if (response.success) {
          showCompletionAlert(response.paymentMethod, response.ride);
        }
      }
    } catch (error) {
      console.error('Error completing trip:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmar entrega con el PIN que dicta quien recibe el paquete. El backend
  // valida el código; si es incorrecto, lanza para que el modal muestre el error.
  const submitDeliveryCode = async (pin) => {
    const deliveryId = trip.deliveryId || trip.id;
    let response;
    try {
      response = await deliveryService.updateDeliveryStatus(deliveryId, 'delivered', pin);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Código incorrecto');
    }
    if (!response.success) {
      throw new Error(response.message || 'No se pudo completar el envío');
    }
    setShowCodeModal(false);
    showCompletionAlert(response.paymentMethod, response.delivery);
  };

  const showCompletionAlert = (apiPaymentMethod, responseData) => {
    setTripStatus('completed');
    const paymentMethod = apiPaymentMethod || trip?.payment_method || trip?.paymentMethod || 'cash';
    // Navigate to completion screen instead of showing Alert
    navigation.replace('TripCompleted', {
      trip: {
        ...trip,
        pickup: trip?.pickup || trip?.origin,
        dropoff: trip?.dropoff || trip?.destination,
        // Incluir datos actualizados de la respuesta del API (precio con descuento)
        actualPrice: responseData?.actualPrice ?? trip?.actualPrice,
        estimatedPrice: responseData?.estimatedPrice ?? trip?.estimatedPrice,
        cashDiscountPercentage: responseData?.cashDiscountPercentage || 0,
        cashDiscountAmount: responseData?.cashDiscountAmount || 0,
      },
      isDelivery,
      paymentPending: paymentMethod === 'mercadopago',
    });
  };

  const handleCancel = () => {
    Alert.alert(
      isDelivery ? 'Cancelar envío' : 'Cancelar viaje',
      isDelivery ? '¿Estás seguro que quieres cancelar este envío?' : '¿Estás seguro que quieres cancelar este viaje?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => {
            // Navegar a pantalla de razón de cancelación
            navigation.navigate('CancelTrip', {
              trip: {
                ...trip,
                deliveryId: trip?.deliveryId || trip?.id,
              },
              isDelivery,
            });
          },
        },
      ]
    );
  };

  const handleCallPassenger = () => {
    const phone = trip?.user?.telefono_numero || trip?.passenger?.phone || trip?.passengerPhone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Info', 'No hay número de teléfono disponible');
    }
  };

  const handleMessagePassenger = () => {
    // Navegar al chat in-app
    if (trip?.id) {
      const passengerName = trip?.user?.nombre || trip?.passenger?.name || 'Pasajero';
      const passengerAvatar = trip?.user?.avatar || trip?.passenger?.photo;
      navigation.navigate('Chat', {
        rideId: trip.id,
        otherUserName: passengerName,
        otherUserAvatar: passengerAvatar,
      });
    } else {
      // Fallback a SMS
      const phone = trip?.user?.telefono_numero || trip?.passenger?.phone;
      if (phone) {
        Linking.openURL(`sms:${phone}`);
      } else {
        Alert.alert('Info', 'Chat no disponible');
      }
    }
  };

  // Verificar si es un flete (no un envío de paquete)
  const isFlete = trip?.service_type === 'flete' || trip?.service_type === 'fletes' || trip?.serviceType === 'flete';

  const handleShowPackageInfo = () => {
    const pkg = trip?.package || trip?.packageDetails || {};
    const description = pkg.description || trip?.packageDescription || trip?.description || 'Sin descripción';
    const helpers = trip?.helpers || pkg.helpers || 0;
    const vehicleType = trip?.vehicleType || pkg.vehicleType || '';

    // Para fletes no mostrar dimensiones ni peso, mostrar ayudantes
    if (isFlete) {
      let fleteInfo = `Descripción: ${description}`;
      if (helpers > 0) {
        fleteInfo += `\n\nAyudantes: ${helpers} persona(s)`;
      }
      if (vehicleType) {
        fleteInfo += `\n\nTipo de vehículo: ${vehicleType}`;
      }

      Alert.alert(
        '🚚 Info del flete',
        fleteInfo,
        [{ text: 'OK' }]
      );
    } else {
      const dimensions = pkg.dimensions || {};
      const weight = pkg.weight || trip?.weight || '--';

      const dimensionText = dimensions.length && dimensions.width && dimensions.height
        ? `${dimensions.length} x ${dimensions.width} x ${dimensions.height} cm`
        : 'No especificadas';

      Alert.alert(
        '📦 Info del paquete',
        `Descripción: ${description}\n\nDimensiones: ${dimensionText}\n\nPeso: ${weight} kg`,
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusText = () => {
    if (isDelivery) {
      if (isFlete) {
        switch (tripStatus) {
          case 'going_pickup':
            return 'Yendo al punto de carga';
          case 'at_pickup':
            return 'En punto de carga';
          case 'in_progress':
            return 'Flete en progreso';
          case 'completed':
            return 'Flete completado';
          default:
            return '';
        }
      }
      switch (tripStatus) {
        case 'going_pickup':
          return 'Yendo a retirar el paquete';
        case 'at_pickup':
          return 'En punto de retiro';
        case 'in_progress':
          return 'Llevando el paquete';
        case 'completed':
          return 'Envío completado';
        default:
          return '';
      }
    }
    switch (tripStatus) {
      case 'going_pickup':
        return 'Yendo al punto de partida';
      case 'at_pickup':
        return 'Esperando pasajero';
      case 'in_progress':
        return 'Viaje en progreso';
      case 'completed':
        return 'Viaje completado';
      default:
        return '';
    }
  };

  const getActionButton = () => {
    if (isDelivery) {
      switch (tripStatus) {
        case 'going_pickup':
          return { text: isFlete ? 'Llegué al punto de carga' : 'Llegué al retiro', onPress: handleArrivePickup };
        case 'at_pickup':
          return { text: isFlete ? 'Flete terminado' : 'Paquete entregado', onPress: handleCompleteTrip };
        default:
          return null;
      }
    }
    switch (tripStatus) {
      case 'going_pickup':
        return { text: 'Llegué al punto', onPress: handleArrivePickup };
      case 'at_pickup':
        return { text: 'Iniciar viaje', onPress: handleStartTrip };
      case 'in_progress':
        return { text: 'Finalizar viaje', onPress: handleCompleteTrip };
      default:
        return null;
    }
  };

  // Obtener destino de navegación según estado del viaje
  const getNavigationDestination = () => {
    if (tripStatus === 'going_pickup' || tripStatus === 'at_pickup') {
      // Navegar al punto de recogida
      return trip?.origin || trip?.pickup;
    }
    // Navegar al destino final
    return trip?.destination;
  };

  const getNavigationAddress = () => {
    if (tripStatus === 'going_pickup' || tripStatus === 'at_pickup') {
      return trip?.origin?.address || trip?.pickup?.address || 'Punto de recogida';
    }
    return trip?.destination?.address || 'Destino';
  };

  const handleNavigationError = (error) => {
    Alert.alert('Error de navegación', error);
  };

  const action = getActionButton();

  // Ubicación del conductor para el marcador del vehículo
  const driverMarkerLocation = currentLocation ? {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    heading: currentLocation.heading || 0,
  } : null;

  return (
    <View style={styles.container}>
      {/* Mapa con ruta dinámica: conductor → pickup (antes de recoger) o conductor → dropoff (después) */}
      <MapViewWrapper
        origin={mapOrigin}
        destination={mapDestination}
        driverLocation={driverMarkerLocation}
        markers={additionalMarkers}
        showRoute={!!(mapOrigin && mapDestination)}
        showsUserLocation={false}
        hideOriginMarker={false}
        hideDestinationMarker={false}
        style={styles.map}
        edgePadding={{ top: 120, right: 60, bottom: isDelivery ? 220 : 350, left: 60 }}
        navigationMode={navigationMode}
        navigationZoom={18}
      />

      {/* Botón para alternar entre modo navegación y vista general */}
      <TouchableOpacity
        style={styles.mapModeButton}
        onPress={() => setNavigationMode(!navigationMode)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={navigationMode ? 'map-outline' : 'navigate'}
          size={22}
          color={COLORS.text}
        />
      </TouchableOpacity>

      {/* Botón de navegación flotante */}
      {tripStatus !== 'completed' && (
        <NavigationSelector
          variant="fab"
          destination={getNavigationDestination()}
          origin={currentLocation}
          address={getNavigationAddress()}
          onNavigationError={handleNavigationError}
          style={styles.navigationFab}
        />
      )}

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top', 'bottom']}>
        <View style={styles.statusBadge}>
          {isSending && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
            </View>
          )}
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </SafeAreaView>

      {/* Card inferior - más compacto para envíos */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 65 + SIZES.md }, isDelivery && styles.bottomCardCompact]}>
        {/* Info del viaje */}
        <View style={[styles.tripInfo, isDelivery && styles.tripInfoCompact]}>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={20} color={COLORS.white} />
            <Text style={styles.infoValue}>
              ${(trip?.estimatedPrice || trip?.price || 0).toLocaleString('es-AR')}
            </Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.white} />
            <Text style={styles.infoValue}>
              {eta || trip?.destination?.time || '--'} min
            </Text>
          </View>
        </View>

        {/* Usuario/Pasajero info con botón de chat */}
        <View style={[styles.passengerRow, isDelivery && styles.passengerRowCompact]}>
          <View style={styles.passengerAvatar}>
            <Ionicons name={isDelivery ? "person-outline" : "person"} size={24} color={COLORS.textMuted} />
          </View>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>
              {trip?.user?.name ||
               (trip?.user ? `${trip.user.nombre || ''} ${trip.user.apellido || ''}`.trim() : '') ||
               (isDelivery ? 'Cliente' : 'Pasajero')
              }
            </Text>
            {/* Solo mostrar rating para viajes (pasajeros), no para envíos */}
            {!isDelivery && (trip?.user?.rating || trip?.rating) && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={COLORS.warning} />
                <Text style={styles.ratingText}>{trip?.user?.rating || trip?.rating}</Text>
              </View>
            )}
          </View>
          {/* Botón info paquete solo para envíos */}
          {isDelivery && (
            <TouchableOpacity style={styles.contactButton} onPress={handleShowPackageInfo}>
              <Ionicons name="cube-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          )}
          {/* Chat disponible para todos (viajes y envíos) */}
          <TouchableOpacity style={styles.contactButton} onPress={handleMessagePassenger}>
            <Ionicons name="chatbubble" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Botones */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          {action && (
            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.buttonDisabled]}
              onPress={action.onPress}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.actionButtonText}>{action.text}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <DeliveryCodeModal
        visible={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSubmit={submitDeliveryCode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: SIZES.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
  },
  liveIndicator: {
    marginRight: SIZES.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e', // green-500
  },
  statusText: {
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
  },
  bottomCardCompact: {
    padding: SIZES.md,
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
    paddingBottom: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  tripInfoCompact: {
    marginBottom: SIZES.sm,
    paddingBottom: SIZES.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  infoValue: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: SIZES.xs,
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  routeInfo: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: 'transparent',
    marginRight: SIZES.sm,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  routeAddress: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.text,
  },
  packageInfo: {
    backgroundColor: '#FFF8E1',
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  packageTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SIZES.xs,
  },
  packageDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  packageDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.md,
  },
  packageDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageDetailLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  packageDetailValue: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.text,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  passengerRowCompact: {
    marginBottom: SIZES.sm,
  },
  passengerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerInfo: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  passengerName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.72)',
    marginLeft: 4,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.sm,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  actionButton: {
    flex: 2,
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  navigationFab: {
    position: 'absolute',
    right: SIZES.md,
    bottom: 220, // Posicionado encima del bottomCard
  },
  mapModeButton: {
    position: 'absolute',
    top: 100,
    right: SIZES.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
});

export default TripActiveScreen;
