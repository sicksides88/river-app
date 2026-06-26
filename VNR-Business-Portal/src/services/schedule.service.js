import api from './api';

const scheduleService = {
  /**
   * Obtener horario del conductor
   * @returns {Promise<Object>} - Horario del conductor
   */
  getSchedule: async () => {
    const response = await api.get('/drivers/schedule');
    return response.data;
  },

  /**
   * Actualizar horario completo del conductor
   * @param {Object} scheduleData - Datos del horario
   * @param {Array} scheduleData.weekly_schedule - Horario semanal
   * @param {Array} scheduleData.custom_dates - Fechas específicas
   * @param {Object} scheduleData.booking_config - Configuración de reservas
   * @returns {Promise<Object>} - Horario actualizado
   */
  updateSchedule: async (scheduleData) => {
    const response = await api.put('/drivers/schedule', scheduleData);
    return response.data;
  },

  /**
   * Agregar fecha personalizada al horario
   * @param {Object} dateData - Datos de la fecha
   * @param {string} dateData.start_date - Fecha inicio (YYYY-MM-DD)
   * @param {string} dateData.end_date - Fecha fin (YYYY-MM-DD)
   * @param {Array} dateData.time_ranges - Rangos horarios
   * @returns {Promise<Object>} - Fecha agregada
   */
  addCustomDate: async (dateData) => {
    const response = await api.post('/drivers/schedule/custom-date', dateData);
    return response.data;
  },

  /**
   * Eliminar fecha personalizada del horario
   * @param {string} dateId - ID de la fecha a eliminar
   * @returns {Promise<Object>} - Resultado
   */
  removeCustomDate: async (dateId) => {
    const response = await api.delete(`/drivers/schedule/custom-date/${dateId}`);
    return response.data;
  },

  /**
   * Obtener horario por defecto
   * @returns {Object} - Horario por defecto
   */
  getDefaultSchedule: () => ({
    weekly_schedule: [
      { day_of_week: 0, is_available: false, time_ranges: [] },
      { day_of_week: 1, is_available: true, time_ranges: [{ id: 'default-1', start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 2, is_available: true, time_ranges: [{ id: 'default-2', start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 3, is_available: true, time_ranges: [{ id: 'default-3', start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 4, is_available: true, time_ranges: [{ id: 'default-4', start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 5, is_available: true, time_ranges: [{ id: 'default-5', start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 6, is_available: false, time_ranges: [] },
    ],
    custom_dates: [],
    booking_config: {
      max_advance_days: 60,
      min_notice_hours: 4,
      buffer_days: 10,
      buffer_type: 'calendar',
    },
  }),

  /**
   * Formatear hora para mostrar
   * @param {string} time - Hora en formato HH:MM
   * @returns {string} - Hora formateada
   */
  formatTime: (time) => {
    if (!time) return '';
    return `${time} hs`;
  },

  /**
   * Obtener nombre del día
   * @param {number} dayOfWeek - Día de la semana (0-6)
   * @param {boolean} short - Si usar abreviatura
   * @returns {string} - Nombre del día
   */
  getDayName: (dayOfWeek, short = false) => {
    const days = short
      ? ['D', 'L', 'M', 'M', 'J', 'V', 'S']
      : ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek] || '';
  },

  /**
   * Validar que los rangos horarios no se superpongan
   * @param {Array} timeRanges - Rangos horarios
   * @returns {boolean} - Si son válidos
   */
  validateTimeRanges: (timeRanges) => {
    if (!timeRanges || timeRanges.length <= 1) return true;

    const sorted = [...timeRanges].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].end_time > sorted[i + 1].start_time) {
        return false;
      }
    }

    return true;
  },
};

export default scheduleService;
