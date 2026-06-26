import { supabaseAdmin } from "../config/supabase.js";
import rideQueueService from "../services/rideQueue.service.js";
import { emitToUser, emitToAvailableDrivers } from "../config/socket.js";
import {
  createRide,
  getRideById,
  getUserRides,
  cancelRide,
  acceptRide,
  rejectRide,
  updateRideStatus,
} from "./ride.controller.js";

const mapRideToAuxilio = (ride) => {
  if (!ride) return null;
  let meta = {};
  try {
    meta = ride.notes ? JSON.parse(ride.notes) : {};
  } catch {
    meta = {};
  }
  return {
    id: ride.id,
    status: ride.status,
    driver_id: ride.driver_id,
    pickup: {
      address: ride.pickup_address,
      coordinates: { lat: ride.pickup_lat, lng: ride.pickup_lng },
    },
    ...meta,
    created_at: ride.created_at,
  };
};

export const createAuxilio = async (req, res) => {
  req.body.serviceType = "auxilio";
  if (!req.body.dropoff && req.body.pickup) {
    req.body.dropoff = req.body.pickup;
  }
  return createRide(req, res);
};

export const listAuxilios = async (req, res) => {
  try {
    const role = req.query.role || "user";

    let query = supabaseAdmin
      .from("rides")
      .select(`
        *,
        user:user_id (id, nombre, apellido, telefono_numero, email),
        driver:driver_id (id, nombre, apellido, telefono_numero, avatar)
      `)
      .eq("service_type", "auxilio")
      .order("created_at", { ascending: false });

    if (role === "driver") {
      query = query.eq("driver_id", req.user.id);
    } else {
      query = query.eq("user_id", req.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      auxilios: (data || []).map(mapRideToAuxilio),
      role,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuxilio = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("rides")
      .select(`
        *,
        user:user_id (id, nombre, apellido, telefono_numero, email),
        driver:driver_id (id, nombre, apellido, telefono_numero, avatar)
      `)
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    const auxilio = mapRideToAuxilio(data);
    if (data.user) {
      auxilio.solicitante = {
        id: data.user.id,
        nombre: data.user.nombre,
        apellido: data.user.apellido,
        telefono_numero: data.user.telefono_numero,
        email: data.user.email,
      };
    }
    res.json({ success: true, auxilio, ride: data });
  } catch (error) {
    res.status(404).json({ success: false, message: "Auxilio no encontrado" });
  }
};

export const cancelAuxilio = (req, res) => cancelRide(req, res);
export const acceptAuxilio = (req, res) => acceptRide(req, res);
export const rejectAuxilio = (req, res) => rejectRide(req, res);

export const updateAuxilioStatus = async (req, res) => {
  const {
    etaMinutes,
    photos,
    signature,
    status,
    departureBase,
    serviceReason,
    returnCompleted,
    reference,
    closureNotes,
  } = req.body;

  if (
    etaMinutes ||
    photos ||
    signature ||
    departureBase ||
    serviceReason ||
    returnCompleted !== undefined ||
    reference ||
    closureNotes
  ) {
    try {
      const { data: ride } = await supabaseAdmin
        .from("rides")
        .select("notes")
        .eq("id", req.params.id)
        .single();

      let meta = {};
      try {
        meta = ride?.notes ? JSON.parse(ride.notes) : {};
      } catch {
        meta = {};
      }
      if (etaMinutes) meta.etaMinutes = etaMinutes;
      if (photos) meta.photos = { ...meta.photos, ...photos };
      if (signature) meta.signature = signature;
      if (departureBase) meta.departureBase = departureBase;
      if (serviceReason) meta.serviceReason = serviceReason;
      if (returnCompleted !== undefined) meta.returnCompleted = returnCompleted;
      if (reference) meta.reference = reference;
      if (closureNotes) meta.closureNotes = closureNotes;

      await supabaseAdmin
        .from("rides")
        .update({ notes: JSON.stringify(meta) })
        .eq("id", req.params.id);
    } catch (e) {
      console.error("updateAuxilioStatus meta:", e);
    }
  }

  if (status) {
    req.body.status = status;
    return updateRideStatus(req, res);
  }

  return res.json({ success: true, message: "Metadata actualizada" });
};

export const reportAuxilio = async (req, res) => {
  try {
    const { reason } = req.body;
    const { data: ride } = await supabaseAdmin
      .from("rides")
      .select("notes")
      .eq("id", req.params.id)
      .single();

    let meta = {};
    try {
      meta = ride?.notes ? JSON.parse(ride.notes) : {};
    } catch {
      meta = {};
    }
    meta.report = { reason, at: new Date().toISOString() };

    await supabaseAdmin
      .from("rides")
      .update({ notes: JSON.stringify(meta) })
      .eq("id", req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadAuxilioPhoto = async (req, res) => {
  try {
    const { phase, photoUri } = req.body;
    const { data: ride } = await supabaseAdmin
      .from("rides")
      .select("notes")
      .eq("id", req.params.id)
      .single();

    let meta = {};
    try {
      meta = ride?.notes ? JSON.parse(ride.notes) : {};
    } catch {
      meta = {};
    }
    meta.photos = { ...(meta.photos || {}), [phase]: photoUri };

    await supabaseAdmin
      .from("rides")
      .update({ notes: JSON.stringify(meta) })
      .eq("id", req.params.id);

    res.json({ success: true, photos: meta.photos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveAuxilioSignature = async (req, res) => {
  try {
    const { signatureData } = req.body;
    const { data: ride } = await supabaseAdmin
      .from("rides")
      .select("notes")
      .eq("id", req.params.id)
      .single();

    let meta = {};
    try {
      meta = ride?.notes ? JSON.parse(ride.notes) : {};
    } catch {
      meta = {};
    }
    meta.signature = signatureData;

    await supabaseAdmin
      .from("rides")
      .update({ notes: JSON.stringify(meta) })
      .eq("id", req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
