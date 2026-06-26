import React, { useRef, useState } from 'react';
import { View, PanResponder, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const SignaturePad = ({
  onSave,
  height = 180,
  placeholder = 'Firme aquí con el dedo',
  confirmLabel = 'Confirmar firma',
  clearLabel = 'Limpiar',
  padBackground = COLORS.white,
  strokeColor = COLORS.textOnLight,
  placeholderColor = COLORS.textMuted,
}) => {
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
      <View style={[styles.pad, { height, backgroundColor: padBackground }]} {...panResponder.panHandlers}>
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
                    backgroundColor: strokeColor,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })
        )}
        {paths.length === 0 && (
          <Text style={[styles.placeholder, { color: placeholderColor }]}>{placeholder}</Text>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={clear} style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>{clearLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={save} style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>{confirmLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pad: {
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  },
  stroke: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  placeholder: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    fontSize: SIZES.body,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.sm,
    marginTop: SIZES.md,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.riderBlue,
    alignItems: 'center',
  },
  btnSecondaryText: { color: COLORS.riderBlue, fontWeight: '600' },
  btnPrimary: {
    flex: 1,
    backgroundColor: COLORS.riderBlue,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  btnPrimaryText: { color: COLORS.white, fontWeight: '700' },
});

export default SignaturePad;
