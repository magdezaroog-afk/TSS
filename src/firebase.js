import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; 

// الإعدادات الحقيقية الخاصة بمشروعك (ticketing-litc)
export const firebaseConfig = {
  apiKey: "AIzaSyDD6k4jrFcbRyBVhuplNNa99-a9-0wWyNo",
  authDomain: "ticketing-litc.firebaseapp.com",
  projectId: "ticketing-litc",
  storageBucket: "ticketing-litc.firebasestorage.app",
  messagingSenderId: "811131777154",
  appId: "1:811131777154:web:62e91234a0245ec47ac49b",
  measurementId: "G-EQ2QWHW86J"
};

// تشغيل الفايربيس
const app = initializeApp(firebaseConfig);

// تصدير الأدوات لاستخدامها في باقي صفحات المشروع
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); 
