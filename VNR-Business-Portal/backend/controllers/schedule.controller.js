import { supabaseAdmin } from "../config/supabase.js";

// Horario por defecto para nuevos conductores
const DEFAULT_WEEKLY_SCHEDULE = [
  { day_of_week: 0, is_available: false, time_ranges: [] }, // Domingo
  { day_of_week: 1, is_available: true, time_ranges: [{ id: 'default-1', start_time: '09:00', end_time: '18:00' }] },
  { day_of_week: 2, is_available: true, time_ranges: [{ id: 'default-2', start_time: '09:00', end_time: '18:00' }] },
  { day_of_week: 3, is_available: true, time_ranges: [{ id: 'default-3', start_time: '09:00', end_time: '18:00' }] },
  { day_of_week: 4, is_available: true, time_ranges: [{ id: 'default-4', start_time: '09:00', end_time: '18:00' }] },
  { day_of_week: 5, is_available: true, time_ranges: [{ id: 'default-5', start_time: '09:00', end_time: '18:00' }] },
  { day_of_week: 6, is_available: false, time_ranges: [] }, // Sábado
];

const DEFAULT_BOOKING_CONFIG = {
  max_advance_days: 60,
  min_notice_hours: 4,
  buffer_days: 10,
  buffer_type: 'calendar',
};

