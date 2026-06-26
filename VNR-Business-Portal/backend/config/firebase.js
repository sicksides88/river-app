import admin from 'firebase-admin';

// Inicializar Firebase Admin SDK
// Las credenciales se obtienen de las variables de entorno
const initializeFirebase = () => {
  if (admin.apps.length === 0) {
    // Si hay un archivo de credenciales JSON
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    // Si las credenciales estan en variables individuales
    else if (process.env.FCM_PROJECT_ID && process.env.FCM_CLIENT_EMAIL && process.env.FCM_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FCM_PROJECT_ID,
          clientEmail: process.env.FCM_CLIENT_EMAIL,
          // Las private keys vienen con \n escapados, hay que convertirlos
          privateKey: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    // Modo desarrollo sin Firebase configurado
    else {
      console.warn('Firebase no configurado. Las notificaciones push no funcionaran.');
      return null;
    }
  }
  return admin;
};

// Inicializar y exportar
const firebaseAdmin = initializeFirebase();

export default firebaseAdmin;
