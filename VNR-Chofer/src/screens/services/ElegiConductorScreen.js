import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, MapViewWrapper } from '../../components/common';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// ElegiConductorScreen - Selección de servicio basado en Figma "Elegí"
const ElegiConductorScreen = ({ navigation, route }) => {
  const { origin, destination, distance } = route.params || {};
  const [selectedService, setSelectedService] = useState('vuelta');

  // Servicios disponibles como en Figma
  const services = [
    {
      id: 'vuelta',
      name: 'Vuelta Segura',
      price: 2415,
      time: '1:02 P.M.',
      icon: 'car-sport-outline',
    },
    {
      id: 'envios',
      name: 'Envios',
      price: 1415,
      time: '1:02 P.M.',
      icon: 'cube-outline',
    },
    {
      id: 'fletes',
      name: 'Fletes',
      price: 10415,
      time: '1:02 P.M.',
      icon: 'bus-outline',
    },
    {
      id: 'chofer',
      name: 'Chofer',
      price: 2415,
      priceUnit: '/h',
      time: '1:02 P.M.',
      icon: 'person-outline',
    },
  ];

  const formatPrice = (price) => {
    return '$' + price.toLocaleString('es-AR');
  };

  const handleConfirm = () => {
    navigation.navigate('Espera', {
      origin,
      destination,
      service: selectedService,
      price: services.find((s) => s.id === selectedService)?.price,
    });
  };

  const handleSchedule = () => {
    // TODO: Navigate to schedule screen
    navigation.navigate('SeleccionarDiaHora', {
      origin,
      destination,
      service: selectedService,
    });
  };

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        {origin?.coordinates && destination?.coordinates ? (
          <MapViewWrapper
            origin={{
              lat: origin.coordinates.lat,
              lng: origin.coordinates.lng,
              title: 'Origen',
            }}
            destination={{
              lat: destination.coordinates.lat,
              lng: destination.coordinates.lng,
              title: 'Destino',
            }}
            showRoute
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color={COLORS.textMuted} />
          </View>
        )}

        {/* Back Button */}
        <SafeAreaView style={styles.backButtonContainer} edges={['top', 'bottom']}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* ETA Badge */}
        <View style={styles.etaBadge}>
          <Text style={styles.etaNumber}>2</Text>
          <Text style={styles.etaUnit}>MIN</Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Service Options */}
        <ScrollView
          style={styles.servicesContainer}
          showsVerticalScrollIndicator={false}
        >
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceOption,
                selectedService === service.id && styles.serviceOptionSelected,
              ]}
              onPress={() => setSelectedService(service.id)}
              activeOpacity={0.7}
            >
              {/* Icon placeholder - ASSET NEEDED */}
              <View style={styles.serviceIconContainer}>
                <Ionicons name={service.icon} size={28} color={COLORS.text} />
              </View>

              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceTime}>{service.time}</Text>
              </View>

              <Text style={styles.servicePrice}>
                {formatPrice(service.price)}
                {service.priceUnit && (
                  <Text style={styles.servicePriceUnit}>{service.priceUnit}</Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Payment Method */}
        <TouchableOpacity style={styles.paymentMethod} activeOpacity={0.7}>
          <View style={styles.paymentIcon}>
            <Text style={styles.visaText}>VISA</Text>
          </View>
          <Text style={styles.paymentText}>**** 1234</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            title="Confirmar viaje"
            onPress={handleConfirm}
            style={styles.confirmButton}
          />
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={handleSchedule}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Map
  mapContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundTertiary,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Back Button
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: SIZES.screenPadding,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },

  // ETA Badge
  etaBadge: {
    position: 'absolute',
    top: '35%',
    right: '25%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  etaNumber: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
  },
  etaUnit: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.text,
  },

  // Bottom Sheet
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    paddingBottom: SIZES.xl,
    ...SHADOWS.lg,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },

  // Services
  servicesContainer: {
    maxHeight: 280,
    paddingHorizontal: SIZES.screenPadding,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  serviceOptionSelected: {
    backgroundColor: COLORS.backgroundTertiary,
    marginHorizontal: -SIZES.screenPadding,
    paddingHorizontal: SIZES.screenPadding,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  serviceTime: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  servicePrice: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
  },
  servicePriceUnit: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // Payment Method
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.screenPadding,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: SIZES.sm,
  },
  paymentIcon: {
    backgroundColor: '#1A1F71', // Visa blue
    borderRadius: SIZES.radiusXs,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    marginRight: SIZES.md,
  },
  visaText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  paymentText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
  },

  // Actions
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    gap: SIZES.md,
  },
  confirmButton: {
    flex: 1,
  },
  scheduleButton: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ElegiConductorScreen;
