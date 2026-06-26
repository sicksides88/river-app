import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socket.service';
import { useAuth } from '../context/AuthContext';

/**
 * Hook principal para manejar chat en tiempo real
 * @param {string} rideId - ID del viaje para el chat
 */
export const useChat = (rideId) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserViewing, setOtherUserViewing] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const typingTimeoutRef = useRef(null);

  // Cargar historial de mensajes
  const loadMessages = useCallback(async () => {
    if (!rideId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await new Promise((resolve, reject) => {
        socketService.emit('chat:history', { rideId, limit: 50 }, (result) => {
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error));
          }
        });

        // Timeout
        setTimeout(() => reject(new Error('Timeout')), 10000);
      });

      setMessages(response.messages || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [rideId]);

  // Enviar mensaje
  const sendMessage = useCallback(async (content, messageType = 'text', locationData = null) => {
    console.log('📤 sendMessage called:', { rideId, content, messageType });

    if (!rideId || !content) {
      console.log('❌ sendMessage - missing rideId or content');
      return { success: false };
    }

    try {
      const data = {
        rideId,
        content,
        messageType,
        ...(locationData && {
          locationLat: locationData.latitude,
          locationLng: locationData.longitude,
        }),
      };

      console.log('📤 Emitting chat:send with data:', data);
      console.log('📤 Socket connected:', socketService.isConnected());

      const response = await new Promise((resolve, reject) => {
        const emitResult = socketService.emit('chat:send', data, (result) => {
          console.log('📤 chat:send callback received:', result);
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error || 'Error desconocido'));
          }
        });

        console.log('📤 emit returned:', emitResult);

        if (!emitResult) {
          reject(new Error('Socket no conectado'));
          return;
        }

        setTimeout(() => reject(new Error('Timeout')), 10000);
      });

      return { success: true, message: response.message };
    } catch (err) {
      console.error('❌ Error sending message:', err);
      return { success: false, error: err.message };
    }
  }, [rideId]);

  // Marcar mensajes como leídos
  const markAsRead = useCallback(() => {
    if (!rideId) return;
    socketService.emit('chat:read', { rideId });
  }, [rideId]);

  // Indicar estado de viewing
  const setViewing = useCallback((isViewing) => {
    if (!rideId) return;
    socketService.emit('chat:viewing', { rideId, isViewing });
  }, [rideId]);

  // Indicar que está escribiendo
  const setTyping = useCallback((isTyping) => {
    if (!rideId) return;
    socketService.emit('chat:typing', { rideId, isTyping });
  }, [rideId]);

  // Cargar respuestas rápidas
  const loadQuickReplies = useCallback(async () => {
    try {
      const response = await new Promise((resolve, reject) => {
        socketService.emit('chat:quick_replies', (result) => {
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error));
          }
        });

        setTimeout(() => reject(new Error('Timeout')), 5000);
      });

      setQuickReplies(response.replies || []);
    } catch (err) {
      console.error('Error loading quick replies:', err);
    }
  }, []);

  // Escuchar eventos de chat
  useEffect(() => {
    if (!rideId) return;

    // Unirse al room del viaje para recibir mensajes
    socketService.emit('join:ride', { rideId });

    // Cargar historial al montar
    loadMessages();
    loadQuickReplies();

    // Indicar que está viendo el chat
    setViewing(true);

    // Listener: nuevo mensaje
    const unsubMessage = socketService.on('chat:message', (message) => {
      if (message.ride_id === rideId) {
        setMessages((prev) => [...prev, message]);

        // Si el mensaje es de otro usuario, marcar como leído
        if (message.sender_id !== user?.id) {
          markAsRead();
        }
      }
    });

    // Listener: mensajes leídos
    const unsubRead = socketService.on('chat:messages_read', (data) => {
      if (data.rideId === rideId && data.readerId !== user?.id) {
        // Marcar mensajes enviados por el usuario actual como leídos
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender_id === user?.id && !msg.is_read
              ? { ...msg, is_read: true }
              : msg
          )
        );
      }
    });

    // Listener: usuario escribiendo
    const unsubTyping = socketService.on('chat:typing', (data) => {
      if (data.rideId === rideId && data.userId !== user?.id) {
        setOtherUserTyping(data.isTyping);

        // Auto-clear typing indicator after 3 seconds
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false);
          }, 3000);
        }
      }
    });

    // Listener: presencia
    const unsubPresence = socketService.on('chat:presence', (data) => {
      if (data.rideId === rideId && data.userId !== user?.id) {
        setOtherUserViewing(data.isViewing);
      }
    });

    return () => {
      // Indicar que dejó de ver el chat
      setViewing(false);

      unsubMessage();
      unsubRead();
      unsubTyping();
      unsubPresence();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [rideId, user?.id, loadMessages, loadQuickReplies, setViewing, markAsRead]);

  return {
    messages,
    isLoading,
    error,
    otherUserTyping,
    otherUserViewing,
    quickReplies,
    sendMessage,
    markAsRead,
    setTyping,
    loadMessages,
  };
};

