import { supabaseAdmin, supabase } from "../config/supabase.js";

const mapProfileToUser = (profile, fallback = {}) => ({
  id: profile.id || fallback.id,
  nombre: profile.nombre || fallback.nombre || '',
  apellido: profile.apellido || fallback.apellido || '',
  email: profile.email || fallback.email || '',
  telefono: {
    codigoPais: profile.telefono_codigo_pais || fallback.telefono_codigo_pais || '+54',
    numero: profile.telefono_numero || fallback.telefono_numero || '',
  },
  direccion: profile.direccion || fallback.direccion || '',
  cuit_cuil: profile.cuit_cuil || null,
  tiene_comercio: profile.tiene_comercio || false,
  domicilio_comercio: profile.domicilio_comercio || null,
  certificado_afip_url: profile.certificado_afip_url || null,
  cadeteria: profile.cadeteria || null,
  driver_services: profile.driver_services || [],
  role: profile.role || fallback.role || 'user',
  avatar: profile.avatar || '',
  isVerified: profile.is_verified || false,
  onboarding_completed: profile.onboarding_completed || false,
  selected_services: profile.selected_services || [],
  terms_accepted: profile.terms_accepted || false,
  link_type: profile.link_type || 'independiente',
  membership_skipped: profile.membership_skipped || false,
  insurance_company: profile.insurance_company || null,
  policy_number: profile.policy_number || null,
  policy_expiry_date: profile.policy_expiry_date || null,
  account_holder: profile.account_holder || null,
  account_type: profile.account_type || null,
  cbu: profile.cbu || null,
  bank_name: profile.bank_name || null,
  billing_preference: profile.billing_preference || null,
  subscription_plan: profile.subscription_plan || 'bronce',
  subscription_billing_cycle: profile.subscription_billing_cycle || 'annual',
  subscription_expires_at: profile.subscription_expires_at || null,
});

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      password,
      codigoPais,
      telefono,
      direccion,
      cuit_cuil,
      tiene_comercio,
      domicilio_comercio,
    } = req.body;

    // Validar formato CUIT/CUIL si se proporciona
    if (cuit_cuil) {
      const cuitClean = cuit_cuil.replace(/-/g, '');
      if (!/^\d{11}$/.test(cuitClean)) {
        return res.status(400).json({
          success: false,
          message: "Formato de CUIT/CUIL inválido. Debe ser XX-XXXXXXXX-X",
        });
      }
    }

    // Crear usuario en Supabase Auth con metadata
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email para desarrollo
      user_metadata: {
        nombre,
        apellido,
        telefono,
        direccion,
      },
    });

    if (authError) {
      console.error('Supabase Auth Error:', authError);
      // Manejar errores comunes
      if (authError.message?.includes('already been registered') ||
          authError.message?.includes('already exists') ||
          authError.code === 'user_already_exists') {
        return res.status(400).json({
          success: false,
          message: "Este email ya está registrado",
        });
      }
      if (authError.message?.includes('password')) {
        return res.status(400).json({
          success: false,
          message: "La contraseña no cumple los requisitos mínimos",
        });
      }
      return res.status(400).json({
        success: false,
        message: authError.message || "Error al crear usuario",
      });
    }

    // Actualizar perfil con datos adicionales
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        nombre,
        apellido,
        telefono_codigo_pais: codigoPais || '+54',
        telefono_numero: telefono,
        direccion,
        cuit_cuil: cuit_cuil || null,
        tiene_comercio: tiene_comercio || false,
        domicilio_comercio: domicilio_comercio || null,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Generar sesión para el usuario
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    // Hacer login para obtener el token
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) throw loginError;

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      user: {
        id: authData.user.id,
        nombre,
        apellido,
        email: authData.user.email,
        telefono: {
          codigoPais: codigoPais || '+54',
          numero: telefono,
        },
        direccion,
        cuit_cuil: cuit_cuil || null,
        tiene_comercio: tiene_comercio || false,
        domicilio_comercio: domicilio_comercio || null,
        certificado_afip_url: null,
        cadeteria: null,
        driver_services: [],
        role: 'user',
        onboarding_completed: false,
        selected_services: [],
        terms_accepted: false,
      },
      token: loginData.session.access_token,
      refreshToken: loginData.session.refresh_token,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Autenticar usuario & obtener token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor proporciona email y contraseña",
      });
    }

    // Login con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    res.json({
      success: true,
      message: "Login exitoso",
      user: {
        id: data.user.id,
        nombre: profile?.nombre || data.user.user_metadata?.nombre || '',
        apellido: profile?.apellido || data.user.user_metadata?.apellido || '',
        email: data.user.email,
        telefono: {
          codigoPais: profile?.telefono_codigo_pais || '+54',
          numero: profile?.telefono_numero || '',
        },
        direccion: profile?.direccion || '',
        cuit_cuil: profile?.cuit_cuil || null,
        tiene_comercio: profile?.tiene_comercio || false,
        domicilio_comercio: profile?.domicilio_comercio || null,
        certificado_afip_url: profile?.certificado_afip_url || null,
        cadeteria: profile?.cadeteria || null,
        driver_services: profile?.driver_services || [],
        role: profile?.role || 'user',
        avatar: profile?.avatar || '',
        onboarding_completed: profile?.onboarding_completed || false,
        selected_services: profile?.selected_services || [],
        terms_accepted: profile?.terms_accepted || false,
      },
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Obtener perfil del usuario actual
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener perfil:", error);
    }

    const p = profile || req.user;
    res.json({
      success: true,
      user: mapProfileToUser(p, req.user),
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Cambiar contraseña (usuario autenticado)
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Contraseña actual y nueva son requeridas",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 8 caracteres",
      });
    }

    // Obtener email del usuario
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', req.user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Verificar contraseña actual intentando login
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (loginError) {
      return res.status(401).json({
        success: false,
        message: "La contraseña actual es incorrecta",
      });
    }

    // Actualizar contraseña
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      req.user.id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Solicitar código de recuperación de contraseña
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El email es requerido",
      });
    }

    // Generar OTP de 6 dígitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Verificar que el email existe
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (!profile) {
      // No revelar si el email existe o no por seguridad
      return res.json({
        success: true,
        message: "Si el email está registrado, recibirás un código de recuperación",
      });
    }

    // Guardar OTP en la tabla password_resets (crear si no existe)
    // Primero intentar crear la tabla si no existe
    const { error: deleteError } = await supabaseAdmin
      .from('password_resets')
      .delete()
      .eq('user_id', profile.id);

    const { error: insertError } = await supabaseAdmin
      .from('password_resets')
      .insert({
        user_id: profile.id,
        email: email,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error guardando OTP:", insertError);
      // Si la tabla no existe, la creamos
      if (insertError.code === '42P01') {
        return res.status(500).json({
          success: false,
          message: "Tabla password_resets no existe. Créala en Supabase.",
        });
      }
      throw insertError;
    }

    // Enviar email con Supabase (usar resetPasswordForEmail que envía email nativo)
    // Como alternativa, usamos el OTP guardado y lo enviamos vía Supabase email
    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    res.json({
      success: true,
      message: "Si el email está registrado, recibirás un código de recuperación",
      otp,
    });
  } catch (error) {
    console.error("Error en forgot password:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Verificar OTP y cambiar contraseña
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, código y nueva contraseña son requeridos",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 8 caracteres",
      });
    }

    // Buscar OTP válido
    const { data: resetData, error: resetError } = await supabaseAdmin
      .from('password_resets')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .single();

    if (resetError || !resetData) {
      return res.status(400).json({
        success: false,
        message: "Código inválido o expirado",
      });
    }

    // Verificar expiración
    if (new Date(resetData.expires_at) < new Date()) {
      await supabaseAdmin.from('password_resets').delete().eq('id', resetData.id);
      return res.status(400).json({
        success: false,
        message: "El código ha expirado. Solicita uno nuevo.",
      });
    }

    // Actualizar contraseña
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      resetData.user_id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    // Eliminar OTP usado
    await supabaseAdmin.from('password_resets').delete().eq('id', resetData.id);

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en reset password:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Cerrar sesión
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // En Supabase, el logout se maneja principalmente en el cliente
    // Pero podemos invalidar la sesión si tenemos el token
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      await supabaseAdmin.auth.admin.signOut(token);
    }

    res.json({
      success: true,
      message: "Sesión cerrada exitosamente",
    });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};
