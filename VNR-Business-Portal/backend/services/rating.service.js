import { supabaseAdmin } from '../config/supabase.js';

const FALLBACK_RATING_TAGS = [
  { id: 'fb-1', name: 'punctual', name_es: 'Puntual', rating_type: 'user_to_driver', is_positive: true },
  { id: 'fb-2', name: 'friendly', name_es: 'Amable', rating_type: 'user_to_driver', is_positive: true },
  { id: 'fb-3', name: 'professional', name_es: 'Profesional', rating_type: 'user_to_driver', is_positive: true },
  { id: 'fb-4', name: 'fast_response', name_es: 'Respuesta rápida', rating_type: 'user_to_driver', is_positive: true },
  { id: 'fb-5', name: 'good_communication', name_es: 'Buena comunicación', rating_type: 'user_to_driver', is_positive: true },
  { id: 'fb-6', name: 'late', name_es: 'Llegó tarde', rating_type: 'user_to_driver', is_positive: false },
  { id: 'fb-7', name: 'rude', name_es: 'Poco amable', rating_type: 'user_to_driver', is_positive: false },
  { id: 'fb-8', name: 'slow_response', name_es: 'Demoró en llegar', rating_type: 'user_to_driver', is_positive: false },
  { id: 'fb-9', name: 'ready_on_time', name_es: 'Listo a tiempo', rating_type: 'driver_to_user', is_positive: true },
  { id: 'fb-10', name: 'respectful', name_es: 'Respetuoso', rating_type: 'driver_to_user', is_positive: true },
  { id: 'fb-11', name: 'unclear_location', name_es: 'Ubicación confusa', rating_type: 'driver_to_user', is_positive: false },
];

const filterFallbackTags = (ratingType, stars) => {
  let tags = FALLBACK_RATING_TAGS.filter(
    (tag) => tag.rating_type === ratingType || tag.rating_type === 'both'
  );

  if (stars !== null) {
    tags = tags.filter((tag) => (stars >= 4 ? tag.is_positive : !tag.is_positive));
  }

  return tags;
};

/**
 * Servicio de Calificaciones (Ratings)
 * Maneja las calificaciones entre usuarios y conductores
 */