// @desc    Obtener horario del conductor
// @route   GET /api/drivers/schedule
// @access  Private (Driver)
export const getSchedule = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar que sea conductor
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_driver')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.is_driver) {
      return res.status(403).json({
        success: false,
        message: "Debes ser conductor para acceder a esta función",
      });
    }

    // Buscar horario existente
    const { data: schedule, error } = await supabaseAdmin
      .from('driver_schedules')
      .select('*')
      .eq('driver_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Si no existe, devolver valores por defecto
    if (!schedule) {
      return res.json({
        success: true,
        schedule: {
          driver_id: userId,
          weekly_schedule: DEFAULT_WEEKLY_SCHEDULE,
          custom_dates: [],
          booking_config: DEFAULT_BOOKING_CONFIG,
        },
        isNew: true,
      });
    }

    res.json({
      success: true,
      schedule,
      isNew: false,
    });
  } catch (error) {
    console.error("Error obteniendo horario:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Actualizar horario del conductor
// @route   PUT /api/drivers/schedule
// @access  Private (Driver)
export const updateSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { weekly_schedule, custom_dates, booking_config } = req.body;

    // Verificar que sea conductor
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_driver')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.is_driver) {
      return res.status(403).json({
        success: false,
        message: "Debes ser conductor para acceder a esta función",
      });
    }

    // Validar weekly_schedule
    if (weekly_schedule) {
      if (!Array.isArray(weekly_schedule) || weekly_schedule.length !== 7) {
        return res.status(400).json({
          success: false,
          message: "weekly_schedule debe ser un array de 7 días",
        });
      }

      // Validar cada día
      for (const day of weekly_schedule) {
        if (typeof day.day_of_week !== 'number' || day.day_of_week < 0 || day.day_of_week > 6) {
          return res.status(400).json({
            success: false,
            message: "day_of_week debe ser un número entre 0 y 6",
          });
        }
        if (typeof day.is_available !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: "is_available debe ser un boolean",
          });
        }
        if (!Array.isArray(day.time_ranges)) {
          return res.status(400).json({
            success: false,
            message: "time_ranges debe ser un array",
          });
        }
      }
    }

    // Validar booking_config
    if (booking_config) {
      const { max_advance_days, min_notice_hours, buffer_days, buffer_type } = booking_config;

      if (max_advance_days !== undefined && (typeof max_advance_days !== 'number' || max_advance_days < 1 || max_advance_days > 365)) {
        return res.status(400).json({
          success: false,
          message: "max_advance_days debe ser un número entre 1 y 365",
        });
      }

      if (min_notice_hours !== undefined && (typeof min_notice_hours !== 'number' || min_notice_hours < 0 || min_notice_hours > 168)) {
        return res.status(400).json({
          success: false,
          message: "min_notice_hours debe ser un número entre 0 y 168",
        });
      }

      if (buffer_type !== undefined && !['calendar', 'business'].includes(buffer_type)) {
        return res.status(400).json({
          success: false,
          message: "buffer_type debe ser 'calendar' o 'business'",
        });
      }
    }

    // Upsert del horario
    const scheduleData = {
      driver_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (weekly_schedule) {
      scheduleData.weekly_schedule = weekly_schedule;
    }
    if (custom_dates !== undefined) {
      scheduleData.custom_dates = custom_dates;
    }
    if (booking_config) {
      scheduleData.booking_config = booking_config;
    }

    const { data: schedule, error } = await supabaseAdmin
      .from('driver_schedules')
      .upsert(scheduleData, {
        onConflict: 'driver_id',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Horario actualizado correctamente",
      schedule,
    });
  } catch (error) {
    console.error("Error actualizando horario:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Agregar fecha específica al horario
// @route   POST /api/drivers/schedule/custom-date
// @access  Private (Driver)
export const addCustomDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date, time_ranges } = req.body;

    // Validar datos
    if (!start_date) {
      return res.status(400).json({
        success: false,
        message: "start_date es requerido",
      });
    }

    // Verificar que sea conductor
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_driver')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.is_driver) {
      return res.status(403).json({
        success: false,
        message: "Debes ser conductor para acceder a esta función",
      });
    }

    // Obtener horario actual
    let { data: schedule, error: fetchError } = await supabaseAdmin
      .from('driver_schedules')
      .select('*')
      .eq('driver_id', userId)
      .single();

    // Si no existe, crear uno nuevo
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newSchedule, error: insertError } = await supabaseAdmin
        .from('driver_schedules')
        .insert({
          driver_id: userId,
          weekly_schedule: DEFAULT_WEEKLY_SCHEDULE,
          custom_dates: [],
          booking_config: DEFAULT_BOOKING_CONFIG,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      schedule = newSchedule;
    } else if (fetchError) {
      throw fetchError;
    }

    // Generar ID único para la fecha
    const newCustomDate = {
      id: `custom-${Date.now()}`,
      start_date,
      end_date: end_date || start_date,
      time_ranges: time_ranges || [],
    };

    // Agregar al array de fechas personalizadas
    const customDates = schedule.custom_dates || [];
    customDates.push(newCustomDate);

    // Actualizar
    const { data: updatedSchedule, error: updateError } = await supabaseAdmin
      .from('driver_schedules')
      .update({
        custom_dates: customDates,
        updated_at: new Date().toISOString(),
      })
      .eq('driver_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(201).json({
      success: true,
      message: "Fecha personalizada agregada",
      customDate: newCustomDate,
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Error agregando fecha personalizada:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Eliminar fecha específica del horario
// @route   DELETE /api/drivers/schedule/custom-date/:dateId
// @access  Private (Driver)
export const removeCustomDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateId } = req.params;

    // Verificar que sea conductor
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_driver')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.is_driver) {
      return res.status(403).json({
        success: false,
        message: "Debes ser conductor para acceder a esta función",
      });
    }

    // Obtener horario actual
    const { data: schedule, error: fetchError } = await supabaseAdmin
      .from('driver_schedules')
      .select('*')
      .eq('driver_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: "No tienes un horario configurado",
        });
      }
      throw fetchError;
    }

    // Filtrar la fecha a eliminar
    const customDates = (schedule.custom_dates || []).filter(date => date.id !== dateId);

    if (customDates.length === (schedule.custom_dates || []).length) {
      return res.status(404).json({
        success: false,
        message: "Fecha personalizada no encontrada",
      });
    }

    // Actualizar
    const { data: updatedSchedule, error: updateError } = await supabaseAdmin
      .from('driver_schedules')
      .update({
        custom_dates: customDates,
        updated_at: new Date().toISOString(),
      })
      .eq('driver_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: "Fecha personalizada eliminada",
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Error eliminando fecha personalizada:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};
