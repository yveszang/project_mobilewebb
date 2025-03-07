import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyBQxyTdXu_tLr0MxCj8D8_o6b_rlp6u1qc",
    authDomain: "web2567-2ae3c.firebaseapp.com",
    projectId: "web2567-2ae3c",
    storageBucket: "web2567-2ae3c.firebasestorage.app",
    messagingSenderId: "3818215302",
    appId: "1:3818215302:web:c0ed0b7e9ea0519023fe07",
    measurementId: "G-KYSZTEQ4HJ"
  };


  

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
