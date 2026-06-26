import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUnreadMessages } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { rideService } from '../../services';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

/**
 * ConversationsScreen - Lista de conversaciones activas
 * Muestra todos los chats de viajes activos/recientes
 */
const ConversationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { unreadCounts, totalUnread, refreshUnread } = useUnreadMessages();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cargar conversaciones
  const loadConversations = useCallback(async () => {
    try {
      // Obtener viajes activos/recientes del usuario
      const response = await rideService.getUserRides({
        status: ['accepted', 'arrived', 'in_progress', 'completed'],
        limit: 20,
        orderBy: 'updated_at',
      });

      if (response.success && response.data) {
        // Mapear viajes a conversaciones
        const convos = response.data.map((ride) => {
          const isDriver = user?.role === 'driver';
          const otherUser = isDriver ? ride.user : ride.driver;

          return {
            id: ride.id,
            rideId: ride.id,
            otherUser: {
              id: otherUser?.id,
              name: otherUser?.nombre
                ? `${otherUser.nombre} ${otherUser.apellido || ''}`.trim()
                : isDriver ? 'Pasajero' : 'Conductor',
              avatar: otherUser?.avatar,
            },
            status: ride.status,
            lastMessage: ride.last_message || null,
            lastMessageTime: ride.last_message_at || ride.updated_at,
            unreadCount: unreadCounts[ride.id] || 0,
            origin: ride.pickup_address,
            destination: ride.dropoff_address,
          };
        });

        setConversations(convos);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, unreadCounts]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshUnread();
    await loadConversations();
  }, [refreshUnread, loadConversations]);

  // Navegar al chat
  const handleOpenChat = useCallback((conversation) => {
    navigation.navigate('Chat', {
      rideId: conversation.rideId,
      otherUserName: conversation.otherUser.name,
      otherUserAvatar: conversation.otherUser.avatar,
    });
  }, [navigation]);

  // Formatear tiempo relativo
  const formatTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  // Obtener texto de estado
  const getStatusText = (status) => {
    switch (status) {
      case 'accepted': return 'Aceptado';
      case 'arrived': return 'Conductor llegó';
      case 'in_progress': return 'En viaje';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  // Renderizar conversación
  const renderConversation = useCallback(({ item }) => {
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleOpenChat(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.otherUser.avatar ? (
            <Image
              source={{ uri: item.otherUser.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.otherUser.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {item.status === 'in_progress' && (
            <View style={styles.activeIndicator} />
          )}
        </View>

        {/* Info */}
        <View style={styles.conversationInfo}>
          <View style={styles.topRow}>
            <Text style={[styles.userName, hasUnread && styles.userNameBold]} numberOfLines={1}>
              {item.otherUser.name}
            </Text>
            <Text style={[styles.timeText, hasUnread && styles.timeTextBold]}>
              {formatTime(item.lastMessageTime)}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.messagePreview}>
              {item.lastMessage ? (
                <Text style={[styles.lastMessage, hasUnread && styles.lastMessageBold]} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              ) : (
                <Text style={styles.statusText}>
                  {getStatusText(item.status)}
                </Text>
              )}
            </View>

            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount > 9 ? '9+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* Ruta */}
          <View style={styles.routeRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.destination || item.origin || 'Sin destino'}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    );
  }, [handleOpenChat]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.white} />
        <Text style={styles.loadingText}>Cargando conversaciones...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mensajes</Text>
        {totalUnread > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      {/* Lista de conversaciones */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.text}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="rgba(255,255,255,0.55)" />
            <Text style={styles.emptyTitle}>Sin conversaciones</Text>
            <Text style={styles.emptyText}>
              Las conversaciones de tus viajes aparecerán aquí
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SIZES.md,
    color: 'rgba(255,255,255,0.72)',
    fontSize: SIZES.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
  },
  backButton: {
    marginRight: SIZES.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.screenPadding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SIZES.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  conversationInfo: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginRight: SIZES.sm,
  },
  userNameBold: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  timeTextBold: {
    color: COLORS.text,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messagePreview: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  lastMessageBold: {
    color: COLORS.text,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
    minWidth: 22,
    alignItems: 'center',
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: SIZES.screenPadding,
  },
  emptyTitle: {
    marginTop: SIZES.lg,
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyText: {
    marginTop: SIZES.sm,
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
});

export default ConversationsScreen;
