import { supabaseAdmin } from '../config/supabase.js';

/**
 * Middleware de autenticación para Socket.IO
 * Verifica el token JWT y adjunta el usuario al socket
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    // Obtener token del handshake
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('Socket auth failed: No token provided');
      return next(new Error('Autenticación requerida'));
    }

    // Verificar token con Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.log('Socket auth failed: Invalid token', authError?.message);
      return next(new Error('Token inválido o expirado'));
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('Socket auth failed: Profile not found', profileError.message);
      return next(new Error('Perfil no encontrado'));
    }

    // Adjuntar usuario al socket
    socket.user = {
      id: user.id,
      email: user.email,
      ...profile,
    };

    console.log(`🔐 Socket autenticado: ${profile.nombre} ${profile.apellido} (${profile.role})`);

    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Error de autenticación'));
  }
};

/**
 * Middleware opcional para permitir conexiones anónimas
 * Útil para funcionalidades públicas
 */
export const socketOptionalAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (token) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (!error && user) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        socket.user = {
          id: user.id,
          email: user.email,
          ...profile,
        };
      }
    }

    // Continuar aunque no haya autenticación
    socket.isAuthenticated = !!socket.user;
    next();
  } catch (error) {
    // En caso de error, continuar sin autenticación
    socket.isAuthenticated = false;
    next();
  }
};

export default socketAuthMiddleware;
