// Firebase 配置文件
// 請將此處的配置替換為您的 Firebase 專案配置

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// TODO: 請將以下配置替換為您的 Firebase 專案配置
// 在 Firebase Console 中: Project Settings > General > Your apps > Firebase SDK snippet > Config
const firebaseConfig = {
  apiKey: "AIzaSyAzSrgjDJpACM3uJte8Qx1u4m1uW7TyOYE",
  authDomain: "school-toilet-rating-system.firebaseapp.com",
  projectId: "school-toilet-rating-system",
  storageBucket: "school-toilet-rating-system.firebasestorage.app",
  messagingSenderId: "200033079453",
  appId: "1:200033079453:web:db47b925234c090f370474"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 導出 Firebase 服務
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
