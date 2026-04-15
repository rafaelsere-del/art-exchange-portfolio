// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAp84DkNgq5E3wQECjm9Lbrv17cIsMSf9M",
  authDomain: "artxart-b2e22.firebaseapp.com",
  projectId: "artxart-b2e22",
  storageBucket: "artxart-b2e22.firebasestorage.app",
  messagingSenderId: "285450020311",
  appId: "1:285450020311:web:8771d13a26ed2d270f1792",
  measurementId: "G-TMB1QB1MWF"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);      // Base de Datos (Firestore)
export const auth = getAuth(app);         // Autenticación (Usuarios)
export const storage = getStorage(app);   // Almacenamiento de Imágenes
