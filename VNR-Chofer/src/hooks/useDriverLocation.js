import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './useSocket';
import mapsService from '../services/maps.service';

/**
 * Hook for tracking driver location in real-time
 * Used by passengers to see driver position on map
 *
 * @param {string} driverId - ID of the driver to track
 * @param {string} rideId - ID of the active ride
 * @param {object} destination - Destination coordinates for ETA calculation
 * @returns {object} Driver location data and helpers
 */
export const useDriverLocation = (driverId, rideId, destination = null) => {
  const { socket, isConnected } = useSocket();
  const [driverLocation, setDriverLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [eta, setEta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const lastEtaUpdate = useRef(0);
  const ETA_UPDATE_INTERVAL = 30000; // Update ETA every 30 seconds

  // Handle incoming driver location updates
  const handleLocationUpdate = useCallback(
    async (data) => {
      if (data.driverId !== driverId) return;

      // El backend envía la ubicación dentro de data.location
      const location = data.location || data;
      const newLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading || 0,
        speed: location.speed || 0,
        accuracy: location.accuracy || 0,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setDriverLocation(newLocation);
      setIsLoading(false);
      setError(null);

      // Add to history (keep last 50 points for route drawing)
      setLocationHistory((prev) => {
        const updated = [...prev, newLocation];
        return updated.slice(-50);
      });

      // Update ETA periodically
      if (
        destination &&
        Date.now() - lastEtaUpdate.current > ETA_UPDATE_INTERVAL
      ) {
        lastEtaUpdate.current = Date.now();
        try {
          const etaData = await mapsService.calculateETA(
            { latitude: location.latitude, longitude: location.longitude },
            destination
          );
          if (etaData) {
            setEta({
              duration: etaData.duration,
              durationText: etaData.duration?.text || mapsService.formatDuration(etaData.duration?.value),
              arrivalTime: etaData.arrivalTime,
              distance: etaData.distance,
              distanceText: etaData.distance?.text || mapsService.formatDistance(etaData.distance?.value / 1000),
            });
          }
        } catch (err) {
          console.error('Error calculating ETA:', err);
        }
      }
    },
    [driverId, destination]
  );

  // Subscribe to driver location when connected
  useEffect(() => {
    if (!isConnected || !driverId || !rideId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to driver location updates
    socket.subscribeToDriverLocation(driverId, rideId);

    // Listen for location updates
    const unsubscribe = socket.on('driver:location', handleLocationUpdate);

    // Cleanup
    return () => {
      socket.unsubscribeFromDriverLocation(rideId);
      unsubscribe();
    };
  }, [isConnected, driverId, rideId, socket, handleLocationUpdate]);

  // Calculate initial ETA when destination or driver location changes
  useEffect(() => {
    const calculateInitialEta = async () => {
      if (!driverLocation || !destination) return;

      try {
        const etaData = await mapsService.calculateETA(
          driverLocation,
          destination
        );
        if (etaData) {
          setEta({
            duration: etaData.duration,
            durationText: etaData.duration?.text || mapsService.formatDuration(etaData.duration?.value),
            arrivalTime: etaData.arrivalTime,
            distance: etaData.distance,
            distanceText: etaData.distance?.text || mapsService.formatDistance(etaData.distance?.value / 1000),
          });
          lastEtaUpdate.current = Date.now();
        }
      } catch (err) {
        console.error('Error calculating initial ETA:', err);
      }
    };

    if (driverLocation && destination && !eta) {
      calculateInitialEta();
    }
  }, [driverLocation, destination, eta]);

  return {
    driverLocation,
    locationHistory,
    eta,
    isLoading,
    error,
    isConnected,
  };
};

/**
 * Hook for sending driver location updates
 * Used by drivers to broadcast their position
 *
 * @param {string} rideId - ID of the active ride (optional)
 * @param {boolean} isActive - Whether tracking is active
 * @param {number} interval - Update interval in ms (default 5000)
 * @returns {object} Location tracking controls
 */
export const useDriverLocationSender = (rideId = null, isActive = false, interval = 5000) => {
  const { socket, isConnected } = useSocket();
  const [lastSentLocation, setLastSentLocation] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const watchRef = useRef(null);

  // Send location update through socket
  const sendLocation = useCallback(
    (location) => {
      if (!isConnected || !socket) return;

      const locationData = {
        rideId,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading || 0,
        speed: location.speed || 0,
        accuracy: location.accuracy || 0,
      };

      socket.updateLocation(locationData);
      setLastSentLocation({
        ...locationData,
        timestamp: new Date().toISOString(),
      });
    },
    [isConnected, socket, rideId]
  );

  // Start/stop location watching based on isActive
  useEffect(() => {
    if (!isActive || !isConnected) {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
      setIsSending(false);
      return;
    }

    const startWatching = async () => {
      try {
        const { locationService } = await import('../services/location.service');

        setIsSending(true);

        watchRef.current = await locationService.watchLocation(
          (location) => {
            sendLocation(location);
          },
          {
            timeInterval: interval,
            distanceInterval: 10, // Also update if moved 10 meters
          }
        );
      } catch (error) {
        console.error('Error starting location watch:', error);
        setIsSending(false);
      }
    };

    startWatching();

    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
      setIsSending(false);
    };
  }, [isActive, isConnected, interval, sendLocation]);

  return {
    sendLocation,
    lastSentLocation,
    isSending,
    isConnected,
  };
};

/**
 * Hook for finding nearby available drivers
 * Shows multiple drivers on the map before ride is accepted
 *
 * @param {object} location - User's current location
 * @param {number} radius - Search radius in km
 * @returns {object} Nearby drivers data
 */
export const useNearbyDrivers = (location, radius = 5) => {
  const { socket, isConnected } = useSocket();
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for nearby drivers updates
  useEffect(() => {
    if (!isConnected || !location) {
      setIsLoading(false);
      return;
    }

    // Request nearby drivers
    socket.emit('drivers:nearby', {
      latitude: location.latitude,
      longitude: location.longitude,
      radius,
    });

    // Listen for response
    const handleNearbyDrivers = (data) => {
      setDrivers(data.drivers || []);
      setIsLoading(false);
    };

    const unsubscribe = socket.on('drivers:nearby:response', handleNearbyDrivers);

    // Refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      if (isConnected && location) {
        socket.emit('drivers:nearby', {
          latitude: location.latitude,
          longitude: location.longitude,
          radius,
        });
      }
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [isConnected, location, radius, socket]);

  return {
    drivers,
    isLoading,
    isConnected,
  };
};

export default useDriverLocation;
