import { supabaseAdmin } from "../config/supabase.js";
import { notifyDriverOfPendingDeliveries } from "./delivery.controller.js";

// @desc    Registrar usuario como conductor
// @route   POST /api/drivers/register
// @access  Private
export const registerAsDriver = async (req, res) => {
  try {
    const userId = req.user.id;
    const { driverType, vehicleInfo, driverServices, cadeteria } = req.body;

    // Verificar que no sea ya conductor
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('is_driver, driver_status')
      .eq('id', userId)
      .single();

    if (existingProfile?.is_driver) {
      return res.status(400).json({
        success: false,
        message: "Ya estás registrado como conductor",
      });
    }

    // Calcular servicios driver (array con múltiples servicios)
    const services = driverServices && driverServices.length > 0
      ? driverServices
      : [driverType];

    // Actualizar perfil como conductor
    const updateData = {
      is_driver: true,
      driver_status: 'pending_documents',
      driver_type: driverType, // backward compat: primer servicio
      driver_services: services,
    };

    if (cadeteria) {
      updateData.cadeteria = cadeteria;
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (profileError) throw profileError;

    // Si proporciona info de vehículo, crearlo
    if (vehicleInfo) {
      const { error: vehicleError } = await supabaseAdmin
        .from('driver_vehicles')
        .insert({
          driver_id: userId,
          ...vehicleInfo,
        });

      if (vehicleError) throw vehicleError;
    }

    res.status(201).json({
      success: true,
      message: "Registro como conductor iniciado. Sube tus documentos para continuar.",
      nextStep: 'upload_documents',
    });
  } catch (error) {
    console.error("Error registrando conductor:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Obtener estado del conductor
// @route   GET /api/drivers/status
// @access  Private
export const getDriverStatus = async (req, res) => {
  console.log('📋 getDriverStatus called for user:', req.user?.id);
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        is_driver,
        driver_status,
        driver_type,
        trust_points,
        trust_level,
        driver_verified_at
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!profile.is_driver) {
      return res.json({
        success: true,
        isDriver: false,
        message: "No estás registrado como conductor",
      });
    }

    // Obtener documentos
    const { data: documents } = await supabaseAdmin
      .from('driver_documents')
      .select('document_type, status, rejection_reason, expires_at')
      .eq('driver_id', userId);

    // Auto-corregir: si status es pending_documents pero todos los docs están aprobados, activar
    let currentStatus = profile.driver_status;
    if (currentStatus === 'pending_documents') {
      await checkAndActivateDriver(userId);
      // Re-leer el status por si cambió
      const { data: updatedProfile } = await supabaseAdmin
        .from('profiles')
        .select('driver_status, driver_verified_at')
        .eq('id', userId)
        .single();
      if (updatedProfile) {
        currentStatus = updatedProfile.driver_status;
        profile.driver_verified_at = updatedProfile.driver_verified_at;
      }
    }

    // Obtener vehículos
    const { data: vehicles } = await supabaseAdmin
      .from('driver_vehicles')
      .select('*')
      .eq('driver_id', userId)
      .eq('is_active', true);

    res.json({
      success: true,
      isDriver: true,
      status: currentStatus,
      driverType: profile.driver_type,
      trustPoints: profile.trust_points,
      trustLevel: profile.trust_level,
      verifiedAt: profile.driver_verified_at,
      documents: documents || [],
      vehicles: vehicles || [],
    });
  } catch (error) {
    console.error("Error obteniendo estado:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Subir archivo de documento a Storage
// @route   POST /api/drivers/documents/upload
// @access  Private (Driver)
export const uploadDocumentFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType, fileData, fileName, vehicleId } = req.body;

    if (!documentType || !fileData) {
      return res.status(400).json({
        success: false,
        message: "documentType y fileData son requeridos",
      });
    }

    // Verificar que sea conductor
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_driver')
      .eq('id', userId)
      .single();

    if (!profile?.is_driver) {
      return res.status(403).json({
        success: false,
        message: "Debes registrarte como conductor primero",
      });
    }

    // Si es documento de vehículo, verificar que el vehículo pertenezca al usuario
    if (vehicleId) {
      const { data: vehicle } = await supabaseAdmin
        .from('driver_vehicles')
        .select('id')
        .eq('id', vehicleId)
        .eq('driver_id', userId)
        .single();

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehículo no encontrado",
        });
      }
    }

    // Detectar content type desde el prefijo base64
    let contentType = 'image/jpeg';
    let fileExtension = '.jpg';

    if (fileData.startsWith('data:application/pdf')) {
      contentType = 'application/pdf';
      fileExtension = '.pdf';
    } else if (fileData.startsWith('data:image/png')) {
      contentType = 'image/png';
      fileExtension = '.png';
    } else if (fileData.startsWith('data:image/jpeg') || fileData.startsWith('data:image/jpg')) {
      contentType = 'image/jpeg';
      fileExtension = '.jpg';
    }

    // Decodificar base64
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generar nombre único
    const folderPath = vehicleId ? `${userId}/vehicles/${vehicleId}` : userId;
    const uniqueFileName = `${folderPath}/${documentType}_${Date.now()}${fileExtension}`;

    // Subir a Supabase Storage usando service role (tiene acceso completo)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('driver-documents')
      .upload(uniqueFileName, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      return res.status(500).json({
        success: false,
        message: "Error al subir archivo",
        error: uploadError.message,
      });
    }

    // Generar URL firmada (válida por 1 año)
    const { data: urlData } = await supabaseAdmin.storage
      .from('driver-documents')
      .createSignedUrl(uniqueFileName, 365 * 24 * 60 * 60);

    let document;
    let dbError;

    // Si es documento de vehículo, actualizar el existente; sino crear nuevo
    if (vehicleId) {
      // Buscar documento existente del vehículo
      const { data: existingDoc } = await supabaseAdmin
        .from('driver_documents')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .eq('document_type', documentType)
        .single();

      if (existingDoc) {
        // Actualizar documento existente
        const result = await supabaseAdmin
          .from('driver_documents')
          .update({
            file_url: urlData.signedUrl,
            file_name: fileName,
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingDoc.id)
          .select()
          .single();

        document = result.data;
        dbError = result.error;
      } else {
        // Crear nuevo documento de vehículo
        const result = await supabaseAdmin
          .from('driver_documents')
          .insert({
            driver_id: userId,
            vehicle_id: vehicleId,
            document_type: documentType,
            file_url: urlData.signedUrl,
            file_name: fileName,
            status: 'pending',
          })
          .select()
          .single();

        document = result.data;
        dbError = result.error;
      }
    } else {
      // Documento personal - crear nuevo
      const result = await supabaseAdmin
        .from('driver_documents')
        .insert({
          driver_id: userId,
          document_type: documentType,
          file_url: urlData.signedUrl,
          file_name: fileName,
          status: 'pending',
        })
        .select()
        .single();

      document = result.data;
      dbError = result.error;
    }

    if (dbError) {
      console.error('Error saving document to DB:', dbError);
      return res.status(500).json({
        success: false,
        message: "Error al guardar documento",
        error: dbError.message,
      });
    }

    // Si es selfie_verification, usar la misma foto como avatar del perfil
    if (documentType === 'selfie_verification') {
      const { error: avatarError } = await supabaseAdmin
        .from('profiles')
        .update({ avatar: urlData.signedUrl })
        .eq('id', userId);

      if (avatarError) {
        console.error('Error actualizando avatar del perfil:', avatarError);
        // No fallar la operación, el documento ya se subió
      } else {
        console.log(`📸 Avatar actualizado para conductor ${userId}`);
      }
    }

    res.status(201).json({
      success: true,
      message: "Documento subido exitosamente. Será revisado en las próximas 24-48 horas.",
      path: uploadData.path,
      url: urlData.signedUrl,
      fileName: uniqueFileName,
      document,
    });
  } catch (error) {
    console.error("Error en upload:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Subir documento
// @route   POST /api/drivers/documents
// @access  Private (Driver)
export const uploadDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType, fileUrl, fileName, expiresAt } = req.body;

    // Verificar que sea conductor
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_driver')
      .eq('id', userId)
      .single();

    if (!profile?.is_driver) {
      return res.status(403).json({
        success: false,
        message: "Debes registrarte como conductor primero",
      });
    }

    // Verificar si ya existe un documento pendiente o aprobado de ese tipo
    const { data: existingDoc } = await supabaseAdmin
      .from('driver_documents')
      .select('id, status')
      .eq('driver_id', userId)
      .eq('document_type', documentType)
      .in('status', ['pending', 'approved'])
      .single();

    if (existingDoc) {
      return res.status(400).json({
        success: false,
        message: existingDoc.status === 'approved'
          ? "Este documento ya está aprobado"
          : "Ya tienes un documento pendiente de revisión",
      });
    }

    // Crear documento
    const { data: document, error } = await supabaseAdmin
      .from('driver_documents')
      .insert({
        driver_id: userId,
        document_type: documentType,
        file_url: fileUrl,
        file_name: fileName,
        expires_at: expiresAt,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Documento subido. Será revisado en las próximas 24-48 horas.",
      document,
    });
  } catch (error) {
    console.error("Error subiendo documento:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Obtener documentos del conductor
// @route   GET /api/drivers/documents
// @access  Private (Driver)
export const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    // Tipos de documentos personales (excluye documentos de vehículos)
    // Nota: seguro_vehiculo se asocia al vehículo, no al conductor
    const personalDocTypes = [
      'license_front',
      'license_back',
      'selfie_verification',
      'buena_conducta',
      'seguro_accidentes',
    ];

    // Solo obtener documentos personales por tipo específico
    const { data: allDocuments, error } = await supabaseAdmin
      .from('driver_documents')
      .select('*')
      .eq('driver_id', userId)
      .in('document_type', personalDocTypes)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Documentos requeridos para activación (solo personales del cadete)
    const requiredDocs = [
      'license_front',
      'license_back',
      'selfie_verification',
      'buena_conducta',
      'seguro_accidentes',
    ];

    // Para cada tipo de documento, quedarse con el más relevante
    // Prioridad: approved > pending > rejected
    const statusPriority = { 'approved': 3, 'pending': 2, 'rejected': 1 };
    const documentsByType = {};

    (allDocuments || []).forEach(doc => {
      const existingDoc = documentsByType[doc.document_type];
      if (!existingDoc) {
        documentsByType[doc.document_type] = doc;
      } else {
        // Comparar prioridad de estado
        const existingPriority = statusPriority[existingDoc.status] || 0;
        const newPriority = statusPriority[doc.status] || 0;
        if (newPriority > existingPriority) {
          documentsByType[doc.document_type] = doc;
        }
      }
    });

    const documents = Object.values(documentsByType);

    // DEBUG: Ver qué documentos se están devolviendo
    console.log('📄 Documentos personales encontrados:', documents.map(d => ({
      type: d.document_type,
      status: d.status,
      id: d.id
    })));

    // Calcular progreso basado en documentos personales aprobados
    const approvedDocs = documents.filter(d =>
      d.status === 'approved' && requiredDocs.includes(d.document_type)
    );
    const progress = (approvedDocs.length / requiredDocs.length) * 100;

    res.json({
      success: true,
      documents: documents || [],
      requiredDocuments: requiredDocs,
      progress: Math.round(progress),
      isComplete: progress >= 100,
    });
  } catch (error) {
    console.error("Error obteniendo documentos:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Agregar vehículo
// @route   POST /api/drivers/vehicles
// @access  Private (Driver)
export const addVehicle = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      vehicleType,
      brand,
      model,
      year,
      color,
      plateNumber,
      capacity,
      specs,
    } = req.body;

    const insertRow = {
      driver_id: userId,
      vehicle_type: vehicleType || 'boat',
      brand: brand || 'River',
      model: model || 'Patrulla',
      year: year || new Date().getFullYear(),
      color,
      plate_number: plateNumber,
      capacity: capacity ?? 6,
      is_verified: false,
      is_active: true,
    };
    if (specs && typeof specs === 'object') {
      insertRow.specs = specs;
    }

    const { data: vehicle, error } = await supabaseAdmin
      .from('driver_vehicles')
      .insert(insertRow)
      .select()
      .single();

    if (error) throw error;

    // No crear documentos placeholder - solo se crean cuando el conductor los sube
    res.status(201).json({
      success: true,
      message: "Vehículo agregado exitosamente.",
      vehicle,
    });
  } catch (error) {
    console.error("Error agregando vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Obtener vehículos del conductor
// @route   GET /api/drivers/vehicles
// @access  Private (Driver)
export const getVehicles = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener vehículos
    const { data: vehicles, error } = await supabaseAdmin
      .from('driver_vehicles')
      .select('*')
      .eq('driver_id', userId)
      .order('is_active', { ascending: false });

    if (error) throw error;

    // Obtener documentos de cada vehículo
    const vehiclesWithDocs = await Promise.all(
      (vehicles || []).map(async (vehicle) => {
        const { data: docs } = await supabaseAdmin
          .from('driver_documents')
          .select('id, document_type, status, file_url, rejection_reason, created_at')
          .eq('vehicle_id', vehicle.id);

        const registrationFront = docs?.find(d => d.document_type === 'vehicle_registration_front');
        const registrationBack = docs?.find(d => d.document_type === 'vehicle_registration_back');
        const insurance = docs?.find(d => d.document_type === 'vehicle_insurance');

        const allApproved =
          registrationFront?.status === 'approved' &&
          registrationBack?.status === 'approved' &&
          insurance?.status === 'approved';

        return {
          ...vehicle,
          documents: {
            registration_front: registrationFront || null,
            registration_back: registrationBack || null,
            insurance: insurance || null,
          },
          documents_status: {
            registration_front_status: registrationFront?.status || 'missing',
            registration_back_status: registrationBack?.status || 'missing',
            insurance_status: insurance?.status || 'missing',
            all_approved: allApproved,
          },
        };
      })
    );

    res.json({
      success: true,
      vehicles: vehiclesWithDocs,
    });
  } catch (error) {
    console.error("Error obteniendo vehículos:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Actualizar vehículo / embarcación del conductor
// @route   PUT /api/drivers/vehicles/:id
// @access  Private (Driver)
export const updateVehicle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      vehicleType,
      brand,
      model,
      year,
      color,
      plateNumber,
      capacity,
      specs,
    } = req.body;

    const { data: existing, error: findError } = await supabaseAdmin
      .from('driver_vehicles')
      .select('id')
      .eq('id', id)
      .eq('driver_id', userId)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado',
      });
    }

    const updateRow = { updated_at: new Date().toISOString() };
    if (vehicleType != null) updateRow.vehicle_type = vehicleType;
    if (brand != null) updateRow.brand = brand;
    if (model != null) updateRow.model = model;
    if (year != null) updateRow.year = year;
    if (color !== undefined) updateRow.color = color;
    if (plateNumber != null) updateRow.plate_number = plateNumber;
    if (capacity != null) updateRow.capacity = capacity;
    if (specs && typeof specs === 'object') updateRow.specs = specs;

    const { data: vehicle, error } = await supabaseAdmin
      .from('driver_vehicles')
      .update(updateRow)
      .eq('id', id)
      .eq('driver_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Vehículo actualizado exitosamente.',
      vehicle,
    });
  } catch (error) {
    console.error('Error actualizando vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message,
    });
  }
};

