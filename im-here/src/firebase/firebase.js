// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdFYHNjvrmWaJMfmcwCdofLHziP84rzas",
  authDomain: "swampkings-49846.firebaseapp.com",
  projectId: "swampkings-49846",
  storageBucket: "swampkings-49846.firebasestorage.app",
  messagingSenderId: "578907854472",
  appId: "1:578907854472:web:2ada139943310fff14b13d",
  measurementId: "G-7EV30QRNR3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;