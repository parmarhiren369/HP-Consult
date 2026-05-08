import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const configuredStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shreyash-9f542.firebasestorage.app";

const firebaseConfig = {
  apiKey: "AIzaSyDn7RKUTHQhKxrZPcgpP8I9DI0RMqf2RZo",
  authDomain: "shreyash-9f542.firebaseapp.com",
  projectId: "shreyash-9f542",
  storageBucket: configuredStorageBucket,
  messagingSenderId: "865258059659",
  appId: "1:865258059659:web:768a61c3c32a5c409ae18e",
  measurementId: "G-C0WJP1Q560",
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
