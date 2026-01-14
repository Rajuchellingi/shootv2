import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your actual Firebase project configuration
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_PROJECT_ID.appspot.com",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID"
// };

const firebaseConfig = {
  apiKey: "AIzaSyDwTL6pLSAqP4geS7cA0tm9RLIhqa7Tb04",
  authDomain: "ai-image-d6431.firebaseapp.com",
  projectId: "ai-image-d6431",
  storageBucket: "ai-image-d6431.firebasestorage.app",
  messagingSenderId: "1003671971176",
  appId: "1:1003671971176:web:f82a03e8d457f1e0f862dd"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);