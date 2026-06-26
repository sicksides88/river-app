import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { useUnreadMessages } from '../../hooks/useChat';
import { notificationService } from '../../services';

const TabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { totalUnread: unreadMessages } = useUnreadMessages();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const loadNotificationCount = useCallback(async () => {
    try {
      const result = await notificationService.getUnreadCount();
      if (result?.success) {
        setUnreadNotifications(result.count || 0);
      }
    } catch {
      setUnreadNotifications(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotificationCount();
    }, [loadNotificationCount])
  );

  const totalUnread = (unreadMessages || 0) + unreadNotifications;

  const getIcon = (routeName, isFocused) => {
    const iconSize = 22;
    const iconColor = isFocused ? COLORS.info : COLORS.textMuted;

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
      case 'ActivityTab':
      case 'Activity':
        return (
          <Ionicons
            name={isFocused ? 'trending-up' : 'trending-up-outline'}
            size={iconSize}
            color={iconColor}
          />
        );
      case 'FleetTab':
      case 'Fleet':
        return (
          <Ionicons
            name={isFocused ? 'boat' : 'boat-outline'}
            size={iconSize}
            color={iconColor}
          />
        );
      case 'ProfileTab':
      case 'Profile':
      case 'More':
        return (
          <Ionicons
            name={isFocused ? 'person' : 'person-outline'}
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

  const getLabel = (routeName) => {
    switch (routeName) {
      case 'HomeTab':
      case 'Home':
        return 'Inicio';
      case 'ActivityTab':
      case 'Activity':
        return 'Actividad';
      case 'FleetTab':
      case 'Fleet':
        return 'Flota';
      case 'ProfileTab':
      case 'Profile':
      case 'More':
        return 'Perfil';
      default:
        return routeName;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, SIZES.sm) },
      ]}
    >
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

        const showBadge =
          (route.name === 'ProfileTab' ||
            route.name === 'Profile' ||
            route.name === 'More') &&
          totalUnread > 0;

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
            <View style={styles.iconContainer}>
              {getIcon(route.name, isFocused)}
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {getLabel(route.name)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xs,
  },
  iconContainer: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  labelActive: {
    color: COLORS.info,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: COLORS.error,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.backgroundSecondary,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },
});

export default TabBar;
