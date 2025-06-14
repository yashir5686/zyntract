
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCFDBrQec-IcoXWjFDX_tXAX_pD3dn4NNM",
  authDomain: "zyntract-hub.firebaseapp.com",
  projectId: "zyntract-hub",
  storageBucket: "zyntract-hub.firebasestorage.app",
  messagingSenderId: "802395531847",
  appId: "1:802395531847:web:0c0dd9e19eef34cbc01f62"
};

let app: FirebaseApp;

// Initialize Firebase App
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Get Firebase services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
