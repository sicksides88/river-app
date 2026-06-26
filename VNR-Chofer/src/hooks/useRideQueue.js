import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services';

/**
 * Hook para manejar el estado de la cola de búsqueda de conductores
 * @param {string} rideId - ID del viaje
 * @returns {Object} Estado de la búsqueda y funciones de control
 */
export const useRideQueue = (rideId) => {
  const [searchState, setSearchState] = useState({
    status: 'idle', // idle, searching, accepted, no_drivers, cancelled, completed
    round: 0,
    maxRounds: 3,
    driversNotified: 0,
    message: '',
  });
  const [driver, setDriver] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState(null);
  const [completionData, setCompletionData] = useState(null);

  useEffect(() => {
    if (!rideId) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    // Búsqueda iniciada
    const handleSearchStarted = (data) => {
      if (data.rideId === rideId) {
        setSearchState(prev => ({
          ...prev,
          status: 'searching',
          message: data.message || 'Buscando conductores...',
        }));
      }
    };

    // Progreso de búsqueda
    const handleSearchProgress = (data) => {
      if (data.rideId === rideId) {
        setSearchState(prev => ({
          ...prev,
          status: 'searching',
          round: data.round,
          maxRounds: data.maxRounds,
          driversNotified: data.driversNotified,
          message: data.message,
        }));
      }
    };

    // Viaje aceptado
    const handleRideAccepted = (data) => {
      if (data.rideId === rideId) {
        setSearchState(prev => ({
          ...prev,
          status: 'accepted',
          message: 'Conductor encontrado',
        }));
        setDriver({
          id: data.driver?.id,
          nombre: data.driver?.nombre,
          apellido: data.driver?.apellido,
          avatar: data.driver?.avatar,
          rating: data.driver?.rating,
          telefono_numero: data.driver?.telefono_numero,
          eta: data.eta,
        });
        // Guardar info del vehículo si está disponible
        if (data.vehicle) {
          setVehicle({
            id: data.vehicle.id,
            brand: data.vehicle.brand,
            model: data.vehicle.model,
            year: data.vehicle.year,
            color: data.vehicle.color,
            plate: data.vehicle.plate,
          });
        }
      }
    };

    // Sin conductores disponibles
    const handleNoDrivers = (data) => {
      if (data.rideId === rideId) {
        setSearchState(prev => ({
          ...prev,
          status: 'no_drivers',
          message: data.message || 'No hay conductores disponibles',
        }));
        setError('No encontramos conductores disponibles en este momento');
      }
    };

    // Viaje cancelado
    const handleRideCancelled = (data) => {
      if (data.rideId === rideId) {
        setSearchState(prev => ({
          ...prev,
          status: 'cancelled',
          message: data.message || 'Viaje cancelado',
        }));
      }
    };

    // Viaje completado
    const handleRideCompleted = (data) => {
      if (data.rideId === rideId) {
        setSearchState(prev => ({
          ...prev,
          status: 'completed',
          message: 'Viaje completado',
        }));
        setCompletionData({
          finalPrice: data.finalPrice,
          duration: data.duration,
          distance: data.distance,
        });
      }
    };

    // Cambio de estado del viaje (arrived, in-progress, completed, cancelled)
    const handleStatusChanged = (data) => {
      if (data.rideId !== rideId) return;

      if (data.status === 'completed') {
        setSearchState(prev => ({
          ...prev,
          status: 'completed',
          message: 'Viaje completado',
        }));
        setCompletionData({
          finalPrice: data.actualPrice,
        });
      } else if (data.status === 'cancelled') {
        setSearchState(prev => ({
          ...prev,
          status: 'cancelled',
          message: data.reason || 'Viaje cancelado',
        }));
      } else if (data.status === 'driver-arrived') {
        setSearchState(prev => ({
          ...prev,
          status: 'arrived',
          message: 'El conductor llegó',
        }));
      } else if (data.status === 'in-progress') {
        setSearchState(prev => ({
          ...prev,
          status: 'in_progress',
          message: 'Viaje en curso',
        }));
      }
    };

    // Registrar listeners
    socket.on('ride:search_started', handleSearchStarted);
    socket.on('ride:search_progress', handleSearchProgress);
    socket.on('ride:accepted', handleRideAccepted);
    socket.on('ride:no_drivers', handleNoDrivers);
    socket.on('ride:cancelled', handleRideCancelled);
    socket.on('ride:completed', handleRideCompleted);
    socket.on('ride:status_changed', handleStatusChanged);

    // Cleanup
    return () => {
      socket.off('ride:search_started', handleSearchStarted);
      socket.off('ride:search_progress', handleSearchProgress);
      socket.off('ride:accepted', handleRideAccepted);
      socket.off('ride:no_drivers', handleNoDrivers);
      socket.off('ride:cancelled', handleRideCancelled);
      socket.off('ride:completed', handleRideCompleted);
      socket.off('ride:status_changed', handleStatusChanged);
    };
  }, [rideId]);

  const resetSearch = useCallback(() => {
    setSearchState({
      status: 'idle',
      round: 0,
      maxRounds: 3,
      driversNotified: 0,
      message: '',
    });
    setDriver(null);
    setVehicle(null);
    setError(null);
    setCompletionData(null);
  }, []);

  return {
    ...searchState,
    driver,
    vehicle,
    error,
    completionData,
    isSearching: searchState.status === 'searching',
    isAccepted: searchState.status === 'accepted',
    isArrived: searchState.status === 'arrived',
    isInProgress: searchState.status === 'in_progress',
    noDrivers: searchState.status === 'no_drivers',
    isCancelled: searchState.status === 'cancelled',
    isCompleted: searchState.status === 'completed',
    resetSearch,
  };
};

export default useRideQueue;
