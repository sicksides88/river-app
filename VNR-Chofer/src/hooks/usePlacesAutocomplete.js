import { useState, useEffect, useRef, useCallback } from 'react';
import { locationService } from '../services/location.service';
import mapsService from '../services/maps.service';

// Caché simple para resultados de búsqueda
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Hook para manejar el autocomplete de Places
 * @param {object} options - Opciones de configuración
 * @returns {object} Estado y funciones del autocomplete
 */
export const usePlacesAutocomplete = (options = {}) => {
  const {
    debounceMs = 300,
    minChars = 2,
    maxResults = 5,
    useCurrentLocation = true,
  } = options;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const debounceRef = useRef(null);
  const isMountedRef = useRef(true);

  // Obtener ubicación actual al montar
  useEffect(() => {
    if (useCurrentLocation) {
      locationService.getCurrentLocation()
        .then(location => {
          if (isMountedRef.current) {
            setCurrentLocation(location);
          }
        })
        .catch(() => {
          // Ignorar errores de ubicación
        });
    }

    return () => {
      isMountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [useCurrentLocation]);

  /**
   * Buscar lugares
   */
  const search = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < minChars) {
      setSuggestions([]);
      return;
    }

    // Verificar caché
    const cacheKey = `${searchQuery.toLowerCase()}_${currentLocation?.latitude || ''}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setSuggestions(cached.data.slice(0, maxResults));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await locationService.searchPlaces(searchQuery, currentLocation);

      if (isMountedRef.current) {
        const limitedResults = results.slice(0, maxResults);
        setSuggestions(limitedResults);

        // Guardar en caché
        searchCache.set(cacheKey, {
          data: results,
          timestamp: Date.now(),
        });

        // Limpiar entradas antiguas del caché
        if (searchCache.size > 100) {
          const now = Date.now();
          for (const [key, value] of searchCache.entries()) {
            if (now - value.timestamp > CACHE_TTL) {
              searchCache.delete(key);
            }
          }
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error al buscar direcciones');
        setSuggestions([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentLocation, minChars, maxResults]);

  /**
   * Manejar cambio de texto con debounce
   */
  const handleQueryChange = useCallback((text) => {
    setQuery(text);
    setSelectedPlace(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.length < minChars) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      search(text);
    }, debounceMs);
  }, [search, minChars, debounceMs]);

  /**
   * Seleccionar un lugar de las sugerencias
   */
  const selectPlace = useCallback(async (suggestion) => {
    setIsLoading(true);
    setError(null);

    try {
      const details = await locationService.getPlaceDetails(suggestion.placeId);

      if (details && isMountedRef.current) {
        const place = {
          placeId: suggestion.placeId,
          name: details.name,
          address: details.address,
          coordinates: details.coordinates,
          mainText: suggestion.mainText,
          secondaryText: suggestion.secondaryText,
        };

        setSelectedPlace(place);
        setQuery(details.address);
        setSuggestions([]);

        return place;
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error al obtener detalles del lugar');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }

    return null;
  }, []);

  /**
   * Usar ubicación actual
   */
  const useMyLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);

      // Usar reverse geocode del backend (más preciso)
      const address = await mapsService.reverseGeocode(location.latitude, location.longitude);

      if (address && isMountedRef.current) {
        const place = {
          name: 'Mi ubicación',
          address: address.formattedAddress,
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
            lat: location.latitude,
            lng: location.longitude,
          },
          isCurrentLocation: true,
        };

        setSelectedPlace(place);
        setQuery(address.formattedAddress);
        setSuggestions([]);

        return place;
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error al obtener tu ubicación');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }

    return null;
  }, []);

  /**
   * Limpiar selección
   */
  const clear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setSelectedPlace(null);
    setError(null);
  }, []);

  /**
   * Establecer valor inicial
   */
  const setValue = useCallback((value) => {
    if (value?.address) {
      setQuery(value.address);
      setSelectedPlace(value);
    }
  }, []);

  return {
    // Estado
    query,
    suggestions,
    isLoading,
    error,
    selectedPlace,
    currentLocation,
    hasSelection: !!selectedPlace,

    // Funciones
    handleQueryChange,
    selectPlace,
    useMyLocation,
    clear,
    setValue,
    setQuery,
  };
};

export default usePlacesAutocomplete;
