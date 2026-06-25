import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth, signInAnonymously } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore';

/**
 * Configuración de Firebase vía variables de entorno públicas de Expo.
 * Estas son placeholders: la app NO se conecta a un proyecto real hasta
 * que se definan en un archivo `.env` (ver README.md). Esto es intencional
 * para este scaffold.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

/** Inicializa Firebase de forma perezosa (solo si hay config válida). */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!app) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }

  return app;
}

export function getFirestoreDb(): Firestore | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!firestore) {
    firestore = getFirestore(firebaseApp);
  }
  return firestore;
}

export function getFirebaseAuth(): Auth | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!auth) {
    auth = getAuth(firebaseApp);
  }
  return auth;
}

/**
 * Inicia sesión anónima en Firebase Auth. Se usa como identidad mínima
 * para las reglas de seguridad de Firestore (ver firestore.rules) sin
 * requerir registro explícito del usuario.
 */
export async function signInAnonymouslyIfNeeded(): Promise<string | null> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return null;

  if (firebaseAuth.currentUser) {
    return firebaseAuth.currentUser.uid;
  }

  const credential = await signInAnonymously(firebaseAuth);
  return credential.user.uid;
}
