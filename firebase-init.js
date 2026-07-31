const firebaseConfig = {
  apiKey: "AIzaSyAnljwFGD-0XP-dpmxJu1q4jdbAgSfka2Y",
  authDomain: "nine9981-2dced.firebaseapp.com",
  databaseURL: "https://nine9981-2dced-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nine9981-2dced",
  storageBucket: "nine9981-2dced.firebasestorage.app",
  messagingSenderId: "711497509866",
  appId: "1:711497509866:web:9db8f9df21992d3ca66093",
  measurementId: "G-KJTT4T87CS"
};
firebase.initializeApp(firebaseConfig);
window.fbAuth = firebase.auth();
window.fbDb = firebase.firestore();
window.googleProvider = new firebase.auth.GoogleAuthProvider();
