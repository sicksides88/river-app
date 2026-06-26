import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '../../../constants/theme';
import AuxilioSearchingRadar from './AuxilioSearchingRadar';

const hasValidCoords = (lat, lng) => {
  const la = Number(lat);
  const ln = Number(lng);
  return Number.isFinite(la) && Number.isFinite(ln);
};

const formatCoords = (lat, lng) =>
  `Lat ${Number(lat).toFixed(4)}° · Lon ${Number(lng).toFixed(4)}°`;

const AuxilioLiveMap = ({ pickup, driverLocation, searching, style }) => {
  const lat = pickup?.coordinates?.lat;
  const lng = pickup?.coordinates?.lng;
  const coordsValid = hasValidCoords(lat, lng);

  const region = useMemo(
    () => ({
      latitude: Number(lat),
      longitude: Number(lng),
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    }),
    [lat, lng]
  );

  const coordsLabel = coordsValid ? formatCoords(lat, lng) : null;
  const addressLabel = pickup?.address || null;

  if (!coordsValid) {
    return (
      <View style={[styles.placeholder, style]}>
        {searching ? (
          <AuxilioSearchingRadar addressLabel={addressLabel} coordsLabel={coordsLabel} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <MapView
        key={`${lat}-${lng}`}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Marker
          coordinate={{ latitude: Number(lat), longitude: Number(lng) }}
          pinColor={COLORS.sos}
          zIndex={2}
        />
        {driverLocation ? (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            pinColor={COLORS.info}
            zIndex={3}
          />
        ) : null}
      </MapView>
      {searching ? (
        <AuxilioSearchingRadar addressLabel={addressLabel} coordsLabel={coordsLabel} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.backgroundSecondary, overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject },
  placeholder: { flex: 1, backgroundColor: COLORS.backgroundSecondary, overflow: 'hidden' },
});

export default AuxilioLiveMap;
