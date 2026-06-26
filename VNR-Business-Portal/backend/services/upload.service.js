import { supabaseAdmin } from "../config/supabase.js";
import crypto from "crypto";

const BUCKET_NAME = "driver-documents";

// Crear bucket si no existe (ejecutar una vez)
export const initializeBucket = async () => {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
      });
      if (error) throw error;
      console.log(`Bucket '${BUCKET_NAME}' creado exitosamente`);
    }
  } catch (error) {
    console.error("Error inicializando bucket:", error);
  }
};

// Subir archivo a Supabase Storage
export const uploadFile = async (file, driverId, documentType) => {
  try {
    // Generar nombre único
    const fileExt = file.originalname.split('.').pop();
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const fileName = `${driverId}/${documentType}_${uniqueId}.${fileExt}`;

    // Subir a Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw error;

    // Generar URL firmada (válida por 1 año)
    const { data: urlData } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 365 * 24 * 60 * 60); // 1 año en segundos

    return {
      path: data.path,
      url: urlData.signedUrl,
      fileName: file.originalname,
    };
  } catch (error) {
    console.error("Error subiendo archivo:", error);
    throw error;
  }
};

// Eliminar archivo
export const deleteFile = async (filePath) => {
  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error eliminando archivo:", error);
    throw error;
  }
};

// Obtener URL firmada para ver documento
export const getSignedUrl = async (filePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error("Error generando URL firmada:", error);
    throw error;
  }
};

export default {
  initializeBucket,
  uploadFile,
  deleteFile,
  getSignedUrl,
};
