import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCm-y-CEZfrtv1hxiFsJza6641WK6JKgUs",
  authDomain: "medical-552fc.firebaseapp.com",
  projectId: "medical-552fc",
  storageBucket: "medical-552fc.appspot.com",
  messagingSenderId: "142229690493",
  appId: "1:142229690493:web:6f9983ae805ecd4b23b914",
  measurementId: "G-5NEPQ7NGGN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { auth, db, app, storage, functions }; // Export Firebase Authentication instance, Firestore instance, Storage instance, and Functions instance
