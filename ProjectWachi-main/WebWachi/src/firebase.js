import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ตั้งค่า Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBQxyTdXu_tLr0MxCj8D8_o6b_rlp6u1qc",
    authDomain: "web2567-2ae3c.firebaseapp.com",
    projectId: "web2567-2ae3c",
    storageBucket: "web2567-2ae3c.firebasestorage.app",
    messagingSenderId: "3818215302",
    appId: "1:3818215302:web:c0ed0b7e9ea0519023fe07",
    measurementId: "G-KYSZTEQ4HJ"
  };

// เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // ✅ ตรวจสอบให้แน่ใจว่ามีการส่งออก auth
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
