import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../../constants/theme';

const VehicleInfoScreen = ({ navigation, route }) => {
  const { vehicle } = route.params || {};

  // Documentos requeridos del vehículo
  const documents = [
    {
      id: 'cedula',
      title: 'Cédula el vehículo (ambos lados)',
      status: 'pending',
      statusText: 'Siguiente paso recomendado',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {vehicle?.brand} {vehicle?.model} {vehicle?.color}
        </Text>
        <Text style={styles.subtitle}>
          Envíanos la siguiente documentación del vehículo
        </Text>

        {/* Document items */}
        {documents.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            style={styles.documentItem}
            activeOpacity={0.7}
          >
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>{doc.title}</Text>
              <Text style={[
                styles.documentStatus,
                doc.status === 'pending' && styles.documentStatusPending,
              ]}>
                {doc.statusText}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={'rgba(255,255,255,0.7)'} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.xl,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: SIZES.body,
    color: COLORS.white,
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: SIZES.small,
    color: COLORS.success,
  },
  documentStatusPending: {
    color: COLORS.primary,
  },
});

export default VehicleInfoScreen;
