// ─── Firebase Configuration ───

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD39NxL6_1FWGUYNt6ZHC187OB3lvdTOeU",
  authDomain: "fixit-6167d.firebaseapp.com",
  projectId: "fixit-6167d",
  storageBucket: "fixit-6167d.firebasestorage.app",
  messagingSenderId: "1080637793002",
  appId: "1:1080637793002:web:c12498744c61c60b5dad93",
  measurementId: "G-P7YV6ECEZ9",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
