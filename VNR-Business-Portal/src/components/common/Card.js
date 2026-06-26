import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

// Card idéntico al CSS original (.service-card, .activity-card)
const Card = ({
  children,
  style,
  onPress,
  padding = SIZES.md,
  variant = 'default', // 'default', 'service', 'activity'
}) => {
  const cardStyles = [
    styles.card,
    styles[variant],
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  // Base card - matching CSS patterns
  card: {
    backgroundColor: COLORS.white,
  },

  // Default variant - matching .service-card CSS
  default: {
    borderRadius: SIZES.radiusLg, // 16px
    borderWidth: SIZES.borderWidth, // 1.5px
    borderColor: COLORS.border, // #e5e5e5
  },

  // Service card variant - matching .service-card CSS
  service: {
    borderRadius: SIZES.radiusLg, // 16px
    borderWidth: SIZES.borderWidth, // 1.5px
    borderColor: COLORS.border, // #e5e5e5
    padding: 20,
  },

  // Activity card variant - matching .activity-card CSS
  activity: {
    borderRadius: SIZES.radius, // 12px
    borderWidth: 1,
    borderColor: COLORS.border, // #e5e5e5
    padding: 15,
  },
});

export default Card;
