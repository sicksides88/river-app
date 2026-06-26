import { supabaseAdmin } from "../config/supabase.js";

// @desc    Obtener ubicaciones recientes del usuario
// @route   GET /api/locations/recent
// @access  Private
export const getRecentLocations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const { data: locations, error } = await supabaseAdmin
      .from('saved_locations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('last_used', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      count: locations.length,
      locations: locations.map(formatLocation),
    });
  } catch (error) {
    console.error("Error al obtener ubicaciones:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener ubicaciones",
      error: error.message,
    });
  }
};

// @desc    Obtener ubicaciones más usadas del usuario
// @route   GET /api/locations/frequent
// @access  Private
export const getFrequentLocations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const { data: locations, error } = await supabaseAdmin
      .from('saved_locations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('usage_count', { ascending: false })
      .order('last_used', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      count: locations.length,
      locations: locations.map(formatLocation),
    });
  } catch (error) {
    console.error("Error al obtener ubicaciones frecuentes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener ubicaciones frecuentes",
      error: error.message,
    });
  }
};

// @desc    Guardar o actualizar una ubicación
// @route   POST /api/locations
// @access  Private
export const saveLocation = async (req, res) => {
  try {
    const { address, formatted_address, coordinates, type, label } = req.body;

    // Verificar si la ubicación ya existe para este usuario
    const { data: existingLocation } = await supabaseAdmin
      .from('saved_locations')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('address', address)
      .single();

    if (existingLocation) {
      // Si existe, actualizar el uso
      const { data: location, error } = await supabaseAdmin
        .from('saved_locations')
        .update({
          usage_count: existingLocation.usage_count + 1,
          last_used: new Date().toISOString(),
        })
        .eq('id', existingLocation.id)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: "Ubicación actualizada",
        location: formatLocation(location),
      });
    }

    // Si no existe, crear nueva
    const { data: location, error } = await supabaseAdmin
      .from('saved_locations')
      .insert({
        user_id: req.user.id,
        address,
        formatted_address: formatted_address || address,
        lat: coordinates.lat,
        lng: coordinates.lng,
        location_type: type || "both",
        label: label || "other",
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Ubicación guardada",
      location: formatLocation(location),
    });
  } catch (error) {
    console.error("Error al guardar ubicación:", error);
    res.status(500).json({
      success: false,
      message: "Error al guardar ubicación",
      error: error.message,
    });
  }
};

// @desc    Actualizar etiqueta de una ubicación
// @route   PUT /api/locations/:id
// @access  Private
export const updateLocation = async (req, res) => {
  try {
    const { data: existingLocation, error: fetchError } = await supabaseAdmin
      .from('saved_locations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingLocation) {
      return res.status(404).json({
        success: false,
        message: "Ubicación no encontrada",
      });
    }

    const updateData = {};
    if (req.body.label) updateData.label = req.body.label;
    if (req.body.type) updateData.location_type = req.body.type;

    const { data: location, error } = await supabaseAdmin
      .from('saved_locations')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Ubicación actualizada",
      location: formatLocation(location),
    });
  } catch (error) {
    console.error("Error al actualizar ubicación:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar ubicación",
      error: error.message,
    });
  }
};

// @desc    Eliminar una ubicación
// @route   DELETE /api/locations/:id
// @access  Private
export const deleteLocation = async (req, res) => {
  try {
    const { data: existingLocation, error: fetchError } = await supabaseAdmin
      .from('saved_locations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingLocation) {
      return res.status(404).json({
        success: false,
        message: "Ubicación no encontrada",
      });
    }

    const { error } = await supabaseAdmin
      .from('saved_locations')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Ubicación eliminada",
    });
  } catch (error) {
    console.error("Error al eliminar ubicación:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar ubicación",
      error: error.message,
    });
  }
};

// Helper para formatear respuesta de location
function formatLocation(location) {
  return {
    id: location.id,
    user: location.user_id,
    address: location.address,
    formatted_address: location.formatted_address,
    coordinates: {
      lat: location.lat,
      lng: location.lng,
    },
    type: location.location_type,
    label: location.label,
    lastUsed: location.last_used,
    usageCount: location.usage_count,
    createdAt: location.created_at,
    updatedAt: location.updated_at,
  };
}
