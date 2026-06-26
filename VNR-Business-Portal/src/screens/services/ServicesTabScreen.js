import React from 'react';
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
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// ServicesTabScreen basado en diseño Figma
// Grid de 4 servicios: Vuelta Segura, Envíos, Fletes, Chofer
const ServicesTabScreen = ({ navigation }) => {
  const services = [
    {
      id: 'vuelta-segura',
      name: 'Vuelta\nSegura',
      icon: 'car-sport-outline', // Placeholder - ASSET NEEDED: car-3d.png
      screen: 'VueltaSegura',
    },
    {
      id: 'envios',
      name: 'Envíos',
      icon: 'cube-outline', // Placeholder - ASSET NEEDED: delivery-truck-3d.png
      screen: 'Envios',
    },
    {
      id: 'fletes',
      name: 'Fletes',
      icon: 'bus-outline', // Placeholder - ASSET NEEDED: moving-truck-3d.png
      screen: 'Fletes',
    },
    {
      id: 'chofer',
      name: 'Chofer',
      icon: 'person-outline', // Placeholder - ASSET NEEDED: chauffeur-car-3d.png
      screen: 'Chofer',
    },
  ];

  const handleServicePress = (service) => {
    navigation.navigate('Services', { screen: service.screen });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Servicios</Text>
          <Text style={styles.subtitle}>Obtén de todo, vayas a donde vayas</Text>
        </View>

        {/* Services Grid */}
        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => handleServicePress(service)}
              activeOpacity={0.7}
            >
              <View style={styles.serviceIconContainer}>
                {/* Placeholder icon - será reemplazado por imagen 3D */}
                <Ionicons
                  name={service.icon}
                  size={48}
                  color={COLORS.text}
                />
                {/* Cuando tengas el asset:
                <Image
                  source={require(`../../assets/services/${service.id}.png`)}
                  style={styles.serviceImage}
                  resizeMode="contain"
                />
                */}
              </View>
              <Text style={styles.serviceName}>{service.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>¿Cómo funciona?</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoNumber}>
              <Text style={styles.infoNumberText}>1</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Elegí tu servicio</Text>
              <Text style={styles.infoItemText}>
                Seleccioná el tipo de servicio que necesitás
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoNumber}>
              <Text style={styles.infoNumberText}>2</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Ingresá los detalles</Text>
              <Text style={styles.infoItemText}>
                Completá origen, destino y características
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoNumber}>
              <Text style={styles.infoNumberText}>3</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Confirmá y listo</Text>
              <Text style={styles.infoItemText}>
                Recibí tu conductor o envío en minutos
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SIZES.xxl,
  },
  header: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.md,
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.subtitle,
    color: COLORS.textSecondary,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.screenPadding - SIZES.sm,
    marginTop: SIZES.md,
  },
  serviceCard: {
    width: '25%',
    paddingHorizontal: SIZES.sm,
    marginBottom: SIZES.md,
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 72,
    height: 72,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  serviceImage: {
    width: 56,
    height: 56,
  },
  serviceName: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SIZES.sm,
  },
  infoSection: {
    paddingHorizontal: SIZES.screenPadding,
    marginTop: SIZES.xl,
  },
  infoTitle: {
    fontSize: SIZES.title,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.lg,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: SIZES.lg,
  },
  infoNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  infoNumberText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  infoContent: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  infoItemText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default ServicesTabScreen;
