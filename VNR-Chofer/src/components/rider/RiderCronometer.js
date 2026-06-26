import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const pad = (n) => String(n).padStart(2, '0');

const formatElapsed = (startedAt) => {
  if (!startedAt) return '00:00:00';
  const diff = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const RiderCronometer = ({ startedAt, label = 'CRONÓMETRO' }) => {
  const [display, setDisplay] = useState(formatElapsed(startedAt));

  useEffect(() => {
    setDisplay(formatElapsed(startedAt));
    const id = setInterval(() => setDisplay(formatElapsed(startedAt)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <View style={styles.wrap}>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.time}>{display}</Text>
      </View>
      <Ionicons name="timer-outline" size={28} color={COLORS.riderOrange} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.riderOrange,
    backgroundColor: COLORS.riderOrangeMuted,
  },
  label: { color: COLORS.riderLabel, fontSize: SIZES.caption, fontWeight: '600', letterSpacing: 1 },
  time: { color: COLORS.riderOrange, fontSize: SIZES.h1, fontWeight: '700', marginTop: 4 },
});

export default RiderCronometer;
