import { supabaseAdmin } from "../config/supabase.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(" ")[1];

      // Verificar token con Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          success: false,
          message: "No autorizado, token inválido",
        });
      }

      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile in auth middleware:', profileError.message, 'for user:', user.id);
      }

      // Agregar usuario a la request
      req.user = {
        id: user.id,
        email: user.email,
        role: profile?.role || user.user_metadata?.role || 'user',
        ...profile,
      };

      next();
    } catch (error) {
      console.error("Error en autenticación:", error);
      return res.status(401).json({
        success: false,
        message: "No autorizado, token inválido",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "No autorizado, sin token",
    });
  }
};

// Middleware para verificar roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `El rol ${req.user.role} no tiene permiso para acceder a esta ruta`,
      });
    }
    next();
  };
};

// Middleware para verificar que el usuario es conductor
export const driverOnly = (req, res, next) => {
  if (req.user.role !== 'driver' && req.user.is_driver !== true) {
    return res.status(403).json({
      success: false,
      message: 'Solo los conductores pueden acceder a esta ruta',
    });
  }
  next();
};

// Middleware para verificar que el usuario es un comercio
export const businessOnly = (req, res, next) => {
  if (req.user.role !== 'business') {
    return res.status(403).json({
      success: false,
      message: 'Solo los comercios pueden acceder a esta ruta',
    });
  }
  next();
};