// @desc    Actualizar disponibilidad
// @route   POST /api/drivers/availability
// @access  Private (Driver)
export const updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isAvailable, latitude, longitude, vehicleId, activeServiceType } = req.body;

    // Solo verificar estado del conductor si está intentando conectarse
    if (isAvailable) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('driver_status, is_driver')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error obteniendo perfil:', profileError);
        return res.status(500).json({
          success: false,
          message: "Error verificando perfil",
          error: profileError.message,
        });
      }

      // Verificar que tenga documentos aprobados (no depende del rol user/driver)
      if (profile?.driver_status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: "Tu cuenta de conductor está suspendida",
        });
      }

      if (profile?.driver_status !== 'active') {
        return res.status(403).json({
          success: false,
          message: "Tus documentos aún no fueron aprobados",
        });
      }

      // Verificar que el vehículo tenga los documentos aprobados
      if (vehicleId) {
        const { data: vehicle } = await supabaseAdmin
          .from('driver_vehicles')
          .select('id, is_verified, brand, model')
          .eq('id', vehicleId)
          .eq('driver_id', userId)
          .single();

        if (!vehicle) {
          return res.status(404).json({
            success: false,
            message: "Vehículo no encontrado",
          });
        }

        // Verificar documentos del vehículo
        const { data: docs } = await supabaseAdmin
          .from('driver_documents')
          .select('document_type, status')
          .eq('vehicle_id', vehicleId);

        const registrationFront = docs?.find(d => d.document_type === 'vehicle_registration_front');
        const registrationBack = docs?.find(d => d.document_type === 'vehicle_registration_back');
        const insurance = docs?.find(d => d.document_type === 'vehicle_insurance');

        const registrationFrontApproved = registrationFront?.status === 'approved';
        const registrationBackApproved = registrationBack?.status === 'approved';
        const insuranceApproved = insurance?.status === 'approved';

        if (!registrationFrontApproved || !registrationBackApproved || !insuranceApproved) {
          const pendingDocs = [];
          if (!registrationFrontApproved) pendingDocs.push('Cédula del vehículo (Frente)');
          if (!registrationBackApproved) pendingDocs.push('Cédula del vehículo (Dorso)');
          if (!insuranceApproved) pendingDocs.push('Seguro del vehículo');

          return res.status(403).json({
            success: false,
            message: `No puedes usar este vehículo. Documentos pendientes de aprobación: ${pendingDocs.join(', ')}`,
            pendingDocuments: pendingDocs,
            vehicleId,
          });
        }
      }
    }

    // Upsert disponibilidad
    const { data, error } = await supabaseAdmin
      .from('driver_availability')
      .upsert({
        driver_id: userId,
        is_available: isAvailable,
        current_latitude: latitude,
        current_longitude: longitude,
        current_vehicle_id: vehicleId || null,
        active_service_type: isAvailable ? (activeServiceType || null) : null,
        last_location_update: new Date().toISOString(),
      }, {
        onConflict: 'driver_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error en upsert driver_availability:', error);
      throw error;
    }

    // Fallback de matching: al conectarse, re-ofrecer envíos pendientes cercanos
    if (isAvailable && data?.active_service_type) {
      notifyDriverOfPendingDeliveries(userId, data.active_service_type, latitude, longitude)
        .catch(e => console.error('rebroadcast pendientes:', e));
    }

    res.json({
      success: true,
      message: isAvailable ? "Ahora estás disponible" : "Ya no estás disponible",
      availability: data,
    });
  } catch (error) {
    console.error("Error actualizando disponibilidad:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Obtener puntos de confianza
// @route   GET /api/drivers/trust-points
// @access  Private (Driver)
export const getTrustPoints = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener puntos actuales
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('trust_points, trust_level')
      .eq('id', userId)
      .single();

    // Obtener historial de puntos
    const { data: history } = await supabaseAdmin
      .from('trust_points_log')
      .select('*')
      .eq('driver_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Obtener configuración de niveles
    const { data: levels } = await supabaseAdmin
      .from('trust_points_config')
      .select('*')
      .order('min_points', { ascending: true });

    res.json({
      success: true,
      currentPoints: profile?.trust_points || 0,
      currentLevel: profile?.trust_level || 'bronce',
      history: history || [],
      levels: levels || [],
    });
  } catch (error) {
    console.error("Error obteniendo puntos:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// ============ ADMIN ENDPOINTS ============

// @desc    Aprobar/Rechazar documento
// @route   PUT /api/drivers/admin/documents/:documentId
// @access  Private (Admin)
export const reviewDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido. Debe ser 'approved' o 'rejected'",
      });
    }

    const updateData = {
      status,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    };

    if (status === 'rejected') {
      updateData.rejection_reason = rejectionReason;
    }

    const { data: document, error } = await supabaseAdmin
      .from('driver_documents')
      .update(updateData)
      .eq('id', documentId)
      .select('*, driver_id')
      .single();

    if (error) throw error;

    // Si se aprobó la selfie, usarla como foto de perfil del driver
    if (status === 'approved' && document.document_type === 'selfie_verification') {
      const { error: avatarError } = await supabaseAdmin
        .from('profiles')
        .update({ avatar: document.file_url })
        .eq('id', document.driver_id);

      if (avatarError) {
        console.error('Error actualizando avatar del driver:', avatarError);
      } else {
        console.log(`📸 Avatar actualizado para conductor ${document.driver_id} (documento aprobado)`);
      }
    }

    // Si se aprobó, verificar si todos los docs están completos
    if (status === 'approved') {
      await checkAndActivateDriver(document.driver_id);
    }

    res.json({
      success: true,
      message: `Documento ${status === 'approved' ? 'aprobado' : 'rechazado'}`,
      document,
    });
  } catch (error) {
    console.error("Error revisando documento:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Obtener conductores pendientes
// @route   GET /api/drivers/admin/pending
// @access  Private (Admin)
export const getPendingDrivers = async (req, res) => {
  try {
    const { data: drivers, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        nombre,
        apellido,
        email,
        driver_type,
        driver_status,
        created_at
      `)
      .eq('is_driver', true)
      .eq('driver_status', 'pending_documents')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Para cada conductor, obtener sus documentos
    const driversWithDocs = await Promise.all(
      (drivers || []).map(async (driver) => {
        const { data: docs } = await supabaseAdmin
          .from('driver_documents')
          .select('document_type, status')
          .eq('driver_id', driver.id);

        return {
          ...driver,
          documents: docs || [],
        };
      })
    );

    res.json({
      success: true,
      drivers: driversWithDocs,
      total: driversWithDocs.length,
    });
  } catch (error) {
    console.error("Error obteniendo conductores pendientes:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Suspender/Activar conductor
// @route   PUT /api/drivers/admin/:driverId/status
// @access  Private (Admin)
export const updateDriverStatus = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['active', 'suspended', 'pending_documents', 'pending_review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido",
      });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        driver_status: status,
        driver_verified_at: status === 'active' ? new Date().toISOString() : null,
      })
      .eq('id', driverId)
      .select()
      .single();

    if (error) throw error;

    // Si se suspende, registrar en puntos de confianza
    if (status === 'suspended') {
      await supabaseAdmin
        .from('trust_points_log')
        .insert({
          driver_id: driverId,
          points: 0,
          reason: `Cuenta suspendida: ${reason || 'Sin razón especificada'}`,
          action_type: 'suspension',
        });
    }

    res.json({
      success: true,
      message: `Estado del conductor actualizado a: ${status}`,
      driver: data,
    });
  } catch (error) {
    console.error("Error actualizando estado:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// Helper: Verificar y activar conductor si todos los docs están aprobados
async function checkAndActivateDriver(driverId) {
  // Documentos requeridos para activación del conductor
  // Solo documentos PERSONALES del cadete. El seguro/cédula del vehículo
  // se valida aparte al dar de alta un vehículo (no bloquea la activación).
  const requiredDocs = [
    'license_front',
    'license_back',
    'selfie_verification',
    'buena_conducta',
    'seguro_accidentes',
  ];

  const { data: approvedDocs } = await supabaseAdmin
    .from('driver_documents')
    .select('document_type')
    .eq('driver_id', driverId)
    .eq('status', 'approved');

  const approvedTypes = (approvedDocs || []).map(d => d.document_type);
  const allApproved = requiredDocs.every(doc => approvedTypes.includes(doc));

  if (allApproved) {
    await supabaseAdmin
      .from('profiles')
      .update({
        driver_status: 'active',
        driver_verified_at: new Date().toISOString(),
      })
      .eq('id', driverId);

    // Dar puntos iniciales
    await supabaseAdmin
      .from('trust_points_log')
      .insert({
        driver_id: driverId,
        points: 100,
        reason: 'Bono de bienvenida - Verificación completada',
        action_type: 'verification_complete',
      });
  }
}
