import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VesselCard } from '../../components/riverservice';
import { vesselService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';

const FleetListScreen = ({ navigation }) => {
  const [vessels, setVessels] = useState([]);
  const [activeVesselId, setActiveVesselId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const { vessels: list } = await vesselService.getVessels();
        const vesselsList = list || [];
        setVessels(vesselsList);
        const active = await vesselService.resolveActiveVessel(vesselsList);
        setActiveVesselId(active?.id || null);
      };
      load();
    }, [])
  );

  const countLabel = `${vessels.length} embarcación${vessels.length !== 1 ? 'es' : ''}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Flota</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{countLabel}</Text>
        </View>
      </View>

      <FlatList
        data={vessels}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <VesselCard
            vessel={item}
            selected={item.id === activeVesselId}
            onPress={() =>
              navigation.navigate('FleetDetail', {
                vesselId: item.id,
                vessel: item,
                activeVesselId,
              })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No tenés embarcaciones cargadas</Text>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddVessel')}>
        <Ionicons name="add" size={30} color={COLORS.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.lg,
    gap: SIZES.md,
  },
  title: { color: COLORS.text, fontSize: SIZES.h1, fontWeight: '700', flex: 1 },
  countBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  countBadgeText: {
    color: COLORS.info,
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  list: { paddingHorizontal: SIZES.screenPadding, paddingBottom: 100 },
  empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: SIZES.xxl },
  fab: {
    position: 'absolute',
    right: SIZES.lg,
    bottom: SIZES.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.info,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});

export default FleetListScreen;
