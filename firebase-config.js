// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnljwFGD-0XP-dpmxJu1q4jdbAgSfka2Y",
  authDomain: "nine9981-2dced.firebaseapp.com",
  projectId: "nine9981-2dced",
  storageBucket: "nine9981-2dced.firebasestorage.app",
  messagingSenderId: "711497509866",
  appId: "1:711497509866:web:9db8f9df21992d3ca66093",
  measurementId: "G-KJTT4T87CS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
