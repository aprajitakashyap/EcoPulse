import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Add your Firebase configuration here. In a real app, this should come from env variables.
// For the Hack2Skill hackathon, you must paste your config here before running.
const firebaseConfig = {
  apiKey: "AIzaSyCfXaXVn_y3DpGwjxnErYlePm4OSr-ZTTQ",
  authDomain: "ecopulse-cefdf.firebaseapp.com",
  projectId: "ecopulse-cefdf",
  storageBucket: "ecopulse-cefdf.firebasestorage.app",
  messagingSenderId: "595316444760",
  appId: "1:595316444760:web:13b83a0481091e7a00442d",
  measurementId: "G-8WB1JGREYP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const registerWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
