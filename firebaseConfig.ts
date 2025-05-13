// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxFmu6Eb3Q4sY4hPgynZX5D1EkvyYY8Vo",
  authDomain: "gemini-interface-nbpba.firebaseapp.com",
  projectId: "gemini-interface-nbpba",
  storageBucket: "gemini-interface-nbpba.firebasestorage.app",
  messagingSenderId: "333268398694",
  appId: "1:333268398694:web:a807552e4439896a7933a7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
