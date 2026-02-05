// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCw_VwnzJ--jnp8WcePXsGVjnxP2NDu3QA",
  authDomain: "susu-pro-6f2a9.firebaseapp.com",
  projectId: "susu-pro-6f2a9",
  storageBucket: "susu-pro-6f2a9.firebasestorage.app",
  messagingSenderId: "82489929158",
  appId: "1:82489929158:web:32f0588c87c508fe0b16c7",
  measurementId: "G-XTQT397QDP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
export const messaging = getMessaging(app);
const analytics = getAnalytics(app);