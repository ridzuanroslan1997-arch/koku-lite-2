import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- KONFIGURASI FIREBASE ---
// Konfigurasi ini adalah unik untuk projek "KokuLite" anda.
const firebaseConfig = {
  apiKey: "AIzaSyDSF1A6-vLdhRiiWdNttr_8uG2QjKmXZ0o",
  authDomain: "kokulite.firebaseapp.com",
  projectId: "kokulite",
  storageBucket: "kokulite.firebasestorage.app",
  messagingSenderId: "470574137168",
  appId: "1:470574137168:web:d80b0eca006dfc2b5af655",
  measurementId: "G-6HW9D2QWNQ"
};

// Initialize Firebase
let app;
let db: any;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase berjaya disambungkan.");
} catch (error) {
    console.error("Ralat Sambungan Firebase:", error);
}

export { db };