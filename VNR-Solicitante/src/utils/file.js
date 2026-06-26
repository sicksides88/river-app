import * as FileSystem from 'expo-file-system';

/** Lee un archivo local (foto/PDF) como base64 para subir al backend */
export async function readFileAsBase64(uri, mimeType = 'image/jpeg') {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64',
  });
  return `data:${mimeType};base64,${base64}`;
}

export async function policyFileToBase64(file) {
  if (!file?.uri) return null;
  const mime = file.type === 'pdf' ? 'application/pdf' : 'image/jpeg';
  return readFileAsBase64(file.uri, mime);
}
