import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { pushNotificationService } from '../services/pushNotification.service';
import { notificationService } from '../services/notification.service';

/**
 * Hook para manejar notificaciones push
 * Registra listeners, maneja navegacion y actualiza badge
 */
export const useNotifications = (isAuthenticated = false) => {
  const navigation = useNavigation();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotification, setLastNotification] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();

  /**
   * Registrar para push notifications
   */
  const registerPush = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = await pushNotificationService.register();
      if (token) {
        setExpoPushToken(token);
      }
    } catch (error) {
      console.error('Error registering push:', error);
    }
  }, [isAuthenticated]);

  /**
   * Desregistrar push notifications
   */
  const unregisterPush = useCallback(async () => {
    try {
      await pushNotificationService.unregister();
      setExpoPushToken(null);
    } catch (error) {
      console.error('Error unregistering push:', error);
    }
  }, []);

  /**
   * Actualizar conteo de no leidas
   */
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const result = await notificationService.getUnreadCount();
      if (result.success) {
        setUnreadCount(result.count);
        await pushNotificationService.setBadgeCount(result.count);
      }
    } catch (error) {
      console.error('Error getting unread count:', error);
    }
  }, [isAuthenticated]);

  /**
   * Manejar navegacion basada en datos de notificacion
   * Soporta deep linking para todas las pantallas de la app
   */
  const handleNotificationNavigation = useCallback((data) => {
    if (!data?.screen) return;

    const { screen, rideId, driverId, amount, ...otherParams } = data;

    // Mapeo de pantallas por tipo de notificacion
    const navigationConfig = {
      // Usuario - Durante viaje
      RideTracking: {
        screen: 'TripActive',
        params: { rideId },
      },
      // Usuario - Recibo del viaje
      RideReceipt: {
        screen: 'ActivityDetail',
        params: { rideId },
      },
      // Usuario - Calificar viaje
      RateRide: {
        screen: 'RateRide',
        params: { rideId },
      },
      // Usuario/Conductor - Chat del viaje
      Chat: {
        screen: 'Chat',
        params: { rideId, ...otherParams },
      },

      // Conductor - Nueva solicitud de viaje
      TripRequest: {
        screen: 'DriverHome',
        params: { pendingRideId: rideId },
      },
      // Conductor - Viaje activo
      DriverTripActive: {
        screen: 'DriverTripActive',
        params: { rideId },
      },
      // Conductor - Wallet/Ganancias
      DriverWallet: {
        screen: 'DriverWallet',
        params: {},
      },
      // Conductor - Detalle de ganancia
      DriverEarnings: {
        screen: 'DriverEarnings',
        params: { highlightPaymentId: otherParams.paymentId },
      },

      // General - Notificaciones
      Notifications: {
        screen: 'Notifications',
        params: {},
      },
      // General - Actividad
      Activity: {
        screen: 'Activity',
        params: {},
      },
    };

    const config = navigationConfig[screen];
    if (config) {
      try {
        // Intentar navegación directa
        navigation.navigate(config.screen, config.params);
      } catch (navError) {
        console.warn('Direct navigation failed, trying nested:', navError);
        // Si falla, intentar navegación anidada (para tabs)
        try {
          if (screen.startsWith('Driver')) {
            navigation.navigate('DriverTabs', {
              screen: config.screen,
              params: config.params,
            });
          } else {
            navigation.navigate('MainTabs', {
              screen: config.screen,
              params: config.params,
            });
          }
        } catch (nestedError) {
          console.error('Nested navigation also failed:', nestedError);
        }
      }
    } else {
      console.warn('Unknown notification screen:', screen);
    }
  }, [navigation]);

  /**
   * Manejar notificacion recibida en foreground
   */
  const handleNotificationReceived = useCallback((notification) => {
    console.log('Notification received:', notification);
    setLastNotification(notification);
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  /**
   * Manejar tap en notificacion
   */
  const handleNotificationResponse = useCallback((response) => {
    console.log('Notification tapped:', response);
    const data = response.notification.request.content.data;
    handleNotificationNavigation(data);

    // Marcar como leida si tiene ID
    if (data?.notificationId) {
      notificationService.markAsRead(data.notificationId);
    }

    refreshUnreadCount();
  }, [handleNotificationNavigation, refreshUnreadCount]);

  // Registrar al autenticarse
  useEffect(() => {
    if (isAuthenticated) {
      registerPush();
      refreshUnreadCount();
    }
  }, [isAuthenticated, registerPush, refreshUnreadCount]);

  // Configurar listeners
  useEffect(() => {
    // Listener para notificaciones en foreground
    notificationListener.current = pushNotificationService.addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Listener para tap en notificacion
    responseListener.current = pushNotificationService.addNotificationResponseListener(
      handleNotificationResponse
    );

    // Verificar si la app fue abierta desde una notificacion
    pushNotificationService.getLastNotificationResponse().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationReceived, handleNotificationResponse]);

  /**
   * Marcar notificacion como leida y actualizar conteo
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [refreshUnreadCount]);

  /**
   * Marcar todas como leidas
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      await pushNotificationService.clearBadge();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  /**
   * Limpiar badge
   */
  const clearBadge = useCallback(async () => {
    await pushNotificationService.clearBadge();
  }, []);

  return {
    expoPushToken,
    unreadCount,
    lastNotification,
    registerPush,
    unregisterPush,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    clearBadge,
  };
};

export default useNotifications;
