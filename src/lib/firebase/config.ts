import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCFDBrQec-IcoXWjFDX_tXAX_pD3dn4NNM",
  authDomain: "zyntract-hub.firebaseapp.com",
  projectId: "zyntract-hub",
  storageBucket: "zyntract-hub.firebasestorage.app",
  messagingSenderId: "802395531847",
  appId: "1:802395531847:web:0c0dd9e19eef34cbc01f62"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else if (typeof window !== 'undefined') {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // Handle server-side initialization if needed, though most Firebase client SDKs are client-side.
  // For Server Components or API routes, you'd use Firebase Admin SDK.
  // This client-side setup is primarily for browser interactions.
}

export { app, auth, db, storage };
