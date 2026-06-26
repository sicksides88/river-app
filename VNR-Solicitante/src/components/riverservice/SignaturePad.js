import React, { useRef, useState } from 'react';
import { View, PanResponder, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const SignaturePad = ({ onSave, height = 180 }) => {
  const [paths, setPaths] = useState([]);
  const currentPath = useRef([]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current = [{ x: locationX, y: locationY }];
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current.push({ x: locationX, y: locationY });
        setPaths((prev) => [...prev.slice(0, -1), [...currentPath.current]]);
      },
      onPanResponderRelease: () => {
        if (currentPath.current.length > 0) {
          setPaths((prev) => [...prev.filter((p) => p !== currentPath.current), [...currentPath.current]]);
        }
        currentPath.current = [];
      },
    })
  ).current;

  const clear = () => setPaths([]);

  const save = () => {
    if (paths.length === 0) return;
    onSave?.({ paths, timestamp: Date.now() });
  };

  return (
    <View>
      <View style={[styles.pad, { height }]} {...panResponder.panHandlers}>
        {paths.map((path, pi) =>
          path.map((point, i) => {
            if (i === 0) return null;
            const prev = path[i - 1];
            const len = Math.hypot(point.x - prev.x, point.y - prev.y);
            const angle = (Math.atan2(point.y - prev.y, point.x - prev.x) * 180) / Math.PI;
            return (
              <View
                key={`${pi}-${i}`}
                style={[
                  styles.stroke,
                  {
                    width: len,
                    left: prev.x,
                    top: prev.y,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })
        )}
        {paths.length === 0 && (
          <Text style={styles.placeholder}>Firme aquí con el dedo</Text>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={clear} style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>Limpiar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={save} style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>Confirmar firma</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pad: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  },
  stroke: {
    position: 'absolute',
    height: 2,
    backgroundColor: COLORS.textOnLight,
    transformOrigin: 'left center',
  },
  placeholder: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    color: COLORS.textMuted,
    fontSize: SIZES.body,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.sm,
  },
  btnSecondary: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
  },
  btnSecondaryText: { color: COLORS.textSecondary },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusFull,
  },
  btnPrimaryText: { color: COLORS.white, fontWeight: '600' },
});

export default SignaturePad;
