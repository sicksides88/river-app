import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, MapViewWrapper } from '../../components/common';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// OpcionesPagoScreen - Pantalla de selección de pago basado en Figma
const OpcionesPagoScreen = ({ navigation, route }) => {
  const { origin, destination } = route.params || {};
  const [selectedPayment, setSelectedPayment] = useState('visa-1234');

  // Métodos de pago
  const paymentMethods = [
    {
      id: 'visa-1234',
      type: 'visa',
      label: 'Visa **** 1234',
      icon: 'card',
      color: '#1A1F71',
    },
    {
      id: 'visa-4567',
      type: 'visa',
      label: 'Visa **** 4567',
      icon: 'card',
      color: '#1A1F71',
    },
    {
      id: 'mastercard-8978',
      type: 'mastercard',
      label: 'Mastercard **** 8978',
      icon: 'card',
      color: '#EB001B',
    },
    {
      id: 'efectivo',
      type: 'cash',
      label: 'Efectivo',
      icon: 'cash',
      color: '#4CAF50',
    },
  ];

  const handleAddPayment = () => {
    // TODO: Navigate to add payment method
  };

  const handleContinue = () => {
    navigation.navigate('Espera', {
      origin,
      destination,
      paymentMethod: selectedPayment,
    });
  };

  const renderPaymentIcon = (method) => {
    if (method.type === 'visa') {
      return (
        <View style={[styles.paymentIconContainer, { backgroundColor: '#1A1F71' }]}>
          <Text style={styles.visaText}>VISA</Text>
        </View>
      );
    }
    if (method.type === 'mastercard') {
      return (
        <View style={[styles.paymentIconContainer, { backgroundColor: '#000' }]}>
          <View style={styles.mastercardIcon}>
            <View style={[styles.mastercardCircle, { backgroundColor: '#EB001B' }]} />
            <View style={[styles.mastercardCircle, styles.mastercardCircleOverlap, { backgroundColor: '#F79E1B' }]} />
          </View>
          <Text style={styles.mastercardText}>mastercard</Text>
        </View>
      );
    }
    if (method.type === 'cash') {
      return (
        <View style={[styles.paymentIconContainer, { backgroundColor: '#4CAF50' }]}>
          <Ionicons name="cash" size={20} color={COLORS.white} />
        </View>
      );
    }
    return null;
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

        {/* Title */}
        <Text style={styles.title}>Opciones de pago</Text>

        {/* Payment Methods List */}
        <ScrollView
          style={styles.paymentList}
          showsVerticalScrollIndicator={false}
        >
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={styles.paymentItem}
              onPress={() => setSelectedPayment(method.id)}
              activeOpacity={0.7}
            >
              {renderPaymentIcon(method)}
              <Text style={styles.paymentLabel}>{method.label}</Text>
              {selectedPayment === method.id && (
                <Ionicons name="checkmark" size={24} color={COLORS.text} />
              )}
            </TouchableOpacity>
          ))}

          {/* Add Payment Method */}
          <TouchableOpacity
            style={styles.addPaymentItem}
            onPress={handleAddPayment}
            activeOpacity={0.7}
          >
            <View style={styles.addPaymentIcon}>
              <Ionicons name="add" size={24} color={COLORS.text} />
            </View>
            <Text style={styles.addPaymentText}>Añadir método de pago</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Siguiente"
            onPress={handleContinue}
            fullWidth
          />
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
    top: '30%',
    right: '25%',
    backgroundColor: COLORS.text,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
  },
  etaNumber: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
  },
  etaUnit: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.white,
  },

  // Bottom Sheet
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    paddingBottom: SIZES.xl,
    maxHeight: '60%',
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

  // Title
  title: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },

  // Payment List
  paymentList: {
    paddingHorizontal: SIZES.screenPadding,
    maxHeight: 280,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  paymentIconContainer: {
    width: 48,
    height: 32,
    borderRadius: SIZES.radiusXs,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  visaText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  mastercardIcon: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  mastercardCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  mastercardCircleOverlap: {
    marginLeft: -4,
  },
  mastercardText: {
    color: COLORS.white,
    fontSize: 6,
    fontWeight: '500',
  },
  paymentLabel: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
  },

  // Add Payment
  addPaymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  addPaymentIcon: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  addPaymentText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },

  // Button
  buttonContainer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
  },
});

export default OpcionesPagoScreen;
