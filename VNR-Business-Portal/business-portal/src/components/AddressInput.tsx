import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import api from '../services/api';
import { MapPin, Navigation, Loader2, Edit3 } from 'lucide-react';

interface AddressResult {
  address: string;
  lat: number;
  lng: number;
}

interface AddressInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (result: AddressResult) => void;
  showMyLocation?: boolean;
  myLocationAddress?: string | null;
}

interface Prediction {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
}

const DEFAULT_CENTER = { lat: -32.4825, lng: -58.2372 }; // Concepción del Uruguay

const AddressInput: React.FC<AddressInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  showMyLocation,
  myLocationAddress,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
  });

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const { data } = await api.get('/maps/places/search', { params: { input } });
      if (data.success && data.data) {
        setSuggestions(data.data.map((p: any) => ({
          placeId: p.placeId,
          description: p.description,
          mainText: p.mainText,
          secondaryText: p.secondaryText,
        })));
        setShowSuggestions(true);
      }
    } catch {
      // Silently fail
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (markerPos) {
      setMarkerPos(null);
      setShowMap(false);
    }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => searchPlaces(val), 300);
  };

  const handleSelect = async (suggestion: Prediction) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    try {
      const { data } = await api.get(`/maps/places/${suggestion.placeId}`);
      if (data.success && data.data) {
        const lat = data.data.coordinates?.latitude || 0;
        const lng = data.data.coordinates?.longitude || 0;
        const addr = data.data.address || suggestion.description;
        setMarkerPos({ lat, lng });
        setShowMap(true);
        onChange({ address: addr, lat, lng });
      }
    } catch {
      onChange({ address: suggestion.description, lat: 0, lng: 0 });
    }
  };

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    setReverseLoading(true);
    try {
      const { data } = await api.get('/maps/reverse-geocode', { params: { lat, lng } });
      if (data.success && data.data) {
        const addr = data.data.formattedAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setInputValue(addr);
        onChange({ address: addr, lat, lng });
      } else {
        const addr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setInputValue(addr);
        onChange({ address: addr, lat, lng });
      }
    } catch {
      const addr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setInputValue(addr);
      onChange({ address: addr, lat, lng });
    } finally {
      setReverseLoading(false);
    }
  }, [onChange]);

  const handleUseMyLocation = async () => {
    if (!myLocationAddress) return;
    setLoadingLocation(true);
    setInputValue(myLocationAddress);
    try {
      const { data } = await api.get('/maps/geocode', {
        params: { address: myLocationAddress },
      });
      if (data.success && data.data) {
        const lat = data.data.coordinates?.latitude || 0;
        const lng = data.data.coordinates?.longitude || 0;
        const addr = data.data.formattedAddress || myLocationAddress;
        setMarkerPos({ lat, lng });
        setShowMap(true);
        onChange({ address: addr, lat, lng });
        setInputValue(addr);
      } else {
        onChange({ address: myLocationAddress, lat: 0, lng: 0 });
      }
    } catch {
      onChange({ address: myLocationAddress, lat: 0, lng: 0 });
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleEditAddress = () => {
    setMarkerPos(null);
    setShowMap(false);
    onChange({ address: inputValue, lat: 0, lng: 0 });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder || 'Ingresá una dirección...'}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        {markerPos && (
          <button
            type="button"
            onClick={handleEditAddress}
            title="Editar dirección"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Botón "Usar mi ubicación" */}
      {showMyLocation && myLocationAddress && (
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={loadingLocation}
          className="mt-2 flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          {loadingLocation ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2" />
          )}
          Usar mi ubicación ({myLocationAddress})
        </button>
      )}

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s) => (
            <li
              key={s.placeId}
              onClick={() => handleSelect(s)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer first:rounded-t-xl last:rounded-b-xl"
            >
              <p className="text-sm font-medium text-gray-900">{s.mainText || s.description}</p>
              {s.secondaryText && (
                <p className="text-xs text-gray-500">{s.secondaryText}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Mapa interactivo */}
      {showMap && isLoaded && (
        <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '250px' }}
            center={markerPos || DEFAULT_CENTER}
            zoom={16}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {markerPos && <Marker position={markerPos} draggable onDragEnd={(e) => {
              if (e.latLng) handleMapClick({ latLng: e.latLng } as google.maps.MapMouseEvent);
            }} />}
          </GoogleMap>
          <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 flex items-center gap-1">
            {reverseLoading ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Obteniendo dirección...</>
            ) : (
              <>Hacé click en el mapa o arrastrá el marcador para ajustar la ubicación</>
            )}
          </div>
        </div>
      )}

      {/* Botón para abrir mapa manualmente */}
      {!showMap && !markerPos && (
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="mt-2 flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <MapPin className="w-4 h-4 mr-1" />
          Marcar en el mapa
        </button>
      )}

      {/* Mapa sin marcador (para seleccionar manualmente) */}
      {showMap && isLoaded && !markerPos && (
        <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '250px' }}
            center={DEFAULT_CENTER}
            zoom={14}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          />
          <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Hacé click en el mapa para marcar la ubicación del comercio
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressInput;
