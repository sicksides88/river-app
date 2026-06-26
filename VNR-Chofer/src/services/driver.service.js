import api from './api';
import { supabase } from './supabase';

const driverService = {
  // ============ REGISTRO ============

  // Registrar como conductor (multi-service)
  registerAsDriver: async (driverType, vehicleInfo = null, driverServices = null, cadeteria = null) => {
    const response = await api.post('/drivers/register', {
      driverType,
      vehicleInfo,
      driverServices: driverServices || [driverType],
      cadeteria,
    });
    return response.data;
  },

  // Obtener estado del conductor
  getDriverStatus: async () => {
    const response = await api.get('/drivers/status');
    return response.data;
  },

  // ============ DOCUMENTOS ============

  // Subir documento via API (el backend lo sube a Supabase Storage)
  // vehicleId es opcional - si se pasa, el documento se asocia al vehículo
  uploadDocumentFile: async (uri, driverId, documentType, vehicleId = null) => {
    try {
      // Convertir imagen a base64
      const response = await fetch(uri);
      const blob = await response.blob();

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Enviar al backend para que suba a Storage
      const uploadPayload = {
        documentType,
        fileData: base64,
        fileName: `${documentType}_${Date.now()}.jpg`,
      };

      // Agregar vehicleId si es documento de vehículo
      if (vehicleId) {
        uploadPayload.vehicleId = vehicleId;
      }

      const uploadResponse = await api.post('/drivers/documents/upload', uploadPayload);

      return uploadResponse.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Registrar documento en la BD (ya no se usa directamente, el upload lo hace todo)
  saveDocument: async (documentType, fileUrl, fileName, expiresAt = null) => {
    const response = await api.post('/drivers/documents', {
      documentType,
      fileUrl,
      fileName,
      expiresAt,
    });
    return response.data;
  },

  // Obtener documentos del conductor
  getDocuments: async () => {
    const response = await api.get('/drivers/documents');
    return response.data;
  },

  // ============ VEHÍCULOS ============

  // Agregar vehículo
  addVehicle: async (vehicleData) => {
    const response = await api.post('/drivers/vehicles', vehicleData);
    return response.data;
  },

  // Obtener vehículos
  getVehicles: async () => {
    const response = await api.get('/drivers/vehicles');
    return response.data;
  },

  // Actualizar embarcación / vehículo
  updateVehicle: async (vehicleId, vehicleData) => {
    const response = await api.put(`/drivers/vehicles/${vehicleId}`, vehicleData);
    return response.data;
  },

  // ============ DISPONIBILIDAD ============

  // Actualizar disponibilidad y ubicación
  updateAvailability: async (isAvailable, latitude, longitude, vehicleId = null, activeServiceType = null) => {
    const response = await api.post('/drivers/availability', {
      isAvailable,
      latitude,
      longitude,
      vehicleId,
      activeServiceType,
    });
    return response.data;
  },

  // ============ PUNTOS DE CONFIANZA ============

  // Obtener puntos y nivel
  getTrustPoints: async () => {
    const response = await api.get('/drivers/trust-points');
    return response.data;
  },

  // ============ VIAJE ACTIVO ============

  // Obtener viaje o envío activo del conductor
  getActiveTrip: async () => {
    const response = await api.get('/drivers/active-trip');
    return response.data;
  },

  // ============ DESARROLLO ============

  // Auto-activar conductor (solo desarrollo)
  devActivate: async () => {
    const response = await api.post('/drivers/dev/activate');
    return response.data;
  },
};

export default driverService;
