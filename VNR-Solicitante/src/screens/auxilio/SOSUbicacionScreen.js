import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button } from '../../components/common';
import { TopBar, StepperHorizontal } from '../../components/riverservice';
import { locationService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';

const SOSUbicacionScreen = ({ navigation, route }) => {
  const { vessel, emergencyType, failureTypes } = route.params || {};
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const loc = await locationService.getCurrentLocation();
        setLocation({
          lat: loc.latitude,
          lng: loc.longitude,
          address: `Lat ${loc.latitude.toFixed(5)}, Lng ${loc.longitude.toFixed(5)}`,
          accuracy: loc.accuracy,
        });
      } catch {
        setLocation({ lat: -34.6037, lng: -58.3816, address: 'Ubicación por defecto' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLocation({
      lat: latitude,
      lng: longitude,
      address: `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopBar title="Ubicación del auxilio" onBack={() => navigation.goBack()} />
      <StepperHorizontal steps={['Servicio', 'Ubicación', 'Confirmar']} currentStep={1} />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primaryAccent} />
      ) : (
        <>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={{
              latitude: location.lat,
              longitude: location.lng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Marker
              coordinate={{ latitude: location.lat, longitude: location.lng }}
              draggable
              onDragEnd={onDragEnd}
              pinColor={COLORS.sos}
            />
          </MapView>
          <View style={styles.info}>
            <Text style={styles.hint}>Arrastrá el pin para ajustar tu posición en el agua</Text>
            <Text style={styles.coords}>{location.address}</Text>
          </View>
        </>
      )}
      <View style={styles.footer}>
        <Button
          title="Confirmar ubicación"
          onPress={() =>
            navigation.navigate('SOSConfirmar', {
              vessel,
              emergencyType,
              failureTypes,
              location,
            })
          }
          disabled={!location}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { flex: 1 },
  loader: { flex: 1, alignSelf: 'center' },
  info: { padding: SIZES.md, backgroundColor: COLORS.backgroundSecondary },
  hint: { color: COLORS.textSecondary, fontSize: SIZES.caption },
  coords: { color: COLORS.text, marginTop: 4, fontWeight: '500' },
  footer: { padding: SIZES.screenPadding, borderTopWidth: 1, borderTopColor: COLORS.border },
});

export default SOSUbicacionScreen;
