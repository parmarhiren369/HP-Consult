import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const configuredStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hp-consult.firebasestorage.app";

const firebaseConfig = {
  apiKey: "AIzaSyBbCFpEQSr3XSQAkUKM7ZPM5Zu9dVjK2t0",
  authDomain: "hp-consult.firebaseapp.com",
  projectId: "hp-consult",
  storageBucket: configuredStorageBucket,
  messagingSenderId: "365163297476",
  appId: "1:365163297476:web:7aee73539b49f8607be791",
  measurementId: "G-RJSZD0V7FT",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app, `gs://${configuredStorageBucket}`);

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}
