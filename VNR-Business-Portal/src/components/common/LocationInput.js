import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { locationService } from '../../services/location.service';
import mapsService from '../../services/maps.service';

const LocationInput = ({
  label,
  value,
  onLocationSelect,
  placeholder = 'Ingresa una dirección',
  error,
  showCurrentLocation = true,
  style,
  containerStyle,
}) => {
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const debounceRef = useRef(null);

  // Obtener ubicación actual al montar para mejorar resultados de búsqueda
  useEffect(() => {
    const fetchCurrentLocation = async () => {
      try {
        const location = await locationService.getCurrentLocation();
        setCurrentLocation(location);
      } catch (error) {
        // Silently fail - location is optional for search bias
        console.log('Location not available for search bias');
      }
    };
    fetchCurrentLocation();
  }, []);

  useEffect(() => {
    if (value?.address && value.address !== inputValue) {
      setInputValue(value.address);
    }
  }, [value]);

  // Debounced search
  const handleTextChange = (text) => {
    setInputValue(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await locationService.searchPlaces(text, currentLocation);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Error searching places:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = async (suggestion) => {
    setIsLoading(true);
    try {
      const details = await locationService.getPlaceDetails(suggestion.placeId);

      if (details) {
        // Extraer coordenadas de forma robusta
        const lat = details.coordinates?.latitude ?? details.coordinates?.lat;
        const lng = details.coordinates?.longitude ?? details.coordinates?.lng;

        setInputValue(details.address);
        setSuggestions([]);
        setShowSuggestions(false);
        Keyboard.dismiss();
        onLocationSelect?.({
          address: details.address,
          name: details.name,
          placeId: suggestion.placeId,
          coordinates: {
            lat,
            lng,
            latitude: lat,
            longitude: lng,
          },
        });
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);

      // Usar Google Maps API para reverse geocoding (más preciso)
      const address = await mapsService.reverseGeocode(
        location.latitude,
        location.longitude
      );

      if (address) {
        const formattedAddress = address.formattedAddress;
        setInputValue(formattedAddress);
        setSuggestions([]);
        setShowSuggestions(false);
        Keyboard.dismiss();
        onLocationSelect?.({
          address: formattedAddress,
          name: 'Mi ubicación',
          coordinates: {
            lat: location.latitude,
            lng: location.longitude,
            latitude: location.latitude,
            longitude: location.longitude,
          },
          isCurrentLocation: true,
          details: address.components,
        });
      } else {
        // Fallback a expo-location si el API falla
        const fallbackAddress = await locationService.getAddressFromCoords(
          location.latitude,
          location.longitude
        );
        if (fallbackAddress) {
          setInputValue(fallbackAddress.formatted);
          setSuggestions([]);
          setShowSuggestions(false);
          Keyboard.dismiss();
          onLocationSelect?.({
            address: fallbackAddress.formatted,
            name: 'Mi ubicación',
            coordinates: {
              lat: location.latitude,
              lng: location.longitude,
              latitude: location.latitude,
              longitude: location.longitude,
            },
            isCurrentLocation: true,
          });
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationSelect?.(null);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
        style,
      ]}>
        <Ionicons
          name="location"
          size={20}
          color={COLORS.black}
          style={styles.iconLeft}
        />

        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          onFocus={() => {
            setIsFocused(true);
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay hiding to allow tap on suggestion
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />

        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={COLORS.black}
            style={styles.iconRight}
          />
        ) : inputValue ? (
          <TouchableOpacity onPress={handleClear} style={styles.iconRight}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Current Location Button */}
      {showCurrentLocation && !inputValue && (
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
          disabled={isLoading}
        >
          <Ionicons name="navigate" size={18} color={COLORS.black} />
          <Text style={styles.currentLocationText}>Usar mi ubicación actual</Text>
        </TouchableOpacity>
      )}

      {/* Suggestions List */}
      {showSuggestions && suggestions.length > 0 && (
        <ScrollView
          style={styles.suggestionsContainer}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.placeId}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(item)}
            >
              <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
              <View style={styles.suggestionText}>
                <Text style={styles.suggestionMain} numberOfLines={1}>
                  {item.mainText || item.description}
                </Text>
                {item.secondaryText && (
                  <Text style={styles.suggestionSecondary} numberOfLines={1}>
                    {item.secondaryText}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.md,
    zIndex: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: SIZES.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: SIZES.borderWidth,
    borderColor: COLORS.black,
    borderRadius: SIZES.radiusXl,
  },
  inputFocused: {
    borderColor: COLORS.black,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 15,
    color: COLORS.black,
  },
  iconLeft: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  iconRight: {
    paddingRight: 16,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SIZES.xs,
    marginLeft: 20,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: 4,
    marginTop: SIZES.xs,
  },
  currentLocationText: {
    fontSize: 14,
    color: COLORS.black,
    marginLeft: SIZES.sm,
    fontWeight: '500',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    maxHeight: 200,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionMain: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  suggestionSecondary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default LocationInput;
