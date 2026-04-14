import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyCrd40RDlafU4YtK0h2hG-ly0IW9C3F-hQ',
  authDomain: 'spots-42d51.firebaseapp.com',
  projectId: 'spots-42d51',
  storageBucket: 'spots-42d51.firebasestorage.app',
  messagingSenderId: '620626098092',
  appId: '1:620626098092:web:de45c09a7a4e5cbb9dec09',
  measurementId: 'G-RB1H0BPS5M',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');
