// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyD6rKIBZ8i8rWQ7FM3j_HcEpNwLieEq6FM",
  authDomain: "susupro-7e42c.firebaseapp.com",
  projectId: "susupro-7e42c",
  storageBucket: "susupro-7e42c.firebasestorage.app",
  messagingSenderId: "889938534152",
  appId: "1:889938534152:web:edadc73a89c941d93396bd",
  measurementId: "G-WM20YJCG6T"
});
 
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
