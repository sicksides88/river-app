import { supabaseAdmin } from "../config/supabase.js";

export const listVessels = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("vessels")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, vessels: data || [] });
  } catch (error) {
    console.error("listVessels:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVessel = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("vessels")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .single();

    if (error) throw error;
    res.json({ success: true, vessel: data });
  } catch (error) {
    res.status(404).json({ success: false, message: "Embarcación no encontrada" });
  }
};

export const createVessel = async (req, res) => {
  try {
    const allowed = [
      'name', 'registration', 'type', 'length_m', 'beam_m', 'engines',
      'base_location', 'link_type', 'insurance_company', 'policy_number',
      'color', 'draft_m', 'depth_m', 'geographic_area',
    ];
    const payload = { user_id: req.user.id };
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) payload[key] = req.body[key];
    });

    const { data, error } = await supabaseAdmin
      .from("vessels")
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST204') {
        return res.status(500).json({
          success: false,
          message:
            'Faltan columnas en la tabla vessels. Ejecutá river_service_vessels_patch.sql en Supabase.',
          error: error.message,
        });
      }
      throw error;
    }
    res.status(201).json({ success: true, vessel: data });
  } catch (error) {
    console.error("createVessel:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVessel = async (req, res) => {
  try {
    const allowed = [
      'name', 'registration', 'type', 'length_m', 'beam_m', 'engines',
      'base_location', 'link_type', 'insurance_company', 'policy_number',
      'color', 'draft_m', 'depth_m', 'geographic_area',
    ];
    const payload = { updated_at: new Date().toISOString() };
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) payload[key] = req.body[key];
    });

    const { data, error } = await supabaseAdmin
      .from("vessels")
      .update(payload)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, vessel: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVessel = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("vessels")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
