import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const Loading = ({
  size = 'large',
  color = COLORS.primary,
  text,
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={COLORS.white} />
        {text && <Text style={styles.fullScreenText}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SIZES.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    marginTop: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.gray,
  },
  fullScreenText: {
    marginTop: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.white,
  },
});

export default Loading;
