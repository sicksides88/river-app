import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { usePlacesAutocomplete } from '../../hooks';

/**
 * Componente de Autocomplete de Places con Google Places API
 */
const PlacesAutocomplete = forwardRef(({
  label,
  value,
  onPlaceSelect,
  placeholder = 'Buscar dirección...',
  error,
  showCurrentLocation = true,
  showClearButton = true,
  icon = 'location',
  iconColor = COLORS.text,
  style,
  containerStyle,
  inputStyle,
  suggestionsStyle,
  disabled = false,
  autoFocus = false,
  testID,
}, ref) => {
  const {
    query,
    suggestions,
    isLoading,
    error: searchError,
    selectedPlace,
    handleQueryChange,
    selectPlace,
    useMyLocation,
    clear,
    setValue,
    setQuery,
  } = usePlacesAutocomplete({
    debounceMs: 300,
    minChars: 2,
    maxResults: 5,
    useCurrentLocation: true,
  });

  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Exponer métodos al padre
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => {
      clear();
      onPlaceSelect?.(null);
    },
    setValue: (val) => {
      setValue(val);
    },
  }));

  // Sincronizar valor externo
  useEffect(() => {
    if (value?.address && value.address !== query) {
      setValue(value);
    }
  }, [value]);

  // Animar sugerencias
  useEffect(() => {
    if (suggestions.length > 0 && isFocused) {
      setShowSuggestions(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        if (suggestions.length === 0) {
          setShowSuggestions(false);
        }
      });
    }
  }, [suggestions, isFocused]);

  const handleSelect = async (suggestion) => {
    const place = await selectPlace(suggestion);
    if (place) {
      Keyboard.dismiss();
      onPlaceSelect?.(place);
    }
  };

  const handleUseCurrentLocation = async () => {
    const place = await useMyLocation();
    if (place) {
      Keyboard.dismiss();
      onPlaceSelect?.(place);
    }
  };

  const handleClear = () => {
    clear();
    onPlaceSelect?.(null);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay para permitir tap en sugerencias
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const renderSuggestion = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        index === suggestions.length - 1 && styles.suggestionItemLast,
      ]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIcon}>
        <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
      </View>
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
  );

  const displayError = error || searchError;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          displayError && styles.inputError,
          disabled && styles.inputDisabled,
          style,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={disabled ? COLORS.textMuted : iconColor}
          style={styles.iconLeft}
        />

        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          value={query}
          onChangeText={handleQueryChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          testID={testID}
        />

        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={COLORS.text}
            style={styles.iconRight}
          />
        ) : query && showClearButton ? (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.iconRight}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {displayError && <Text style={styles.errorText}>{displayError}</Text>}

      {/* Botón de ubicación actual */}
      {showCurrentLocation && !query && !disabled && (
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate" size={18} color={COLORS.text} />
          <Text style={styles.currentLocationText}>Usar mi ubicación actual</Text>
        </TouchableOpacity>
      )}

      {/* Lista de sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <Animated.View
          style={[
            styles.suggestionsContainer,
            suggestionsStyle,
            { opacity: fadeAnim },
          ]}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.placeId}
            renderItem={renderSuggestion}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.poweredBy}>
            <Text style={styles.poweredByText}>powered by Google</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.md,
    zIndex: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusLg,
  },
  inputFocused: {
    borderColor: COLORS.text,
    borderWidth: 2,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: COLORS.backgroundInput,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  iconLeft: {
    paddingLeft: 16,
    paddingRight: 10,
  },
  iconRight: {
    paddingRight: 16,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SIZES.xs,
    marginLeft: 16,
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
    color: COLORS.text,
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
    borderRadius: SIZES.radiusLg,
    maxHeight: 250,
    marginTop: 4,
    ...SHADOWS.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionMain: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  suggestionSecondary: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  poweredBy: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.background,
    borderBottomLeftRadius: SIZES.radiusLg,
    borderBottomRightRadius: SIZES.radiusLg,
  },
  poweredByText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
});

PlacesAutocomplete.displayName = 'PlacesAutocomplete';

export default PlacesAutocomplete;
