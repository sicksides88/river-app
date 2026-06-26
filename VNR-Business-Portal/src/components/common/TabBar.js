import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { useUnreadMessages } from '../../hooks/useChat';
import { notificationService } from '../../services';

// TabBar basado en diseño Figma
// 5 tabs: Home, Servicios, Historial, Marketplace, Más
const TabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { totalUnread: unreadMessages } = useUnreadMessages();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Load unread notifications count
  const loadNotificationCount = useCallback(async () => {
    try {
      const result = await notificationService.getUnreadCount();
      if (result?.success) {
        setUnreadNotifications(result.count || 0);
      }
    } catch (error) {
      // Silently fail - notifications aren't critical for tab bar
      setUnreadNotifications(0);
    }
  }, []);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadNotificationCount();
    }, [loadNotificationCount])
  );

  // Total unread count (messages + notifications)
  const totalUnread = (unreadMessages || 0) + unreadNotifications;

  // Mapeo de rutas a iconos
  // NOTA: Estos son placeholders usando Ionicons
  // Se reemplazarán con assets custom cuando estén disponibles
  const getIcon = (routeName, isFocused) => {
    const iconSize = 24;
    const iconColor = isFocused ? COLORS.black : COLORS.textMuted;

    switch (routeName) {
      case 'HomeTab':
      case 'Home':
        return (
          <Ionicons
            name={isFocused ? 'home' : 'home-outline'}
            size={iconSize}
            color={iconColor}
          />
        );
      case 'ServicesTab':
      case 'Services':
        // Placeholder: grid de 4 cuadros
        return (
          <Ionicons
            name={isFocused ? 'grid' : 'grid-outline'}
            size={iconSize}
            color={iconColor}
          />
        );
      case 'ActivityTab':
      case 'Activity':
        // Placeholder: documento/historial
        return (
          <Ionicons
            name={isFocused ? 'document-text' : 'document-text-outline'}
            size={iconSize}
            color={iconColor}
          />
        );
      case 'MarketplaceTab':
      case 'Marketplace':
        // Placeholder: tienda
        return (
          <Ionicons
            name={isFocused ? 'storefront' : 'storefront-outline'}
            size={iconSize}
            color={iconColor}
          />
        );
      case 'ProfileTab':
      case 'Profile':
      case 'More':
        // 3 puntos horizontales
        return (
          <Ionicons
            name="ellipsis-horizontal"
            size={iconSize}
            color={iconColor}
          />
        );
      default:
        return (
          <Ionicons
            name="help-circle-outline"
            size={iconSize}
            color={iconColor}
          />
        );
    }
  };

  // Labels para los tabs (opcional, Figma no muestra labels)
  const getLabel = (routeName) => {
    switch (routeName) {
      case 'HomeTab':
      case 'Home':
        return 'Inicio';
      case 'ServicesTab':
      case 'Services':
        return 'Servicios';
      case 'ActivityTab':
      case 'Activity':
        return 'Historial';
      case 'MarketplaceTab':
      case 'Marketplace':
        return 'Tienda';
      case 'ProfileTab':
      case 'Profile':
      case 'More':
        return 'Más';
      default:
        return routeName;
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, SIZES.sm) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Check if this tab should show unread badge (ProfileTab/More contains messages)
        const showBadge = (route.name === 'ProfileTab' || route.name === 'Profile' || route.name === 'More') && totalUnread > 0;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
              {getIcon(route.name, isFocused)}
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </Text>
                </View>
              )}
            </View>
            {/* Labels opcionales - descomentar si se necesitan */}
            {/* <Text style={[styles.label, isFocused && styles.labelActive]}>
              {getLabel(route.name)}
            </Text> */}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingTop: SIZES.sm,
    borderTopWidth: 0,
    ...SHADOWS.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.sm,
  },
  iconContainer: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radiusLg,
  },
  iconContainerActive: {
    backgroundColor: COLORS.backgroundTertiary,
  },
  label: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  labelActive: {
    color: COLORS.text,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 2,
    backgroundColor: COLORS.error || '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default TabBar;