const ratingService = {
  // ==========================================
  // CREAR CALIFICACIÓN
  // ==========================================

  /**
   * Crear una calificación para un viaje
   * @param {Object} ratingData - Datos de la calificación
   * @param {string} ratingData.rideId - ID del viaje
   * @param {string} ratingData.raterId - ID de quien califica
   * @param {string} ratingData.ratedId - ID de quien recibe la calificación
   * @param {string} ratingData.ratingType - 'user_to_driver' o 'driver_to_user'
   * @param {number} ratingData.stars - Calificación (1-5)
   * @param {string} ratingData.comment - Comentario opcional
   * @param {string[]} ratingData.tags - Tags seleccionados
   */
  async createRideRating(ratingData) {
    const { rideId, raterId, ratedId, ratingType, stars, comment, tags } = ratingData;

    // Validar que el viaje existe y está completado (usando supabaseAdmin para bypass RLS)
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides')
      .select('id, user_id, driver_id, status')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      throw new Error('Viaje no encontrado');
    }

    if (ride.status !== 'completed') {
      throw new Error('Solo se pueden calificar viajes completados');
    }

    // Validar que el usuario es parte del viaje
    if (ride.user_id !== raterId && ride.driver_id !== raterId) {
      throw new Error('No tienes permiso para calificar este viaje');
    }

    // Validar que está calificando a la persona correcta
    if (ratingType === 'user_to_driver' && ratedId !== ride.driver_id) {
      throw new Error('ID de conductor incorrecto');
    }
    if (ratingType === 'driver_to_user' && ratedId !== ride.user_id) {
      throw new Error('ID de usuario incorrecto');
    }

    // Verificar que no haya calificado ya
    const { data: existingRating } = await supabaseAdmin
      .from('ratings')
      .select('id')
      .eq('ride_id', rideId)
      .eq('rater_id', raterId)
      .single();

    if (existingRating) {
      throw new Error('Ya has calificado este viaje');
    }

    // Crear la calificación (usando supabaseAdmin para bypass RLS)
    const { data: rating, error } = await supabaseAdmin
      .from('ratings')
      .insert({
        ride_id: rideId,
        rater_id: raterId,
        rated_id: ratedId,
        rating_type: ratingType,
        stars,
        comment: comment || null,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating rating:', error);
      throw new Error('Error al crear la calificación');
    }

    // Actualizar promedio de calificación del usuario calificado
    await this.updateUserRatingAverage(ratedId);

    return rating;
  },

  /**
   * Crear una calificación para una entrega
   */
  async createDeliveryRating(ratingData) {
    const { deliveryId, raterId, ratedId, ratingType, stars, comment, tags } = ratingData;

    console.log('📝 createDeliveryRating - Looking for delivery:', deliveryId);

    // Validar que la entrega existe y está completada (usando supabaseAdmin para bypass RLS)
    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .select('id, user_id, driver_id, status')
      .eq('id', deliveryId)
      .single();

    console.log('📝 Delivery query result:', { delivery, error: deliveryError });

    if (deliveryError || !delivery) {
      throw new Error('Entrega no encontrada');
    }

    if (delivery.status !== 'delivered') {
      throw new Error('Solo se pueden calificar entregas completadas');
    }

    // Validar que el usuario es parte de la entrega
    if (delivery.user_id !== raterId && delivery.driver_id !== raterId) {
      throw new Error('No tienes permiso para calificar esta entrega');
    }

    // Verificar que no haya calificado ya
    const { data: existingRating } = await supabaseAdmin
      .from('ratings')
      .select('id')
      .eq('delivery_id', deliveryId)
      .eq('rater_id', raterId)
      .single();

    if (existingRating) {
      throw new Error('Ya has calificado esta entrega');
    }

    // Crear la calificación (usando supabaseAdmin para bypass RLS)
    const { data: rating, error } = await supabaseAdmin
      .from('ratings')
      .insert({
        delivery_id: deliveryId,
        rater_id: raterId,
        rated_id: ratedId,
        rating_type: ratingType,
        stars,
        comment: comment || null,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating rating:', error);
      throw new Error('Error al crear la calificación');
    }

    // Actualizar promedio de calificación del usuario calificado
    await this.updateUserRatingAverage(ratedId);

    return rating;
  },

  /**
   * Actualizar el promedio de calificación de un usuario
   * @param {string} userId - ID del usuario
   */
  async updateUserRatingAverage(userId) {
    try {
      // Calcular nuevo promedio
      const { data: ratings, error: ratingsError } = await supabaseAdmin
        .from('ratings')
        .select('stars')
        .eq('rated_id', userId);

      if (ratingsError) {
        console.error('Error fetching ratings for average:', ratingsError);
        return;
      }

      if (ratings && ratings.length > 0) {
        const total = ratings.reduce((sum, r) => sum + r.stars, 0);
        const average = total / ratings.length;

        // Actualizar perfil
        await supabaseAdmin
          .from('profiles')
          .update({
            rating_average: average.toFixed(2),
            rating_count: ratings.length,
          })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error updating rating average:', error);
    }
  },

  // ==========================================
  // OBTENER CALIFICACIONES
  // ==========================================

  /**
   * Obtener calificaciones recibidas por un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de paginación
   */
  async getUserRatings(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { data: ratings, error, count } = await supabaseAdmin
      .from('ratings')
      .select(`
        *,
        rater:rater_id (
          id,
          nombre,
          apellido,
          avatar
        )
      `, { count: 'exact' })
      .eq('rated_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching ratings:', error);
      throw new Error('Error al obtener calificaciones');
    }

    return {
      ratings,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  },

  /**
   * Obtener estadísticas de calificación de un usuario
   * @param {string} userId - ID del usuario
   */
  async getRatingStats(userId) {
    // Obtener el promedio y conteo del perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('rating_average, rating_count')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Error al obtener estadísticas');
    }

    // Obtener distribución de estrellas
    const { data: ratings, error: ratingsError } = await supabaseAdmin
      .from('ratings')
      .select('stars, tags')
      .eq('rated_id', userId);

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
      throw new Error('Error al obtener estadísticas');
    }

    // Calcular distribución
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const tagCounts = {};

    ratings.forEach((r) => {
      distribution[r.stars] = (distribution[r.stars] || 0) + 1;
      if (r.tags) {
        r.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Obtener top tags
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    return {
      average: parseFloat(profile.rating_average) || 5.0,
      total: profile.rating_count || 0,
      distribution,
      topTags,
    };
  },

  /**
   * Obtener calificación de un viaje específico
   * @param {string} rideId - ID del viaje
   * @param {string} raterId - ID de quien calificó
   */
  async getRideRating(rideId, raterId) {
    const { data: rating, error } = await supabaseAdmin
      .from('ratings')
      .select('*')
      .eq('ride_id', rideId)
      .eq('rater_id', raterId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching rating:', error);
      throw new Error('Error al obtener calificación');
    }

    return rating;
  },

  /**
   * Verificar si el usuario puede calificar un viaje
   * @param {string} rideId - ID del viaje
   * @param {string} userId - ID del usuario
   */
  async canRateRide(rideId, userId) {
    // Obtener el viaje (usando supabaseAdmin para bypass RLS)
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides')
      .select('id, user_id, driver_id, status')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      return { canRate: false, reason: 'Viaje no encontrado' };
    }

    if (ride.status !== 'completed') {
      return { canRate: false, reason: 'El viaje no está completado' };
    }

    if (ride.user_id !== userId && ride.driver_id !== userId) {
      return { canRate: false, reason: 'No eres parte de este viaje' };
    }

    // Verificar si ya calificó
    const { data: existingRating } = await supabaseAdmin
      .from('ratings')
      .select('id')
      .eq('ride_id', rideId)
      .eq('rater_id', userId)
      .single();

    if (existingRating) {
      return { canRate: false, reason: 'Ya calificaste este viaje' };
    }

    // Determinar a quién debe calificar
    const ratedId = ride.user_id === userId ? ride.driver_id : ride.user_id;
    const ratingType = ride.user_id === userId ? 'user_to_driver' : 'driver_to_user';

    return {
      canRate: true,
      ratedId,
      ratingType,
    };
  },

  // ==========================================
  // TAGS
  // ==========================================

  /**
   * Obtener tags disponibles para calificación
   * @param {string} ratingType - 'user_to_driver' o 'driver_to_user'
   * @param {number} stars - Número de estrellas para filtrar tags
   */
  async getRatingTags(ratingType, stars = null) {
    try {
      let query = supabaseAdmin
        .from('rating_tags')
        .select('*')
        .eq('is_active', true)
        .in('rating_type', [ratingType, 'both'])
        .order('display_order', { ascending: true });

      if (stars !== null) {
        if (stars >= 4) {
          query = query.eq('is_positive', true);
        } else {
          query = query.eq('is_positive', false);
        }
      }

      const { data: tags, error } = await query;

      if (error) {
        console.error('Error fetching rating tags:', error);
        return filterFallbackTags(ratingType, stars);
      }

      if (!tags?.length) {
        return filterFallbackTags(ratingType, stars);
      }

      return tags;
    } catch (error) {
      console.error('Error fetching rating tags:', error);
      return filterFallbackTags(ratingType, stars);
    }
  },

  // ==========================================
  // REPORTES (ADMIN)
  // ==========================================

  /**
   * Obtener conductores mejor calificados
   * @param {number} limit - Cantidad de resultados
   */
  async getTopRatedDrivers(limit = 10) {
    const { data: drivers, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, avatar, rating_average, rating_count')
      .eq('role', 'driver')
      .gte('rating_count', 5) // Mínimo 5 calificaciones
      .order('rating_average', { ascending: false })
      .order('rating_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top drivers:', error);
      throw new Error('Error al obtener conductores destacados');
    }

    return drivers;
  },

  /**
   * Obtener conductores con calificaciones bajas (para revisión)
   * @param {number} threshold - Umbral de calificación
   */
  async getLowRatedDrivers(threshold = 3.5) {
    const { data: drivers, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, email, rating_average, rating_count')
      .eq('role', 'driver')
      .gte('rating_count', 3) // Mínimo 3 calificaciones
      .lt('rating_average', threshold)
      .order('rating_average', { ascending: true });

    if (error) {
      console.error('Error fetching low-rated drivers:', error);
      throw new Error('Error al obtener conductores con baja calificación');
    }

    return drivers;
  },

  /**
   * Obtener calificaciones recientes con comentarios negativos
   * @param {number} limit - Cantidad de resultados
   */
  async getRecentNegativeRatings(limit = 20) {
    const { data: ratings, error } = await supabaseAdmin
      .from('ratings')
      .select(`
        *,
        rater:rater_id (nombre, apellido),
        rated:rated_id (nombre, apellido, email)
      `)
      .lte('stars', 2)
      .not('comment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching negative ratings:', error);
      throw new Error('Error al obtener calificaciones negativas');
    }

    return ratings;
  },
};

export default ratingService;
