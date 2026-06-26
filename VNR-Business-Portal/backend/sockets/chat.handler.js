import { supabaseAdmin } from '../config/supabase.js';
import notificationService from '../services/notification.service.js';

// Cache de presencia en memoria para evitar consultas constantes
const presenceCache = new Map(); // Map<rideId, Map<userId, isViewing>>

/**
 * Handler de Chat en tiempo real
 * Maneja mensajes entre usuario y conductor durante viajes
 */
const chatHandler = (socket, io) => {
  const user = socket.user;

  if (!user) return;

  // ==========================================
  // ENVIAR MENSAJE
  // ==========================================

  /**
   * Usuario envía un mensaje
   * Evento: chat:send
   * Data: {
   *   rideId: string,
   *   content: string,
   *   messageType?: 'text' | 'location' | 'quick_reply',
   *   locationLat?: number,
   *   locationLng?: number
   * }
   */
  socket.on('chat:send', async (data, callback) => {
    console.log('📨 chat:send recibido:', { userId: user.id, userName: user.nombre, data });
    try {
      const { rideId, content, messageType = 'text', locationLat, locationLng } = data;

      if (!rideId || !content) {
        console.log('❌ chat:send - Datos incompletos:', { rideId, content });
        if (callback) callback({ success: false, error: 'Datos incompletos' });
        return;
      }

      // Verificar que el usuario es parte del viaje o envío
      let tripData = null;
      let tripType = null;

      // Primero buscar en rides
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('id, user_id, driver_id, status')
        .eq('id', rideId)
        .single();

      if (ride) {
        tripData = ride;
        tripType = 'ride';
      } else {
        // Si no está en rides, buscar en deliveries
        const { data: delivery } = await supabaseAdmin
          .from('deliveries')
          .select('id, user_id, driver_id, status')
          .eq('id', rideId)
          .single();

        if (delivery) {
          tripData = delivery;
          tripType = 'delivery';
        }
      }

      if (!tripData) {
        if (callback) callback({ success: false, error: 'Viaje o envío no encontrado' });
        return;
      }

      // Determinar el receptor
      const isUser = tripData.user_id === user.id;
      const isDriver = tripData.driver_id === user.id;

      if (!isUser && !isDriver) {
        if (callback) callback({ success: false, error: 'No autorizado' });
        return;
      }

      const receiverId = isUser ? tripData.driver_id : tripData.user_id;

      if (!receiverId) {
        if (callback) callback({ success: false, error: 'No hay receptor asignado' });
        return;
      }

      // Guardar mensaje en BD
      const { data: message, error: messageError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          ride_id: rideId,
          sender_id: user.id,
          receiver_id: receiverId,
          message_type: messageType,
          content,
          location_lat: locationLat || null,
          location_lng: locationLng || null,
        })
        .select(`
          id,
          ride_id,
          sender_id,
          receiver_id,
          message_type,
          content,
          location_lat,
          location_lng,
          is_read,
          created_at
        `)
        .single();

      if (messageError) {
        console.error('Error saving message:', messageError);
        if (callback) callback({ success: false, error: 'Error guardando mensaje' });
        return;
      }

      // Agregar info del sender al mensaje para emitir
      const messageToEmit = {
        ...message,
        sender_name: user.nombre,
        sender_avatar: user.avatar,
      };

      // Emitir mensaje al room del viaje
      io.to(`ride:${rideId}`).emit('chat:message', messageToEmit);

      // Verificar si el receptor está viendo el chat
      const isReceiverViewing = await checkReceiverPresence(rideId, receiverId);

      // Si el receptor NO está viendo el chat, enviar notificación push
      if (!isReceiverViewing) {
        try {
          await notificationService.sendNewMessage(
            receiverId,
            user.nombre,
            content,
            rideId
          );
          console.log(`📱 Push notification sent to ${receiverId} for chat message`);
        } catch (notifError) {
          console.error('Error sending chat notification:', notifError);
        }
      }

      if (callback) {
        callback({ success: true, message: messageToEmit });
      }

      console.log(`💬 Mensaje enviado: ${user.nombre} -> Ride ${rideId}`);

    } catch (error) {
      console.error('Error in chat:send:', error);
      if (callback) callback({ success: false, error: 'Error interno' });
    }
  });

  // ==========================================
  // OBTENER HISTORIAL DE MENSAJES
  // ==========================================

  /**
   * Obtener mensajes de un viaje o envío
   * Evento: chat:history
   * Data: { rideId: string, limit?: number, offset?: number }
   */
  socket.on('chat:history', async (data, callback) => {
    console.log('📜 chat:history recibido:', { userId: user.id, data });
    try {
      const { rideId, limit = 50, offset = 0 } = data;

      if (!rideId || typeof callback !== 'function') {
        console.log('❌ chat:history - Datos inválidos:', { rideId, hasCallback: typeof callback === 'function' });
        return;
      }

      // Verificar acceso al viaje o envío
      let tripData = null;

      // Primero buscar en rides
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('user_id, driver_id')
        .eq('id', rideId)
        .single();

      if (ride) {
        tripData = ride;
      } else {
        // Si no está en rides, buscar en deliveries
        const { data: delivery } = await supabaseAdmin
          .from('deliveries')
          .select('user_id, driver_id')
          .eq('id', rideId)
          .single();

        if (delivery) {
          tripData = delivery;
        }
      }

      if (!tripData || (tripData.user_id !== user.id && tripData.driver_id !== user.id)) {
        callback({ success: false, error: 'No autorizado' });
        return;
      }

      // Obtener mensajes usando la función de BD
      const { data: messages, error } = await supabaseAdmin
        .rpc('get_chat_messages', {
          p_ride_id: rideId,
          p_limit: limit,
          p_offset: offset,
        });

      if (error) {
        callback({ success: false, error: 'Error obteniendo mensajes' });
        return;
      }

      // Revertir orden para mostrar de más antiguo a más nuevo
      callback({
        success: true,
        messages: (messages || []).reverse(),
      });

    } catch (error) {
      console.error('Error in chat:history:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Error interno' });
      }
    }
  });

  // ==========================================
  // MARCAR MENSAJES COMO LEÍDOS
  // ==========================================

  /**
   * Marcar mensajes como leídos
   * Evento: chat:read
   * Data: { rideId: string }
   */
  socket.on('chat:read', async ({ rideId }) => {
    try {
      if (!rideId) return;

      // Marcar mensajes como leídos
      const { data: count } = await supabaseAdmin
        .rpc('mark_messages_read', {
          p_ride_id: rideId,
          p_user_id: user.id,
        });

      if (count > 0) {
        // Notificar al sender que sus mensajes fueron leídos
        io.to(`ride:${rideId}`).emit('chat:messages_read', {
          rideId,
          readerId: user.id,
          count,
        });
      }

    } catch (error) {
      console.error('Error in chat:read:', error);
    }
  });

  // ==========================================
  // ESTADO DE PRESENCIA (VIEWING)
  // ==========================================

  /**
   * Usuario indica si está viendo el chat
   * Evento: chat:viewing
   * Data: { rideId: string, isViewing: boolean }
   */
  socket.on('chat:viewing', async ({ rideId, isViewing }) => {
    try {
      if (!rideId) return;

      // Actualizar cache local
      updatePresenceCache(rideId, user.id, isViewing);

      // Guardar en BD
      await supabaseAdmin
        .from('chat_presence')
        .upsert({
          user_id: user.id,
          ride_id: rideId,
          is_viewing: isViewing,
          last_seen_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,ride_id',
        });

      // Notificar al otro usuario sobre el estado de presencia
      socket.to(`ride:${rideId}`).emit('chat:presence', {
        rideId,
        userId: user.id,
        isViewing,
      });

      // Si empieza a ver el chat, marcar mensajes como leídos
      if (isViewing) {
        await supabaseAdmin
          .rpc('mark_messages_read', {
            p_ride_id: rideId,
            p_user_id: user.id,
          });
      }

    } catch (error) {
      console.error('Error in chat:viewing:', error);
    }
  });

  // ==========================================
  // INDICADOR DE ESCRITURA (TYPING)
  // ==========================================

  /**
   * Usuario está escribiendo
   * Evento: chat:typing
   * Data: { rideId: string, isTyping: boolean }
   */
  socket.on('chat:typing', ({ rideId, isTyping }) => {
    if (!rideId) return;

    // Emitir a otros en el room
    socket.to(`ride:${rideId}`).emit('chat:typing', {
      rideId,
      userId: user.id,
      userName: user.nombre,
      isTyping,
    });
  });

  // ==========================================
  // OBTENER RESPUESTAS RÁPIDAS
  // ==========================================

  /**
   * Obtener respuestas rápidas disponibles
   * Evento: chat:quick_replies
   */
  socket.on('chat:quick_replies', async (callback) => {
    try {
      if (typeof callback !== 'function') return;

      const { data: replies, error } = await supabaseAdmin
        .from('quick_replies')
        .select('id, text, category')
        .eq('is_active', true)
        .or(`for_role.eq.both,for_role.eq.${user.role}`)
        .order('sort_order', { ascending: true });

      if (error) {
        callback({ success: false, error: 'Error obteniendo respuestas' });
        return;
      }

      callback({ success: true, replies: replies || [] });

    } catch (error) {
      console.error('Error in chat:quick_replies:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Error interno' });
      }
    }
  });

  // ==========================================
  // OBTENER MENSAJES NO LEÍDOS
  // ==========================================

  /**
   * Obtener conteo de mensajes no leídos por viaje
   * Evento: chat:unread
   */
  socket.on('chat:unread', async (callback) => {
    try {
      if (typeof callback !== 'function') return;

      const { data, error } = await supabaseAdmin
        .rpc('count_unread_messages', { p_user_id: user.id });

      if (error) {
        callback({ success: false, error: 'Error obteniendo conteo' });
        return;
      }

      callback({ success: true, unread: data || [] });

    } catch (error) {
      console.error('Error in chat:unread:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Error interno' });
      }
    }
  });

  // ==========================================
  // CLEANUP AL DESCONECTAR
  // ==========================================

  socket.on('disconnect', async () => {
    // Limpiar presencia del usuario en todos los chats
    try {
      await supabaseAdmin
        .from('chat_presence')
        .update({ is_viewing: false })
        .eq('user_id', user.id);

      // Limpiar cache local
      for (const [rideId, presence] of presenceCache) {
        if (presence.has(user.id)) {
          presence.delete(user.id);
        }
      }
    } catch (error) {
      console.error('Error cleaning up chat presence:', error);
    }
  });
};

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Verificar si el receptor está viendo el chat
 */
async function checkReceiverPresence(rideId, receiverId) {
  // Primero revisar cache
  const ridePresence = presenceCache.get(rideId);
  if (ridePresence && ridePresence.has(receiverId)) {
    return ridePresence.get(receiverId);
  }

  // Si no está en cache, consultar BD
  try {
    const { data } = await supabaseAdmin
      .from('chat_presence')
      .select('is_viewing')
      .eq('ride_id', rideId)
      .eq('user_id', receiverId)
      .single();

    const isViewing = data?.is_viewing || false;

    // Guardar en cache
    updatePresenceCache(rideId, receiverId, isViewing);

    return isViewing;
  } catch {
    return false;
  }
}

/**
 * Actualizar cache de presencia
 */
function updatePresenceCache(rideId, userId, isViewing) {
  if (!presenceCache.has(rideId)) {
    presenceCache.set(rideId, new Map());
  }
  presenceCache.get(rideId).set(userId, isViewing);
}

export default chatHandler;
