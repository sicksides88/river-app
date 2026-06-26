import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const RiderServiceMetrics = ({ etaMinutes, distanceKm, loading }) => (
  <View style={styles.row}>
    <View style={styles.col}>
      <Text style={styles.label}>ETA</Text>
      <Text style={styles.etaValue}>
        {loading ? '…' : etaMinutes != null ? `${etaMinutes} MIN` : '—'}
      </Text>
    </View>
    <View style={styles.col}>
      <Text style={styles.label}>DISTANCIA</Text>
      <Text style={styles.distValue}>
        {loading ? '…' : distanceKm != null ? `${distanceKm} km` : '— km'}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  label: { color: COLORS.riderLabel, fontSize: SIZES.caption, fontWeight: '600', marginBottom: 4 },
  etaValue: { color: COLORS.riderBlue, fontSize: SIZES.h1, fontWeight: '700' },
  distValue: { color: COLORS.text, fontSize: SIZES.h3, fontWeight: '700' },
});

export default RiderServiceMetrics;
