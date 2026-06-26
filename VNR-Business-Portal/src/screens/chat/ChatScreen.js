import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/theme';

const ChatScreen = ({ route, navigation }) => {
  // Aceptar tanto rideId como deliveryId para compatibilidad con viajes y envíos
  const { rideId, deliveryId, otherUserName, otherUserAvatar, driverName, driverId } = route.params || {};

  // Usar rideId o deliveryId (el chat usa el mismo ID para ambos)
  const chatRideId = rideId || deliveryId;
  const displayName = otherUserName || driverName;
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    error,
    otherUserTyping,
    otherUserViewing,
    quickReplies,
    sendMessage,
    setTyping,
  } = useChat(chatRideId);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Configurar header
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <View style={styles.avatarContainer}>
            {otherUserAvatar ? (
              <Image source={{ uri: otherUserAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {displayName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            {otherUserViewing && <View style={styles.onlineIndicator} />}
          </View>
          <View>
            <Text style={styles.headerName}>{displayName || 'Chat'}</Text>
            {otherUserTyping && (
              <Text style={styles.typingText}>Escribiendo...</Text>
            )}
          </View>
        </View>
      ),
    });
  }, [navigation, displayName, otherUserAvatar, otherUserTyping, otherUserViewing]);

  // Manejar envío de mensaje
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    setTyping(false);
    Keyboard.dismiss();

    try {
      await sendMessage(text);
    } catch (err) {
      console.error('Error sending message:', err);
      // Restaurar texto en caso de error
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, sendMessage, setTyping]);

  // Manejar respuesta rápida
  const handleQuickReply = useCallback(async (text) => {
    setShowQuickReplies(false);
    setIsSending(true);

    try {
      await sendMessage(text, 'quick_reply');
    } catch (err) {
      console.error('Error sending quick reply:', err);
    } finally {
      setIsSending(false);
    }
  }, [sendMessage]);

  // Manejar cambio de texto
  const handleTextChange = useCallback((text) => {
    setInputText(text);

    // Indicar que está escribiendo
    if (text.length > 0) {
      setTyping(true);

      // Dejar de indicar después de 2 segundos sin escribir
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    } else {
      setTyping(false);
    }
  }, [setTyping]);

  // Renderizar mensaje individual
  const renderMessage = useCallback(({ item }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const time = new Date(item.created_at).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {item.message_type === 'location' ? (
          <TouchableOpacity style={styles.locationMessage}>
            <Ionicons name="location" size={20} color={isOwnMessage ? COLORS.white : COLORS.text} />
            <Text style={[styles.locationText, isOwnMessage && styles.ownMessageText]}>
              Ver ubicación
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.content}
          </Text>
        )}
        <View style={styles.messageFooter}>
          <Text style={[styles.timeText, isOwnMessage && styles.ownTimeText]}>
            {time}
          </Text>
          {isOwnMessage && (
            <Ionicons
              name={item.is_read ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={item.is_read ? '#22c55e' : 'rgba(255,255,255,0.6)'}
              style={styles.readIcon}
            />
          )}
        </View>
      </View>
    );
  }, [user?.id]);

  // Renderizar respuestas rápidas
  const renderQuickReplies = useCallback(() => {
    if (!showQuickReplies || quickReplies.length === 0) return null;

    return (
      <View style={styles.quickRepliesContainer}>
        <FlatList
          data={quickReplies}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickReplyButton}
              onPress={() => handleQuickReply(item.text)}
            >
              <Text style={styles.quickReplyText}>{item.text}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }, [showQuickReplies, quickReplies, handleQuickReply]);

  if (isLoading && messages.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.text} />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Lista de mensajes */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                No hay mensajes aún.{'\n'}Envía el primer mensaje!
              </Text>
            </View>
          }
        />

        {/* Respuestas rápidas */}
        {renderQuickReplies()}

        {/* Input de mensaje */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.quickReplyToggle}
            onPress={() => setShowQuickReplies(!showQuickReplies)}
          >
            <Ionicons
              name={showQuickReplies ? 'close' : 'flash'}
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  keyboardView: {
    flex: 1,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: SIZES.radiusLg,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.text,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  ownMessageText: {
    color: COLORS.white,
  },
  locationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
    textDecorationLine: 'underline',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  ownTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  readIcon: {
    marginLeft: 4,
  },
  quickRepliesContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  quickReplyButton: {
    backgroundColor: COLORS.backgroundInput,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickReplyText: {
    fontSize: 13,
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  quickReplyToggle: {
    padding: 8,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
});

export default ChatScreen;