/**
 * Hook para obtener conteo de mensajes no leídos
 */
export const useUnreadMessages = () => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchUnreadCounts = useCallback(async () => {
    // Verificar si el socket está conectado antes de intentar
    if (!socketService.isConnected()) {
      // Socket no conectado, no es un error crítico
      return;
    }

    try {
      const response = await new Promise((resolve, reject) => {
        const socket = socketService.getSocket();
        if (!socket) {
          resolve({ success: true, unread: [] });
          return;
        }

        const timeoutId = setTimeout(() => {
          resolve({ success: true, unread: [] }); // Resolver con vacío en timeout
        }, 5000);

        socket.emit('chat:unread', (result) => {
          clearTimeout(timeoutId);
          if (result?.success) {
            resolve(result);
          } else {
            resolve({ success: true, unread: [] }); // No fallar, devolver vacío
          }
        });
      });

      const counts = {};
      let total = 0;

      (response.unread || []).forEach(({ ride_id, unread_count }) => {
        counts[ride_id] = unread_count;
        total += unread_count;
      });

      setUnreadCounts(counts);
      setTotalUnread(total);
    } catch (err) {
      // Silenciar error - no es crítico para la app
      console.log('Chat unread counts not available');
    }
  }, []);

  // Escuchar nuevos mensajes para actualizar conteo
  useEffect(() => {
    // Delay inicial para dar tiempo al socket a conectarse
    const initialDelay = setTimeout(() => {
      fetchUnreadCounts();
    }, 2000);

    const unsubMessage = socketService.on('chat:message', () => {
      fetchUnreadCounts();
    });

    const unsubRead = socketService.on('chat:messages_read', () => {
      fetchUnreadCounts();
    });

    return () => {
      clearTimeout(initialDelay);
      unsubMessage();
      unsubRead();
    };
  }, [fetchUnreadCounts]);

  return {
    unreadCounts,
    totalUnread,
    refreshUnread: fetchUnreadCounts,
  };
};

/**
 * Hook simplificado para enviar mensajes rápidos
 * @param {string} rideId - ID del viaje
 */
export const useQuickChat = (rideId) => {
  const sendQuickMessage = useCallback(async (text) => {
    if (!rideId || !text) return { success: false };

    try {
      const response = await new Promise((resolve, reject) => {
        socketService.emit('chat:send', {
          rideId,
          content: text,
          messageType: 'quick_reply',
        }, (result) => {
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error));
          }
        });

        setTimeout(() => reject(new Error('Timeout')), 10000);
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [rideId]);

  const sendLocation = useCallback(async (latitude, longitude) => {
    if (!rideId) return { success: false };

    try {
      const response = await new Promise((resolve, reject) => {
        socketService.emit('chat:send', {
          rideId,
          content: 'Mi ubicación actual',
          messageType: 'location',
          locationLat: latitude,
          locationLng: longitude,
        }, (result) => {
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error));
          }
        });

        setTimeout(() => reject(new Error('Timeout')), 10000);
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [rideId]);

  return {
    sendQuickMessage,
    sendLocation,
  };
};

export default useChat;
